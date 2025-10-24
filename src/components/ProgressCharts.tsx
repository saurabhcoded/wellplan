import { useState, useEffect } from 'react';
import { supabase, DailyLog, WeightLog } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Scale } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import WorkoutCompletionCard from "./progress/WorkoutCompletionCard";
import WeightChangeCard from "./progress/WeightChangeCard";
import StreakCard from "./progress/StreakCard";
import BMICard from "./progress/BMICard";

type TimeRange = "week" | "month";

export default function ProgressCharts() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [stats, setStats] = useState({
    completedWorkouts: 0,
    totalWorkouts: 0,
    weightChange: 0,
    startWeight: 0,
    currentWeight: 0,
  });

  useEffect(() => {
    loadData();
    loadProfile();
  }, [user, timeRange]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("height_cm")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.height_cm) {
      setHeightCm(data.height_cm);
    }
  };

  const loadData = async () => {
    if (!user) return;

    let startDate: Date;
    if (timeRange === "week") {
      // Get Monday of current week
      startDate = new Date();
      const dayOfWeek = startDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, else go to Monday
      startDate.setDate(startDate.getDate() + diff);
    } else {
      // Get 1st of current month
      startDate = new Date();
      startDate.setDate(1);
    }
    const startDateStr = startDate.toISOString().split("T")[0];

    const { data: weights } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", startDateStr)
      .order("log_date");

    const { data: logs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", startDateStr)
      .order("log_date");

    if (weights) setWeightLogs(weights);
    if (logs) setDailyLogs(logs);

    if (weights && weights.length > 0) {
      const start = weights[0].weight;
      const current = weights[weights.length - 1].weight;
      const change = current - start;

      setStats((prev) => ({
        ...prev,
        weightChange: change,
        startWeight: start,
        currentWeight: current,
      }));
    }

    if (logs) {
      const completed = logs.filter((log) => log.workout_completed).length;
      setStats((prev) => ({
        ...prev,
        completedWorkouts: completed,
        totalWorkouts: logs.length,
      }));
    }
  };

  const getDateLabels = () => {
    const labels: string[] = [];

    if (timeRange === "week") {
      // Get Monday of current week
      const monday = new Date();
      const dayOfWeek = monday.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, else go to Monday
      monday.setDate(monday.getDate() + diff);

      // Generate Monday to Sunday (7 days)
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        labels.push(date.toISOString().split("T")[0]);
      }
    } else {
      // Get entire current month (1st to last day)
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month

      // Generate dates from 1st to last day of month
      const currentDate = new Date(firstDay);
      while (currentDate <= lastDay) {
        labels.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return labels;
  };

  const getWeightData = () => {
    const labels = getDateLabels();
    return labels.map((date) => {
      const log = weightLogs.find((w) => w.log_date === date);
      return log ? log.weight : null;
    });
  };

  const getWorkoutData = () => {
    const labels = getDateLabels();
    return labels.map((date) => {
      const log = dailyLogs.find((l) => l.log_date === date);
      if (!log) return 0;

      // If we have completed_exercises data, calculate percentage
      if (log.completed_exercises && Array.isArray(log.completed_exercises)) {
        const completedCount = log.completed_exercises.length;
        if (completedCount === 0) return 0;
        // Return a value between 0-100 representing completion percentage
        // We'll use this to determine green intensity
        return completedCount;
      }

      // Fallback to old binary system
      return log.workout_completed ? 100 : 0;
    });
  };

  const weightData = getWeightData();
  const workoutData = getWorkoutData();
  const labels = getDateLabels();

  // Transform data for Recharts - keep all dates, including those without weight data
  const chartData = labels.map((date, index) => ({
    date: new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    weight: weightData[index],
    fullDate: date,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-row items-start justify-between mb-6 gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white">Progress</h2>
          <p className="text-sm text-slate-400 mt-1">
            {timeRange === "week"
              ? (() => {
                  const monday = new Date();
                  const dayOfWeek = monday.getDay();
                  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                  monday.setDate(monday.getDate() + diff);
                  const sunday = new Date(monday);
                  sunday.setDate(monday.getDate() + 6);
                  return `${monday.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })} - ${sunday.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}`;
                })()
              : (() => {
                  const today = new Date();
                  return today.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  });
                })()}
          </p>
        </div>
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 sm:ml-auto">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              timeRange === "week"
                ? "bg-blue-500 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              timeRange === "month"
                ? "bg-blue-500 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
        <WorkoutCompletionCard
          completedWorkouts={stats.completedWorkouts}
          totalWorkouts={stats.totalWorkouts}
        />
        <WeightChangeCard
          weightChange={stats.weightChange}
          startWeight={stats.startWeight}
          currentWeight={stats.currentWeight}
          unit={weightLogs[0]?.unit || "kg"}
        />
        <StreakCard dailyLogs={dailyLogs} />
        <BMICard currentWeight={stats.currentWeight} heightCm={heightCm} />
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Workout Activity
          <span className="text-sm font-normal text-slate-400 ml-2">
            {timeRange === "week" ? "(Mon - Sun)" : "(Entire Month)"}
          </span>
        </h3>

        {/* Week day labels for weekly view */}
        {timeRange === "week" && (
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="text-center text-xs text-slate-500 font-medium"
              >
                {day}
              </div>
            ))}
          </div>
        )}

        <div
          className={`grid gap-2 ${
            timeRange === "week"
              ? "grid-cols-7"
              : "grid-cols-7 md:grid-cols-10 lg:grid-cols-15"
          }`}
        >
          {workoutData.map((exerciseCount, index) => {
            const date = labels[index];
            const log = dailyLogs.find((l) => l.log_date === date);
            const isToday = date === new Date().toISOString().split("T")[0];

            // Calculate completion intensity for graduated colors
            const getColorClass = () => {
              if (exerciseCount === 0) {
                return isToday
                  ? "bg-slate-700 border-2 border-blue-400"
                  : "bg-slate-700";
              }

              // If workout is marked as complete, use brightest green
              if (log?.workout_completed) {
                return "bg-gradient-to-br from-green-500 to-emerald-400";
              }

              // Otherwise show intensity based on exercise count
              // Assuming most workouts have 4-6 exercises
              if (exerciseCount === 1) return "bg-emerald-900/70";
              if (exerciseCount === 2) return "bg-emerald-800/80";
              if (exerciseCount === 3) return "bg-emerald-700/90";
              if (exerciseCount >= 4) return "bg-emerald-600";

              return "bg-emerald-600";
            };

            const getTooltip = () => {
              if (exerciseCount === 0) return "Not completed";
              if (log?.workout_completed) return "Fully completed! 🎉";
              return `${exerciseCount} exercise${
                exerciseCount > 1 ? "s" : ""
              } completed`;
            };

            return (
              <div
                key={index}
                className="relative group"
                title={`${new Date(
                  date
                ).toLocaleDateString()} - ${getTooltip()}`}
              >
                <div
                  className={`aspect-square rounded-lg transition-all duration-300 hover:scale-110 ${getColorClass()}`}
                />
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  <br />
                  {getTooltip()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3 gap-y-2 mt-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-emerald-400 rounded" />
            <span>Fully Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-700 rounded" />
            <span>Partially Done</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-900 rounded" />
            <span>Started</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-700 rounded" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-700 border-2 border-blue-400 rounded" />
            <span>Today</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-6">
          Weight Progress
        </h3>
        {weightLogs.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />
                <XAxis dataKey="date" hide={true} />
                <YAxis
                  hide={true}
                  domain={
                    weightLogs.length > 0
                      ? ["dataMin - 1", "dataMax + 1"]
                      : [0, 100]
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: any) => {
                    if (value === null || value === undefined) {
                      return ["No data", "Weight"];
                    }
                    return [
                      `${value} ${weightLogs[0]?.unit || "kg"}`,
                      "Weight",
                    ];
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#colorWeight)"
                  connectNulls={true}
                  dot={{
                    fill: "#3b82f6",
                    strokeWidth: 2,
                    r: 4,
                    stroke: "#0f172a",
                  }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No weight data available</p>
              <p className="text-sm mt-1">Log your weight to see progress</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
