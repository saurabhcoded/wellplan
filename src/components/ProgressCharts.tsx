import { useState, useEffect } from 'react';
import { supabase, DailyLog, WeightLog } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Calendar, Activity } from 'lucide-react';

type TimeRange = 'week' | 'month';

export default function ProgressCharts() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [stats, setStats] = useState({
    completedWorkouts: 0,
    totalWorkouts: 0,
    weightChange: 0,
    startWeight: 0,
    currentWeight: 0,
  });

  useEffect(() => {
    loadData();
  }, [user, timeRange]);

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

  const maxWeight = Math.max(
    ...(weightData.filter((w) => w !== null) as number[]),
    0
  );
  const minWeight = Math.min(
    ...(weightData.filter((w) => w !== null) as number[]),
    0
  );
  const weightRange = maxWeight - minWeight || 10;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
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
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeRange === "week"
                ? "bg-blue-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeRange === "month"
                ? "bg-blue-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-slate-400 text-sm font-medium">
              Workout Completion
            </h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.totalWorkouts > 0
              ? Math.round(
                  (stats.completedWorkouts / stats.totalWorkouts) * 100
                )
              : 0}
            %
          </div>
          <div className="text-slate-500 text-sm mb-3">
            {stats.completedWorkouts} of {stats.totalWorkouts} workouts
          </div>
          {/* Progress bar with graduated greens */}
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${(() => {
                const progress =
                  stats.totalWorkouts > 0
                    ? (stats.completedWorkouts / stats.totalWorkouts) * 100
                    : 0;
                if (progress === 0) return "bg-slate-600";
                if (progress < 33) return "bg-emerald-900/80";
                if (progress < 67) return "bg-emerald-700/90";
                if (progress < 100) return "bg-emerald-600";
                return "bg-gradient-to-r from-green-500 to-emerald-400";
              })()}`}
              style={{
                width: `${
                  stats.totalWorkouts > 0
                    ? (stats.completedWorkouts / stats.totalWorkouts) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-slate-400 text-sm font-medium">
              Weight Change
            </h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.weightChange > 0 ? "+" : ""}
            {stats.weightChange.toFixed(1)}
            <span className="text-xl text-slate-400 ml-1">
              {weightLogs[0]?.unit || "kg"}
            </span>
          </div>
          <div className="text-slate-500 text-sm">
            {stats.startWeight > 0 &&
              `${stats.startWeight} → ${stats.currentWeight}`}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Streak</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {(() => {
              let streak = 0;
              const sortedLogs = [...dailyLogs].sort(
                (a, b) =>
                  new Date(b.log_date).getTime() -
                  new Date(a.log_date).getTime()
              );

              for (const log of sortedLogs) {
                if (log.workout_completed) streak++;
                else break;
              }

              return streak;
            })()}
          </div>
          <div className="text-slate-500 text-sm">consecutive days</div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
        <h3 className="text-xl font-semibold text-white mb-6">
          Weight Progress
        </h3>
        <div className="relative h-64">
          <svg className="w-full h-full">
            <defs>
              <linearGradient
                id="weightGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor="rgb(59, 130, 246)"
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(59, 130, 246)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {labels.map((_, index) => {
              const x = (index / (labels.length - 1)) * 100;
              return (
                <line
                  key={index}
                  x1={`${x}%`}
                  y1="0"
                  x2={`${x}%`}
                  y2="100%"
                  stroke="rgb(51, 65, 85)"
                  strokeWidth="1"
                  opacity="0.3"
                />
              );
            })}

            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={`${y}%`}
                x2="100%"
                y2={`${y}%`}
                stroke="rgb(51, 65, 85)"
                strokeWidth="1"
                opacity="0.3"
              />
            ))}

            <polyline
              points={weightData
                .map((weight, index) => {
                  if (weight === null) return null;
                  const x = (index / (labels.length - 1)) * 100;
                  const y =
                    100 - ((weight - minWeight) / weightRange) * 80 - 10;
                  return `${x},${y}`;
                })
                .filter((p) => p !== null)
                .join(" ")}
              fill="url(#weightGradient)"
              stroke="none"
            />

            <polyline
              points={weightData
                .map((weight, index) => {
                  if (weight === null) return null;
                  const x = (index / (labels.length - 1)) * 100;
                  const y =
                    100 - ((weight - minWeight) / weightRange) * 80 - 10;
                  return `${x},${y}`;
                })
                .filter((p) => p !== null)
                .join(" ")}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {weightData.map((weight, index) => {
              if (weight === null) return null;
              const x = (index / (labels.length - 1)) * 100;
              const y = 100 - ((weight - minWeight) / weightRange) * 80 - 10;
              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="4"
                  fill="rgb(59, 130, 246)"
                  stroke="rgb(15, 23, 42)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 mt-2">
            {labels
              .filter((_, i) => timeRange === "week" || i % 5 === 0)
              .map((label, index) => (
                <span key={index}>
                  {new Date(label).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
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
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-400 rounded" />
            <span>Fully Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-700 rounded" />
            <span>Partially Done</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-900 rounded" />
            <span>Started</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-700 rounded" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-700 border-2 border-blue-400 rounded" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
