import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  supabase,
  WorkoutPlan,
  WorkoutDay,
  Exercise,
  PublishedPlan,
  PublishedWorkoutDay,
} from "../lib/supabase";
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Trash2,
  Save,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  TrendingUp,
  Clock,
} from "lucide-react";
import ExerciseAutocomplete from "./ExerciseAutocomplete";
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

export default function WorkoutPlanner() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayConfig, setDayConfig] = useState<{
    isRestDay: boolean;
    workoutName: string;
    exercises: Exercise[];
  }>({ isRestDay: false, workoutName: "", exercises: [] });
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [isExercisesExpanded, setIsExercisesExpanded] = useState(false);

  // Published plans state
  const [publishedPlans, setPublishedPlans] = useState<PublishedPlan[]>([]);
  const [expandedPublishedPlan, setExpandedPublishedPlan] = useState<
    string | null
  >(null);
  const [publishedWorkoutDays, setPublishedWorkoutDays] = useState<{
    [key: string]: PublishedWorkoutDay[];
  }>({});
  const [copying, setCopying] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
    loadPublishedPlans();
  }, [user]);

  useEffect(() => {
    if (activePlan) {
      loadWorkoutDays(activePlan.id);
    }
  }, [activePlan]);

  const loadPlans = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setPlans(data);
      const active = data.find((p) => p.is_active);
      if (active) setActivePlan(active);
    }
  };

  const loadWorkoutDays = async (planId: string) => {
    const { data } = await supabase
      .from("workout_days")
      .select("*")
      .eq("plan_id", planId)
      .order("day_of_week");

    if (data) setWorkoutDays(data);
  };

  const createPlan = async () => {
    if (!user || !newPlanName.trim()) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    if (plans.length === 0) {
      await supabase
        .from("workout_plans")
        .update({ is_active: false })
        .eq("user_id", user.id);
    }

    const { data, error } = await supabase
      .from("workout_plans")
      .insert({
        user_id: user.id,
        name: newPlanName,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        is_active: plans.length === 0,
      })
      .select()
      .single();

    if (data && !error) {
      await loadPlans();
      setNewPlanName("");
      setIsCreating(false);
    }
  };

  const setAsActivePlan = async (plan: WorkoutPlan) => {
    if (!user) return;

    await supabase
      .from("workout_plans")
      .update({ is_active: false })
      .eq("user_id", user.id);

    await supabase
      .from("workout_plans")
      .update({ is_active: true })
      .eq("id", plan.id);

    await loadPlans();
  };

  const startEditDay = (dayOfWeek: number) => {
    const existing = workoutDays.find((d) => d.day_of_week === dayOfWeek);
    if (existing) {
      setDayConfig({
        isRestDay: existing.is_rest_day,
        workoutName: existing.workout_name,
        exercises: existing.exercises || [],
      });
    } else {
      setDayConfig({ isRestDay: false, workoutName: "", exercises: [] });
    }
    setIsExercisesExpanded(false); // Start collapsed when opening modal
    setEditingDay(dayOfWeek);
  };

  const addExercise = () => {
    setDayConfig((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { name: "", sets: 3, reps: 10, rest_seconds: 90 },
      ],
    }));
  };

  const updateExercise = (
    index: number,
    field: keyof Exercise,
    value: string | number
  ) => {
    setDayConfig((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === index ? { ...ex, [field]: value } : ex
      ),
    }));
  };

  const updateExerciseWithLibrary = (
    index: number,
    name: string,
    libraryId?: string
  ) => {
    setDayConfig((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === index ? { ...ex, name, exercise_library_id: libraryId } : ex
      ),
    }));
  };

  const removeExercise = (index: number) => {
    setDayConfig((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const saveDayConfig = async () => {
    if (!activePlan || editingDay === null) return;

    const existing = workoutDays.find((d) => d.day_of_week === editingDay);

    if (existing) {
      await supabase
        .from("workout_days")
        .update({
          is_rest_day: dayConfig.isRestDay,
          workout_name: dayConfig.workoutName,
          exercises: dayConfig.exercises,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("workout_days").insert({
        plan_id: activePlan.id,
        day_of_week: editingDay,
        is_rest_day: dayConfig.isRestDay,
        workout_name: dayConfig.workoutName,
        exercises: dayConfig.exercises,
      });
    }

    await loadWorkoutDays(activePlan.id);
    setEditingDay(null);
  };

  const deletePlan = async (planId: string) => {
    await supabase.from("workout_plans").delete().eq("id", planId);
    await loadPlans();
  };

  const toggleDayExpanded = (dayIndex: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  };

  // Published plans functions
  const loadPublishedPlans = async () => {
    const { data } = await supabase
      .from("published_plans")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (data) {
      setPublishedPlans(data);
    }
  };

  const loadPublishedWorkoutDays = async (planId: string) => {
    if (publishedWorkoutDays[planId]) return; // Already loaded

    const { data } = await supabase
      .from("published_workout_days")
      .select("*")
      .eq("published_plan_id", planId)
      .order("day_of_week");

    if (data) {
      setPublishedWorkoutDays((prev) => ({ ...prev, [planId]: data }));
    }
  };

  const togglePublishedPlanExpansion = async (planId: string) => {
    if (expandedPublishedPlan === planId) {
      setExpandedPublishedPlan(null);
    } else {
      setExpandedPublishedPlan(planId);
      await loadPublishedWorkoutDays(planId);
    }
  };

  const copyPlanToMyPlans = async (publishedPlan: PublishedPlan) => {
    if (!user) return;

    setCopying(publishedPlan.id);

    try {
      // Load workout days if not already loaded
      let days = publishedWorkoutDays[publishedPlan.id];
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

      // Reload user plans to show the new plan
      await loadPlans();
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Workout Plans</h2>
        <p className="text-slate-400 mb-6">
          Create and manage your weekly workout schedules
        </p>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">My Plans</h3>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              New Plan
            </button>
          </div>

          {isCreating && (
            <div className="mb-4 p-4 bg-slate-900 rounded-lg">
              <input
                type="text"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Plan name (e.g., Week 1 - Strength)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={createPlan}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewPlanName("");
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 rounded-lg border ${
                  plan.is_active
                    ? "bg-blue-500/10 border-blue-500"
                    : "bg-slate-900 border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">{plan.name}</h4>
                    <p className="text-slate-400 text-sm">
                      {new Date(plan.start_date).toLocaleDateString()} -{" "}
                      {new Date(plan.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {(plan.source_published_plan_id || !plan.is_active) && (
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
                    {plan.source_published_plan_id && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">
                        Pre-Built
                      </span>
                    )}
                    {!plan.is_active && (
                      <button
                        onClick={() => setAsActivePlan(plan)}
                        className="ml-auto px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {activePlan && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">
                Weekly Schedule: {activePlan.name}
              </h3>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
              {DAYS.map((day, index) => {
                const dayData = workoutDays.find(
                  (d) => d.day_of_week === index
                );
                return (
                  <div
                    key={index}
                    className="bg-slate-900 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition flex-shrink-0 w-72"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{day}</h4>
                      <button
                        onClick={() => startEditDay(index)}
                        className="text-blue-400 hover:text-blue-300 text-sm transition"
                      >
                        Edit
                      </button>
                    </div>
                    {dayData ? (
                      dayData.is_rest_day ? (
                        <div className="text-slate-400 text-sm">Rest Day</div>
                      ) : (
                        <div>
                          <div className="text-cyan-400 font-medium mb-2">
                            {dayData.workout_name}
                          </div>
                          {expandedDays.has(index) ? (
                            <div className="space-y-1">
                              {dayData.exercises.map((ex, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1 text-slate-400 text-sm"
                                >
                                  {ex.exercise_library_id && (
                                    <div
                                      className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"
                                      title="From library"
                                    ></div>
                                  )}
                                  <span>
                                    {ex.name} - {ex.sets}x{ex.reps}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-slate-400 text-sm">
                              {dayData.exercises.length} exercise
                              {dayData.exercises.length !== 1 ? "s" : ""}
                            </div>
                          )}
                          {dayData.exercises.length > 0 && (
                            <button
                              onClick={() => toggleDayExpanded(index)}
                              className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs transition"
                            >
                              {expandedDays.has(index) ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  Show Exercises
                                </>
                              )}
                            </button>
                          )}
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

      {editingDay !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] border border-slate-700 flex flex-col overflow-hidden">
            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1 p-6 pb-24">
              <h3 className="text-xl font-bold text-white mb-4">
                Configure {DAYS[editingDay]}
              </h3>

              <div className="mb-4">
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={dayConfig.isRestDay}
                    onChange={(e) =>
                      setDayConfig((prev) => ({
                        ...prev,
                        isRestDay: e.target.checked,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  Rest Day
                </label>
              </div>

              {!dayConfig.isRestDay && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Workout Name
                    </label>
                    <input
                      type="text"
                      value={dayConfig.workoutName}
                      onChange={(e) =>
                        setDayConfig((prev) => ({
                          ...prev,
                          workoutName: e.target.value,
                        }))
                      }
                      placeholder="e.g., Chest & Triceps"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-slate-300">
                        Exercises ({dayConfig.exercises.length})
                      </label>
                      <div className="flex gap-2">
                        {dayConfig.exercises.length > 0 && (
                          <button
                            onClick={() =>
                              setIsExercisesExpanded(!isExercisesExpanded)
                            }
                            className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
                          >
                            {isExercisesExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Hide All
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Show All
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={addExercise}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition"
                        >
                          <Plus className="w-4 h-4" />
                          Add Exercise
                        </button>
                      </div>
                    </div>

                    {isExercisesExpanded ? (
                      <div className="space-y-3">
                        {dayConfig.exercises.map((exercise, i) => (
                          <div
                            key={i}
                            className="bg-slate-900 p-3 rounded-lg space-y-2"
                          >
                            {exercise.exercise_library_id && (
                              <div className="flex items-center gap-1 mt-1">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                <span className="text-xs text-green-400">
                                  From library
                                </span>
                              </div>
                            )}
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-6">
                                <ExerciseAutocomplete
                                  value={exercise.name}
                                  onChange={(name, libraryId) =>
                                    updateExerciseWithLibrary(
                                      i,
                                      name,
                                      libraryId
                                    )
                                  }
                                  placeholder="Exercise name"
                                />
                              </div>
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) =>
                                  updateExercise(
                                    i,
                                    "sets",
                                    parseInt(e.target.value)
                                  )
                                }
                                placeholder="Sets"
                                className="col-span-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                              />
                              <input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) =>
                                  updateExercise(
                                    i,
                                    "reps",
                                    parseInt(e.target.value)
                                  )
                                }
                                placeholder="Reps"
                                className="col-span-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                              />
                              <button
                                onClick={() => removeExercise(i)}
                                className="col-span-2 p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-slate-400">
                                Rest:
                              </label>
                              <input
                                type="number"
                                value={exercise.rest_seconds || 90}
                                onChange={(e) =>
                                  updateExercise(
                                    i,
                                    "rest_seconds",
                                    parseInt(e.target.value)
                                  )
                                }
                                placeholder="90"
                                className="w-20 px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                              />
                              <span className="text-sm text-slate-400">
                                seconds between sets
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm p-4 bg-slate-900 rounded-lg text-center">
                        {dayConfig.exercises.length > 0 ? (
                          <>
                            {dayConfig.exercises.length} exercise
                            {dayConfig.exercises.length !== 1 ? "s" : ""}{" "}
                            configured
                          </>
                        ) : (
                          "No exercises added yet"
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sticky Button Bar */}
            <div className="sticky bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 p-4 flex gap-2">
              <button
                onClick={saveDayConfig}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setEditingDay(null)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Published Plans Section */}
      {publishedPlans.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Pre-Built Workout Plans
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Browse and copy professional workout plans
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {publishedPlans.map((plan) => {
              const isExpanded = expandedPublishedPlan === plan.id;
              const days = publishedWorkoutDays[plan.id] || [];
              const difficultyColors = getDifficultyColor(
                plan.difficulty_level
              );

              return (
                <div
                  key={plan.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-white">
                            {plan.name}
                          </h3>
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Pre-Built
                          </span>
                        </div>

                        {plan.description && (
                          <p className="text-slate-300 mb-3 text-sm sm:text-base">
                            {plan.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
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

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => copyPlanToMyPlans(plan)}
                          disabled={copying === plan.id}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                          onClick={() => togglePublishedPlanExpansion(plan.id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
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
                    <div className="border-t border-slate-700 bg-slate-900 p-4 sm:p-6">
                      <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                        Weekly Schedule
                      </h4>
                      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {DAYS.map((day, index) => {
                          const dayData = days.find(
                            (d) => d.day_of_week === index
                          );
                          return (
                            <div
                              key={index}
                              className="bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-700 flex-shrink-0 w-48 sm:w-64"
                            >
                              <h5 className="font-semibold text-white mb-2 text-sm sm:text-base">
                                {day}
                              </h5>
                              {dayData ? (
                                dayData.is_rest_day ? (
                                  <div className="text-slate-400 text-xs sm:text-sm">
                                    Rest Day
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-cyan-400 font-medium mb-2 text-xs sm:text-sm">
                                      {dayData.workout_name}
                                    </div>
                                    <div className="space-y-1">
                                      {dayData.exercises.map((ex, i) => (
                                        <div
                                          key={i}
                                          className="text-slate-400 text-xs break-words"
                                        >
                                          {ex.name} - {ex.sets}x{ex.reps}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="text-slate-500 text-xs sm:text-sm">
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
        </div>
      )}
    </div>
  );
}
