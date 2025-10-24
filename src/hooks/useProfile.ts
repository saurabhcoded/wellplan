import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  height_cm?: number;
  height_unit?: "cm" | "ft";
  age?: number;
  gender?: string;
  body_fat_percentage?: number;
  role?: "admin" | "fitninja";
}

// Fetch profile
const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Create profile (fallback if trigger fails)
const createProfile = async ({
  userId,
  email,
  fullName,
}: {
  userId: string;
  email: string;
  fullName?: string;
}): Promise<Profile> => {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      full_name: fullName || email.split("@")[0],
      role: "fitninja",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update profile
const updateProfile = async ({
  userId,
  updates,
}: {
  userId: string;
  updates: Partial<Profile>;
}) => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Hooks
export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProfile,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["profile", variables.userId], data);
      console.log("Profile created successfully:", data);
    },
    onError: (error) => {
      console.error("Error creating profile:", error);
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async ({ userId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(["profile", userId]);

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData(["profile", userId], {
          ...previousProfile,
          ...updates,
        });
      }

      return { previousProfile };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ["profile", variables.userId],
          context.previousProfile
        );
      }
      console.error("Error updating profile:", error);
      toast.error("Error updating profile. Please try again.");
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["profile", variables.userId], data);
      toast.success("Profile updated successfully!");
    },
  });
};

