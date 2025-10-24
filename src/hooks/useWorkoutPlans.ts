import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, WorkoutPlan, WorkoutDay } from "../lib/supabase";
import toast from "react-hot-toast";

// Fetch user's workout plans
const fetchWorkoutPlans = async (userId: string) => {
  const { data, error } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as WorkoutPlan[];
};

// Fetch workout days for a plan
const fetchWorkoutDays = async (planId: string) => {
  const { data, error } = await supabase
    .from("workout_days")
    .select("*")
    .eq("plan_id", planId)
    .order("day_of_week", { ascending: true });

  if (error) throw error;
  return data as WorkoutDay[];
};

// Fetch published plans
const fetchPublishedPlans = async () => {
  const { data, error } = await supabase
    .from("published_plans")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Fetch published workout days for a plan
const fetchPublishedWorkoutDays = async (planId: string) => {
  const { data, error } = await supabase
    .from("published_workout_days")
    .select("*")
    .eq("published_plan_id", planId)
    .order("day_of_week", { ascending: true });

  if (error) throw error;
  return data;
};

// Hooks
export const useWorkoutPlans = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["workoutPlans", userId],
    queryFn: () => fetchWorkoutPlans(userId!),
    enabled: !!userId,
  });
};

export const useWorkoutDays = (planId: string | undefined) => {
  return useQuery({
    queryKey: ["workoutDays", planId],
    queryFn: () => fetchWorkoutDays(planId!),
    enabled: !!planId,
  });
};

export const usePublishedPlans = () => {
  return useQuery({
    queryKey: ["publishedPlans"],
    queryFn: fetchPublishedPlans,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePublishedWorkoutDays = (planId: string | undefined) => {
  return useQuery({
    queryKey: ["publishedWorkoutDays", planId],
    queryFn: () => fetchPublishedWorkoutDays(planId!),
    enabled: !!planId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutations
export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, name }: { userId: string; name: string }) => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // Default 1 week duration

      const { data, error } = await supabase
        .from("workout_plans")
        .insert({
          user_id: userId,
          name,
          is_active: false,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["workoutPlans", variables.userId],
      });
      toast.success("Plan created successfully!");
    },
    onError: () => {
      toast.error("Error creating plan. Please try again.");
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, name }: { planId: string; name: string }) => {
      const { data, error } = await supabase
        .from("workout_plans")
        .update({ name })
        .eq("id", planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["workoutPlans"],
      });
      toast.success("Plan updated successfully!");
    },
    onError: () => {
      toast.error("Error updating plan. Please try again.");
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from("workout_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutPlans"] });
      toast.success("Plan deleted successfully!");
    },
    onError: () => {
      toast.error("Error deleting plan. Please try again.");
    },
  });
};

export const useActivatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      planId,
    }: {
      userId: string;
      planId: string;
    }) => {
      // Deactivate all plans first
      await supabase
        .from("workout_plans")
        .update({ is_active: false })
        .eq("user_id", userId);

      // Activate the selected plan
      const { data, error } = await supabase
        .from("workout_plans")
        .update({ is_active: true })
        .eq("id", planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["workoutPlans", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["activePlan", variables.userId],
      });
      toast.success("Plan activated successfully!");
    },
    onError: () => {
      toast.error("Error activating plan. Please try again.");
    },
  });
};

export const useUpdateWorkoutDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dayId,
      exercises,
      isRestDay,
    }: {
      dayId: string;
      exercises: any[];
      isRestDay: boolean;
    }) => {
      const { data, error } = await supabase
        .from("workout_days")
        .update({ exercises, is_rest_day: isRestDay })
        .eq("id", dayId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["workoutDays", data.plan_id],
      });
      queryClient.invalidateQueries({ queryKey: ["todayWorkout"] });
      toast.success("Workout day updated successfully!");
    },
    onError: () => {
      toast.error("Error updating workout day. Please try again.");
    },
  });
};

export const useCopyPublishedPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      publishedPlanId,
      planName,
      publishedDays,
    }: {
      userId: string;
      publishedPlanId: string;
      planName: string;
      publishedDays: any[];
    }) => {
      // Calculate duration based on number of workout days (default to 4 weeks)
      const startDate = new Date();
      const endDate = new Date();
      const durationWeeks =
        publishedDays.length > 0 ? Math.ceil(publishedDays.length / 7) : 4;
      endDate.setDate(endDate.getDate() + durationWeeks * 7);

      // Create new plan
      const { data: newPlan, error: planError } = await supabase
        .from("workout_plans")
        .insert({
          user_id: userId,
          name: planName,
          is_active: false,
          source_published_plan_id: publishedPlanId,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create workout days
      const workoutDays = publishedDays.map((day) => ({
        plan_id: newPlan.id,
        day_of_week: day.day_of_week,
        exercises: day.exercises,
        is_rest_day: day.is_rest_day,
      }));

      const { error: daysError } = await supabase
        .from("workout_days")
        .insert(workoutDays);

      if (daysError) throw daysError;

      return newPlan;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["workoutPlans", variables.userId],
      });
      toast.success("Plan copied successfully!");
    },
    onError: () => {
      toast.error("Error copying plan. Please try again.");
    },
  });
};

