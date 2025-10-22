import { useState, useEffect } from 'react';
import { supabase, WorkoutPlan, WorkoutDay, Exercise } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Save, Calendar } from 'lucide-react';
import ExerciseAutocomplete from "./ExerciseAutocomplete";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkoutPlanner() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayConfig, setDayConfig] = useState<{
    isRestDay: boolean;
    workoutName: string;
    exercises: Exercise[];
  }>({ isRestDay: false, workoutName: '', exercises: [] });

  useEffect(() => {
    loadPlans();
  }, [user]);

  useEffect(() => {
    if (activePlan) {
      loadWorkoutDays(activePlan.id);
    }
  }, [activePlan]);

  const loadPlans = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPlans(data);
      const active = data.find(p => p.is_active);
      if (active) setActivePlan(active);
    }
  };

  const loadWorkoutDays = async (planId: string) => {
    const { data } = await supabase
      .from('workout_days')
      .select('*')
      .eq('plan_id', planId)
      .order('day_of_week');

    if (data) setWorkoutDays(data);
  };

  const createPlan = async () => {
    if (!user || !newPlanName.trim()) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    if (plans.length === 0) {
      await supabase
        .from('workout_plans')
        .update({ is_active: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        name: newPlanName,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_active: plans.length === 0,
      })
      .select()
      .single();

    if (data && !error) {
      await loadPlans();
      setNewPlanName('');
      setIsCreating(false);
    }
  };

  const setAsActivePlan = async (plan: WorkoutPlan) => {
    if (!user) return;

    await supabase
      .from('workout_plans')
      .update({ is_active: false })
      .eq('user_id', user.id);

    await supabase
      .from('workout_plans')
      .update({ is_active: true })
      .eq('id', plan.id);

    await loadPlans();
  };

  const startEditDay = (dayOfWeek: number) => {
    const existing = workoutDays.find(d => d.day_of_week === dayOfWeek);
    if (existing) {
      setDayConfig({
        isRestDay: existing.is_rest_day,
        workoutName: existing.workout_name,
        exercises: existing.exercises || [],
      });
    } else {
      setDayConfig({ isRestDay: false, workoutName: '', exercises: [] });
    }
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

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    setDayConfig(prev => ({
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
    setDayConfig(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const saveDayConfig = async () => {
    if (!activePlan || editingDay === null) return;

    const existing = workoutDays.find(d => d.day_of_week === editingDay);

    if (existing) {
      await supabase
        .from('workout_days')
        .update({
          is_rest_day: dayConfig.isRestDay,
          workout_name: dayConfig.workoutName,
          exercises: dayConfig.exercises,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('workout_days')
        .insert({
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
    await supabase.from('workout_plans').delete().eq('id', planId);
    await loadPlans();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-6">Workout Plans</h2>

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
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">{plan.name}</h4>
                    <p className="text-slate-400 text-sm">
                      {new Date(plan.start_date).toLocaleDateString()} -{" "}
                      {new Date(plan.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!plan.is_active && (
                      <button
                        onClick={() => setAsActivePlan(plan)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAYS.map((day, index) => {
                const dayData = workoutDays.find(
                  (d) => d.day_of_week === index
                );
                return (
                  <div
                    key={index}
                    className="bg-slate-900 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition"
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
          <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
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
                      Exercises
                    </label>
                    <button
                      onClick={addExercise}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Exercise
                    </button>
                  </div>

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
                                updateExerciseWithLibrary(i, name, libraryId)
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
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={saveDayConfig}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setEditingDay(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
