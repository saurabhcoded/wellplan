import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface Exercise {
  id: string;
  name: string;
  description: string;
  tags: string[];
  media_url: string;
  media_type: "gif" | "youtube" | "image";
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ExerciseFormData {
  name: string;
  description: string;
  tags: string[];
  media_url: string;
  media_type: "gif" | "youtube" | "image";
}

// Fetch all exercises
const fetchExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from("exercise_library")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Create exercise
const createExercise = async ({
  exercise,
  userId,
}: {
  exercise: ExerciseFormData;
  userId: string;
}): Promise<Exercise> => {
  const { data, error } = await supabase
    .from("exercise_library")
    .insert([{ ...exercise, created_by: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update exercise
const updateExercise = async ({
  id,
  exercise,
}: {
  id: string;
  exercise: ExerciseFormData;
}): Promise<Exercise> => {
  const { data, error } = await supabase
    .from("exercise_library")
    .update(exercise)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete exercise
const deleteExercise = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("exercise_library")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Hook to fetch exercises
export const useExercises = () => {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: fetchExercises,
    staleTime: 10 * 60 * 1000, // 10 minutes - exercises don't change often
  });
};

// Hook to create exercise
export const useCreateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Exercise created successfully!");
    },
    onError: (error) => {
      console.error("Error creating exercise:", error);
      toast.error("Error creating exercise. Please try again.");
    },
  });
};

// Hook to update exercise
export const useUpdateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExercise,
    onMutate: async ({ id, exercise }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["exercises"] });

      // Snapshot the previous value
      const previousExercises = queryClient.getQueryData<Exercise[]>([
        "exercises",
      ]);

      // Optimistically update to the new value
      if (previousExercises) {
        queryClient.setQueryData<Exercise[]>(["exercises"], (old) =>
          old
            ? old.map((ex) => (ex.id === id ? { ...ex, ...exercise } : ex))
            : []
        );
      }

      return { previousExercises };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousExercises) {
        queryClient.setQueryData(["exercises"], context.previousExercises);
      }
      console.error("Error updating exercise:", error);
      toast.error("Error updating exercise. Please try again.");
    },
    onSuccess: () => {
      toast.success("Exercise updated successfully!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
};

// Hook to delete exercise
export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExercise,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["exercises"] });

      // Snapshot the previous value
      const previousExercises = queryClient.getQueryData<Exercise[]>([
        "exercises",
      ]);

      // Optimistically remove the exercise
      if (previousExercises) {
        queryClient.setQueryData<Exercise[]>(["exercises"], (old) =>
          old ? old.filter((ex) => ex.id !== id) : []
        );
      }

      return { previousExercises };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousExercises) {
        queryClient.setQueryData(["exercises"], context.previousExercises);
      }
      console.error("Error deleting exercise:", error);
      toast.error("Error deleting exercise. Please try again.");
    },
    onSuccess: () => {
      toast.success("Exercise deleted successfully!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
};

