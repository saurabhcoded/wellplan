import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, STORAGE_BUCKET } from "../lib/supabase";
import toast from "react-hot-toast";

interface MediaResource {
  id: string;
  user_id: string;
  file_path: string;
  media_type: string;
  uploaded_at: string;
}

interface PhotoWithUrl extends MediaResource {
  signedUrl?: string;
}

// Fetch photos
const fetchPhotos = async (userId: string): Promise<MediaResource[]> => {
  const { data, error } = await supabase
    .from("media_resources")
    .select("*")
    .eq("user_id", userId)
    .eq("resource_type", "progress_photo")
    .order("taken_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get signed URL for a photo
const getPhotoSignedUrl = async (filePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
};

// Upload photo
const uploadPhoto = async ({
  userId,
  file,
  compressedBlob,
}: {
  userId: string;
  file: File;
  compressedBlob: Blob;
}) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${userId}/physical-progress/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, compressedBlob, {
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  // Save to database
  const { data, error: dbError } = await supabase
    .from("media_resources")
    .insert({
      user_id: userId,
      file_path: filePath,
      file_name: fileName,
      resource_type: "progress_photo",
      mime_type: file.type,
      file_size: compressedBlob.size,
      taken_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};

// Delete photo
const deletePhoto = async ({
  photoId,
  filePath,
}: {
  photoId: string;
  filePath: string;
}) => {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase
    .from("media_resources")
    .delete()
    .eq("id", photoId);

  if (dbError) throw dbError;
};

// Hooks
export const usePhotos = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["photos", userId],
    queryFn: () => fetchPhotos(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const usePhotoSignedUrl = (filePath: string | undefined) => {
  return useQuery({
    queryKey: ["photoSignedUrl", filePath],
    queryFn: () => getPhotoSignedUrl(filePath!),
    enabled: !!filePath,
    staleTime: 50 * 60 * 1000, // 50 minutes (before 1 hour expiry)
  });
};

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadPhoto,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["photos", variables.userId] });
      toast.success("Photo uploaded successfully!");
    },
    onError: (error) => {
      console.error("Error uploading photo:", error);
      toast.error("Error uploading photo. Please try again.");
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePhoto,
    onMutate: async ({ photoId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["photos"] });

      // Snapshot previous value
      const previousPhotos = queryClient.getQueryData<PhotoWithUrl[]>(["photos"]);

      // Optimistically remove the photo
      if (previousPhotos) {
        queryClient.setQueryData<PhotoWithUrl[]>(
          ["photos"],
          previousPhotos.filter((photo) => photo.id !== photoId)
        );
      }

      return { previousPhotos };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousPhotos) {
        queryClient.setQueryData(["photos"], context.previousPhotos);
      }
      console.error("Error deleting photo:", error);
      toast.error("Error deleting photo. Please try again.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
      toast.success("Photo deleted successfully!");
    },
  });
};

