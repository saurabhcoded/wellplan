import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase, PublishedPlan, PublishedWorkoutDay } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Copy,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function PublishedPlansLibrary() {
  const { user } = useAuth();
  const [publishedPlans, setPublishedPlans] = useState<PublishedPlan[]>([]);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [workoutDays, setWorkoutDays] = useState<{
    [key: string]: PublishedWorkoutDay[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState<string | null>(null);

  useEffect(() => {
    loadPublishedPlans();
  }, []);

  const loadPublishedPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("published_plans")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setPublishedPlans(data);
    }
    setLoading(false);
  };

  const loadWorkoutDays = async (planId: string) => {
    if (workoutDays[planId]) return; // Already loaded

    const { data } = await supabase
      .from("published_workout_days")
      .select("*")
      .eq("published_plan_id", planId)
      .order("day_of_week");

    if (data) {
      setWorkoutDays((prev) => ({ ...prev, [planId]: data }));
    }
  };

  const togglePlanExpansion = async (planId: string) => {
    if (expandedPlan === planId) {
      setExpandedPlan(null);
    } else {
      setExpandedPlan(planId);
      await loadWorkoutDays(planId);
    }
  };

  const copyPlanToMyPlans = async (publishedPlan: PublishedPlan) => {
    if (!user) return;

    setCopying(publishedPlan.id);

    try {
      // Load workout days if not already loaded
      let days = workoutDays[publishedPlan.id];
      if (!days) {
        const { data } = await supabase
          .from("published_workout_days")
          .select("*")
          .eq("published_plan_id", publishedPlan.id)
          .order("day_of_week");
        days = data || [];
      }

      // Create new workout plan
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(
        endDate.getDate() + (publishedPlan.duration_weeks || 1) * 7
      );

      const { data: newPlan, error: planError } = await supabase
        .from("workout_plans")
        .insert({
          user_id: user.id,
          name: publishedPlan.name,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          is_active: false,
          source_published_plan_id: publishedPlan.id,
        })
        .select()
        .single();

      if (planError || !newPlan) {
        throw planError;
      }

      // Copy workout days
      const workoutDaysToInsert = days.map((day) => ({
        plan_id: newPlan.id,
        day_of_week: day.day_of_week,
        is_rest_day: day.is_rest_day,
        workout_name: day.workout_name,
        exercises: day.exercises,
      }));

      const { error: daysError } = await supabase
        .from("workout_days")
        .insert(workoutDaysToInsert);

      if (daysError) {
        throw daysError;
      }

      toast.success(
        `Successfully copied "${publishedPlan.name}" to your plans! You can now activate and customize it.`
      );
    } catch (error) {
      console.error("Error copying plan:", error);
      toast.error("Failed to copy plan. Please try again.");
    } finally {
      setCopying(null);
    }
  };

  const getDifficultyColor = (
    level: string | null
  ): { bg: string; text: string } => {
    switch (level) {
      case "beginner":
        return { bg: "bg-green-500/20", text: "text-green-400" };
      case "intermediate":
        return { bg: "bg-yellow-500/20", text: "text-yellow-400" };
      case "advanced":
        return { bg: "bg-red-500/20", text: "text-red-400" };
      default:
        return { bg: "bg-slate-500/20", text: "text-slate-400" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">
            Pre-Built Workout Plans
          </h2>
        </div>
        <p className="text-slate-400">
          Browse and copy professional workout plans to get started quickly
        </p>
      </div>

      {publishedPlans.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
          <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Plans Available Yet
          </h3>
          <p className="text-slate-400">
            Check back soon for pre-built workout plans!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {publishedPlans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            const days = workoutDays[plan.id] || [];
            const difficultyColors = getDifficultyColor(plan.difficulty_level);

            return (
              <div
                key={plan.id}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {plan.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Pre-Built
                        </span>
                      </div>

                      {plan.description && (
                        <p className="text-slate-300 mb-3">
                          {plan.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {plan.difficulty_level && (
                          <span
                            className={`px-2 py-1 rounded ${difficultyColors.bg} ${difficultyColors.text} font-medium capitalize`}
                          >
                            <TrendingUp className="w-3 h-3 inline mr-1" />
                            {plan.difficulty_level}
                          </span>
                        )}
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {plan.duration_weeks}{" "}
                          {plan.duration_weeks === 1 ? "week" : "weeks"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => copyPlanToMyPlans(plan)}
                        disabled={copying === plan.id}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {copying === plan.id ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Copying...
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Use Plan
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => togglePlanExpansion(plan.id)}
                        className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                      >
                        {isExpanded ? (
                          <>
                            Hide
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Preview
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-700 bg-slate-900 p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">
                      Weekly Schedule
                    </h4>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {DAYS.map((day, index) => {
                        const dayData = days.find(
                          (d) => d.day_of_week === index
                        );
                        return (
                          <div
                            key={index}
                            className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex-shrink-0 w-64"
                          >
                            <h5 className="font-semibold text-white mb-2">
                              {day}
                            </h5>
                            {dayData ? (
                              dayData.is_rest_day ? (
                                <div className="text-slate-400 text-sm">
                                  Rest Day
                                </div>
                              ) : (
                                <div>
                                  <div className="text-cyan-400 font-medium mb-2 text-sm">
                                    {dayData.workout_name}
                                  </div>
                                  <div className="space-y-1">
                                    {dayData.exercises.map((ex, i) => (
                                      <div
                                        key={i}
                                        className="text-slate-400 text-xs"
                                      >
                                        {ex.name} - {ex.sets}x{ex.reps}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="text-slate-500 text-sm">
                                Not configured
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

