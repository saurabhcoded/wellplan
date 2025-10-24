import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  supabase,
  MediaResource,
  STORAGE_BUCKET,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

interface PhotoWithUrl extends MediaResource {
  signedUrl?: string;
}

export default function PhysicalProgressLogger() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithUrl | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPhotos();
  }, [user]);

  const loadPhotos = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("media_resources")
      .select("*")
      .eq("user_id", user.id)
      .eq("resource_type", "progress_photo")
      .order("taken_at", { ascending: false })
      .limit(10);

    if (data && !error) {
      // Get signed URLs for each photo (valid for 1 hour)
      const photosWithUrls = await Promise.all(
        data.map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(photo.file_path, 3600); // 1 hour expiry

          return {
            ...photo,
            signedUrl: urlData?.signedUrl || undefined,
          };
        })
      );
      setPhotos(photosWithUrls);
    }
    setLoading(false);
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Calculate new dimensions to maintain aspect ratio
          let width = img.width;
          let height = img.height;
          const maxDimension = 2048; // Max width or height

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Try different quality levels to get under the size limit
          const tryCompress = (quality: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Could not compress image"));
                  return;
                }

                // Check if the compressed image is under the limit
                if (blob.size <= MAX_FILE_SIZE_BYTES || quality <= 0.1) {
                  const compressedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // Try with lower quality
                  tryCompress(quality - 0.1);
                }
              },
              "image/jpeg",
              quality
            );
          };

          tryCompress(0.9);
        };
        img.onerror = () => reject(new Error("Could not load image"));
      };
      reader.onerror = () => reject(new Error("Could not read file"));
    });
  };

  const uploadPhoto = async (file: File, isCamera: boolean = false) => {
    if (!user) return;

    setUploading(true);

    try {
      // Validate file
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      let fileToUpload = file;

      // Check if file size exceeds the limit and compress if needed
      if (file.size > MAX_FILE_SIZE_BYTES) {
        console.log(
          `Image size (${(file.size / 1024 / 1024).toFixed(
            2
          )}MB) exceeds ${MAX_FILE_SIZE_MB}MB limit. Compressing...`
        );
        try {
          fileToUpload = await compressImage(file);
          console.log(
            `Compressed to ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`
          );
        } catch (error) {
          console.error("Compression error:", error);
          toast.error(
            `Failed to compress image. Please try a smaller image (max ${MAX_FILE_SIZE_MB}MB).`
          );
          return;
        }
      }

      // Create unique filename
      const timestamp = new Date().getTime();
      const fileExt = fileToUpload.name.split(".").pop();
      const fileName = `photo_${timestamp}.${fileExt}`;
      const filePath = `${user.id}/progress/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, fileToUpload, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Save metadata to database
      const { data, error: dbError } = await supabase
        .from("media_resources")
        .insert({
          user_id: user.id,
          resource_type: "progress_photo",
          file_path: filePath,
          file_name: fileName,
          mime_type: fileToUpload.type,
          file_size: fileToUpload.size,
          description: isCamera ? "Camera capture" : "Uploaded photo",
          taken_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      if (data) {
        // Get signed URL for the new photo
        const { data: urlData } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(data.file_path, 3600);

        const photoWithUrl = {
          ...data,
          signedUrl: urlData?.signedUrl || undefined,
        };

        setPhotos([photoWithUrl, ...photos]);
        toast.success("Progress photo added successfully!");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto(file, false);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const deletePhoto = async (photo: MediaResource) => {
    const result = await Swal.fire({
      title: "Delete Photo?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      background: "#1e293b",
      color: "#fff",
      customClass: {
        popup: "rounded-xl border border-slate-700",
        title: "text-xl",
        htmlContainer: "text-slate-300",
      },
    });

    if (!result.isConfirmed) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([photo.file_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("media_resources")
        .delete()
        .eq("id", photo.id);

      if (dbError) {
        throw dbError;
      }

      setPhotos(photos.filter((p) => p.id !== photo.id));
      toast.success("Photo deleted successfully");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-center h-40">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Physical Progress
          </h3>
        </div>
        <div className="flex gap-2">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload an image from your device"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {uploading && (
        <div className="flex items-center justify-center gap-2 text-blue-400 mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Uploading photo...</span>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No progress photos yet</p>
          <p className="text-xs mt-1">
            Take a photo or upload one to track your progress
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full pb-2">
          <div className="flex gap-3 min-w-min">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => photo.signedUrl && setSelectedPhoto(photo)}
              >
                {photo.signedUrl ? (
                  <img
                    src={photo.signedUrl}
                    alt="Progress photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                  <p className="text-xs text-white">
                    {new Date(photo.taken_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedPhoto && selectedPhoto.signedUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePhoto(selectedPhoto);
                setSelectedPhoto(null);
              }}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
              title="Delete photo"
            >
              <Trash2 className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              title="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <img
            src={selectedPhoto.signedUrl}
            alt="Progress photo preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

