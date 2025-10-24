import { useState, useEffect, useRef } from "react";
import { supabase, MediaResource, STORAGE_BUCKET } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Trash2,
  ZoomIn,
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
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
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

  const uploadPhoto = async (file: File, isCamera: boolean = false) => {
    if (!user) return;

    setUploading(true);

    try {
      // Validate file
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        alert("File size must be less than 10MB");
        return;
      }

      // Create unique filename
      const timestamp = new Date().getTime();
      const fileExt = file.name.split(".").pop();
      const fileName = `photo_${timestamp}.${fileExt}`;
      const filePath = `${user.id}/progress/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
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
          mime_type: file.type,
          file_size: file.size,
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
        alert("Photo uploaded successfully!");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
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
    if (!confirm("Are you sure you want to delete this photo?")) return;

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
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
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
                className="relative group flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 rounded-lg overflow-hidden bg-slate-900 border border-slate-700"
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
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      photo.signedUrl && setSelectedPhoto(photo.signedUrl)
                    }
                    disabled={!photo.signedUrl}
                    className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ZoomIn className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => deletePhoto(photo)}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
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
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedPhoto}
            alt="Progress photo preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

