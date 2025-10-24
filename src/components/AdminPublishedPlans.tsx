import { useState, useEffect } from "react";
import {
  supabase,
  PublishedPlan,
  PublishedWorkoutDay,
  Exercise,
} from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import ExerciseAutocomplete from "./ExerciseAutocomplete";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AdminPublishedPlans() {
  const { user, userRole } = useAuth();
  const [plans, setPlans] = useState<PublishedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PublishedPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [workoutDays, setWorkoutDays] = useState<{
    [key: string]: PublishedWorkoutDay[];
  }>({});
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  // New plan form state
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [newPlanDifficulty, setNewPlanDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [newPlanDuration, setNewPlanDuration] = useState(1);

  // Day configuration state
  const [dayConfig, setDayConfig] = useState<{
    is_rest_day: boolean;
    workout_name: string;
    exercises: Exercise[];
  }>({
    is_rest_day: false,
    workout_name: "",
    exercises: [],
  });

  useEffect(() => {
    if (userRole === "admin") {
      loadPlans();
    }
  }, [userRole]);

  const loadPlans = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("published_plans")
      .select("*")
      .eq("created_by", user?.id)
      .order("created_at", { ascending: false });

    if (data) {
      setPlans(data);
    }
    setLoading(false);
  };

  const loadWorkoutDays = async (planId: string) => {
    if (workoutDays[planId]) return;

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
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
      await loadWorkoutDays(planId);
    }
    setExpandedPlans(newExpanded);
  };

  const createPlan = async () => {
    if (!user || !newPlanName.trim()) return;

    const { data, error } = await supabase
      .from("published_plans")
      .insert({
        name: newPlanName,
        description: newPlanDescription,
        difficulty_level: newPlanDifficulty,
        duration_weeks: newPlanDuration,
        created_by: user.id,
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      alert("Failed to create plan");
      return;
    }

    if (data) {
      setPlans([data, ...plans]);
      setShowCreateModal(false);
      resetNewPlanForm();
    }
  };

  const resetNewPlanForm = () => {
    setNewPlanName("");
    setNewPlanDescription("");
    setNewPlanDifficulty("beginner");
    setNewPlanDuration(1);
  };

  const togglePublish = async (plan: PublishedPlan) => {
    const { error } = await supabase
      .from("published_plans")
      .update({ is_published: !plan.is_published })
      .eq("id", plan.id);

    if (!error) {
      setPlans(
        plans.map((p) =>
          p.id === plan.id ? { ...p, is_published: !p.is_published } : p
        )
      );
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    const { error } = await supabase
      .from("published_plans")
      .delete()
      .eq("id", planId);

    if (!error) {
      setPlans(plans.filter((p) => p.id !== planId));
    }
  };

  const startEditDay = async (planId: string, dayOfWeek: number) => {
    setEditingPlan(plans.find((p) => p.id === planId) || null);
    setEditingDay(dayOfWeek);

    // Load existing day config if it exists
    let days = workoutDays[planId];
    if (!days) {
      const { data } = await supabase
        .from("published_workout_days")
        .select("*")
        .eq("published_plan_id", planId);
      days = data || [];
      setWorkoutDays((prev) => ({ ...prev, [planId]: days }));
    }

    const existingDay = days.find((d) => d.day_of_week === dayOfWeek);
    if (existingDay) {
      setDayConfig({
        is_rest_day: existingDay.is_rest_day,
        workout_name: existingDay.workout_name || "",
        exercises: existingDay.exercises || [],
      });
    } else {
      setDayConfig({
        is_rest_day: false,
        workout_name: "",
        exercises: [],
      });
    }
  };

  const saveDayConfig = async () => {
    if (!editingPlan || editingDay === null) return;

    const days = workoutDays[editingPlan.id] || [];
    const existingDay = days.find((d) => d.day_of_week === editingDay);

    if (existingDay) {
      // Update
      const { error } = await supabase
        .from("published_workout_days")
        .update({
          is_rest_day: dayConfig.is_rest_day,
          workout_name: dayConfig.workout_name,
          exercises: dayConfig.exercises,
        })
        .eq("id", existingDay.id);

      if (!error) {
        setWorkoutDays({
          ...workoutDays,
          [editingPlan.id]: days.map((d) =>
            d.id === existingDay.id ? { ...d, ...dayConfig } : d
          ),
        });
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from("published_workout_days")
        .insert({
          published_plan_id: editingPlan.id,
          day_of_week: editingDay,
          is_rest_day: dayConfig.is_rest_day,
          workout_name: dayConfig.workout_name,
          exercises: dayConfig.exercises,
        })
        .select()
        .single();

      if (!error && data) {
        setWorkoutDays({
          ...workoutDays,
          [editingPlan.id]: [...days, data],
        });
      }
    }

    setEditingDay(null);
    setEditingPlan(null);
  };

  const addExercise = () => {
    setDayConfig({
      ...dayConfig,
      exercises: [
        ...dayConfig.exercises,
        { name: "", sets: 3, reps: 10, weight: 0, rest_seconds: 90 },
      ],
    });
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const newExercises = [...dayConfig.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setDayConfig({ ...dayConfig, exercises: newExercises });
  };

  const removeExercise = (index: number) => {
    setDayConfig({
      ...dayConfig,
      exercises: dayConfig.exercises.filter((_, i) => i !== index),
    });
  };

  if (!userRole || userRole !== "admin") {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-slate-400">
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Manage Published Plans
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Create and publish workout plans
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-semibold"
        >
          <Plus className="w-4 h-4" />
          New Plan
        </button>
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Create New Plan
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">Plan Name</label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g., Full Body Beginner"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">Description</label>
                <textarea
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  rows={3}
                  placeholder="Brief description of the plan..."
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">Difficulty</label>
                <select
                  value={newPlanDifficulty}
                  onChange={(e) =>
                    setNewPlanDifficulty(
                      e.target.value as "beginner" | "intermediate" | "advanced"
                    )
                  }
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-2">
                  Duration (weeks)
                </label>
                <input
                  type="number"
                  value={newPlanDuration}
                  onChange={(e) =>
                    setNewPlanDuration(parseInt(e.target.value) || 1)
                  }
                  min="1"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createPlan}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-semibold"
              >
                Create Plan
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetNewPlanForm();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Day Modal */}
      {editingDay !== null && editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-3xl w-full p-6 my-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Edit {DAYS[editingDay]} - {editingPlan.name}
            </h3>

            <div className="mb-4">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={dayConfig.is_rest_day}
                  onChange={(e) =>
                    setDayConfig({
                      ...dayConfig,
                      is_rest_day: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                Rest Day
              </label>
            </div>

            {!dayConfig.is_rest_day && (
              <>
                <div className="mb-4">
                  <label className="block text-slate-300 mb-2">
                    Workout Name
                  </label>
                  <input
                    type="text"
                    value={dayConfig.workout_name}
                    onChange={(e) =>
                      setDayConfig({
                        ...dayConfig,
                        workout_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    placeholder="e.g., Upper Body"
                  />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">
                      Exercises
                    </h4>
                    <button
                      onClick={addExercise}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Exercise
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {dayConfig.exercises.map((exercise, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 rounded-lg p-4 border border-slate-700"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-slate-400 text-sm">
                            Exercise {i + 1}
                          </span>
                          <button
                            onClick={() => removeExercise(i)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <ExerciseAutocomplete
                            value={exercise.name}
                            onChange={(name) => updateExercise(i, "name", name)}
                            placeholder="Exercise name"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-400 text-sm mb-1">
                                Sets
                              </label>
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) =>
                                  updateExercise(
                                    i,
                                    "sets",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 text-sm mb-1">
                                Reps
                              </label>
                              <input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) =>
                                  updateExercise(
                                    i,
                                    "reps",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-400 text-sm mb-1">
                                Weight (kg)
                              </label>
                              <input
                                type="number"
                                value={exercise.weight || 0}
                                onChange={(e) =>
                                  updateExercise(
                                    i,
                                    "weight",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 text-sm mb-1">
                                Rest (seconds)
                              </label>
                              <input
                                type="number"
                                value={exercise.rest_seconds || 90}
                                onChange={(e) =>
                                  updateExercise(
                                    i,
                                    "rest_seconds",
                                    parseInt(e.target.value) || 90
                                  )
                                }
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveDayConfig}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Day
              </button>
              <button
                onClick={() => {
                  setEditingDay(null);
                  setEditingPlan(null);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const isExpanded = expandedPlans.has(plan.id);
          const days = workoutDays[plan.id] || [];

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
                      {plan.is_published ? (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 text-xs font-semibold rounded-full flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded capitalize">
                        {plan.difficulty_level}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-slate-300 mb-2 text-sm sm:text-base">
                        {plan.description}
                      </p>
                    )}
                    <p className="text-slate-400 text-sm">
                      {plan.duration_weeks}{" "}
                      {plan.duration_weeks === 1 ? "week" : "weeks"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => togglePublish(plan)}
                      className={`flex-1 sm:flex-none px-3 py-2 rounded-lg transition font-medium text-sm sm:text-base ${
                        plan.is_published
                          ? "bg-slate-700 hover:bg-slate-600 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      {plan.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => togglePlanExpansion(plan.id)}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-700 bg-slate-900 p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                    Weekly Schedule
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {DAYS.map((day, index) => {
                      const dayData = days.find((d) => d.day_of_week === index);
                      return (
                        <div
                          key={index}
                          className="bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-white text-sm sm:text-base">
                              {day}
                            </h5>
                            <button
                              onClick={() => startEditDay(plan.id, index)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
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

        {plans.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Plans Yet
            </h3>
            <p className="text-slate-400 mb-4">
              Create your first published workout plan
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-semibold"
            >
              Create Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

