import { useQuery } from "@tanstack/react-query";
import { supabase, DailyLog, WeightLog } from "../lib/supabase";

// Fetch daily logs for a date range
const fetchDailyLogs = async (userId: string, startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: true });

  if (error) throw error;
  return data as DailyLog[];
};

// Fetch weight logs for a date range
const fetchWeightLogs = async (userId: string, startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: true });

  if (error) throw error;
  return data as WeightLog[];
};

// Fetch all weight logs for calculating change
const fetchAllWeightLogs = async (userId: string) => {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: true });

  if (error) throw error;
  return data as WeightLog[];
};

// Hooks
export const useDailyLogs = (
  userId: string | undefined,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ["dailyLogs", userId, startDate, endDate],
    queryFn: () => fetchDailyLogs(userId!, startDate, endDate),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useWeightLogs = (
  userId: string | undefined,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ["weightLogs", userId, startDate, endDate],
    queryFn: () => fetchWeightLogs(userId!, startDate, endDate),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAllWeightLogs = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["allWeightLogs", userId],
    queryFn: () => fetchAllWeightLogs(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

