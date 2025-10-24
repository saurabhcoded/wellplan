import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, WorkoutDay, DailyLog, WeightLog } from "../lib/supabase";

// Fetch active workout plan
const fetchActivePlan = async (userId: string) => {
  const { data, error } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Fetch today's workout
const fetchTodayWorkout = async (planId: string, dayOfWeek: number) => {
  const { data, error } = await supabase
    .from("workout_days")
    .select("*")
    .eq("plan_id", planId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (error) throw error;
  return data as WorkoutDay | null;
};

// Fetch daily log
const fetchDailyLog = async (userId: string, today: string) => {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", today)
    .maybeSingle();

  if (error) throw error;
  return data as DailyLog | null;
};

// Fetch weight log
const fetchWeightLog = async (userId: string, today: string) => {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", today)
    .maybeSingle();

  if (error) throw error;
  return data as WeightLog | null;
};

// Fetch previous notes
const fetchPreviousNotes = async (userId: string) => {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data as DailyLog[];
};

// Hooks
export const useActivePlan = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["activePlan", userId],
    queryFn: () => fetchActivePlan(userId!),
    enabled: !!userId,
  });
};

export const useTodayWorkout = (planId: string | undefined, dayOfWeek: number) => {
  return useQuery({
    queryKey: ["todayWorkout", planId, dayOfWeek],
    queryFn: () => fetchTodayWorkout(planId!, dayOfWeek),
    enabled: !!planId,
  });
};

export const useDailyLog = (userId: string | undefined, today: string) => {
  return useQuery({
    queryKey: ["dailyLog", userId, today],
    queryFn: () => fetchDailyLog(userId!, today),
    enabled: !!userId,
  });
};

export const useWeightLog = (userId: string | undefined, today: string) => {
  return useQuery({
    queryKey: ["weightLog", userId, today],
    queryFn: () => fetchWeightLog(userId!, today),
    enabled: !!userId,
  });
};

export const usePreviousNotes = (userId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ["previousNotes", userId],
    queryFn: () => fetchPreviousNotes(userId!),
    enabled: !!userId && enabled,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Mutations
export const useToggleExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      today,
      exerciseName,
      completedExercises,
      todayLog,
    }: {
      userId: string;
      today: string;
      exerciseName: string;
      completedExercises: string[];
      todayLog: DailyLog | null;
    }) => {
      const newCompleted = completedExercises.includes(exerciseName)
        ? completedExercises
        : [...completedExercises, exerciseName];

      if (todayLog) {
        const { data, error } = await supabase
          .from("daily_logs")
          .update({ completed_exercises: newCompleted })
          .eq("id", todayLog.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("daily_logs")
          .insert({
            user_id: userId,
            log_date: today,
            workout_completed: false,
            completed_exercises: newCompleted,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["dailyLog", variables.userId, variables.today],
        data
      );
    },
  });
};

export const useSaveWeight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      today,
      weight,
      unit,
      weightLogId,
    }: {
      userId: string;
      today: string;
      weight: number;
      unit: "kg" | "lbs";
      weightLogId?: string;
    }) => {
      if (weightLogId) {
        const { data, error } = await supabase
          .from("weight_logs")
          .update({ weight, unit })
          .eq("id", weightLogId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("weight_logs")
          .insert({ user_id: userId, log_date: today, weight, unit })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["weightLog", variables.userId, variables.today],
        data
      );
    },
  });
};

export const useSaveNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      today,
      notes,
      todayLog,
    }: {
      userId: string;
      today: string;
      notes: string;
      todayLog: DailyLog | null;
    }) => {
      if (todayLog) {
        const { data, error} = await supabase
          .from("daily_logs")
          .update({ notes })
          .eq("id", todayLog.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("daily_logs")
          .insert({
            user_id: userId,
            log_date: today,
            workout_completed: false,
            notes,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onMutate: async (variables) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ["dailyLog", variables.userId, variables.today],
      });

      const previousLog = queryClient.getQueryData([
        "dailyLog",
        variables.userId,
        variables.today,
      ]);

      if (variables.todayLog) {
        queryClient.setQueryData(
          ["dailyLog", variables.userId, variables.today],
          { ...variables.todayLog, notes: variables.notes }
        );
      }

      return { previousLog };
    },
    onError: (error, variables, context) => {
      if (context?.previousLog) {
        queryClient.setQueryData(
          ["dailyLog", variables.userId, variables.today],
          context.previousLog
        );
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["dailyLog", variables.userId, variables.today],
        data
      );
      // Invalidate previous notes to refresh history
      queryClient.invalidateQueries({ queryKey: ["previousNotes", variables.userId] });
    },
  });
};

export const useCompleteWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      today,
      completedExercises,
      todayLog,
    }: {
      userId: string;
      today: string;
      completedExercises: string[];
      todayLog: DailyLog | null;
    }) => {
      if (todayLog) {
        const { data, error } = await supabase
          .from("daily_logs")
          .update({
            workout_completed: true,
            completed_exercises: completedExercises,
          })
          .eq("id", todayLog.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("daily_logs")
          .insert({
            user_id: userId,
            log_date: today,
            workout_completed: true,
            completed_exercises: completedExercises,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["dailyLog", variables.userId, variables.today],
        data
      );
    },
  });
};

