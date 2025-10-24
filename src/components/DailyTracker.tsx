import { useState, useEffect } from 'react';
import {
  supabase,
  DailyLog,
  WeightLog,
  WorkoutDay,
  ExerciseLibraryItem,
} from "../lib/supabase";
import { useAuth } from '../contexts/AuthContext';
import WorkoutSession from "./WorkoutSession";
import LoadingSpinner from "./LoadingSpinner";
import PhysicalProgressLogger from "./PhysicalProgressLogger";
import {
  CheckCircle2,
  Circle,
  Scale,
  Save,
  StickyNote,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  RotateCcw,
  Type,
  Check,
  Dumbbell,
  Play,
} from "lucide-react";

export default function DailyTracker() {
  const { user } = useAuth();
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutDay | null>(null);
  const [todayWeight, setTodayWeight] = useState<WeightLog | null>(null);
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [notes, setNotes] = useState("");
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [previousNotes, setPreviousNotes] = useState<DailyLog[]>([]);
  const [showNotesHistory, setShowNotesHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [notesTextareaRef, setNotesTextareaRef] =
    useState<HTMLTextAreaElement | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [showWorkoutSession, setShowWorkoutSession] = useState(false);
  const [exerciseLibraryMap, setExerciseLibraryMap] = useState<
    Map<string, ExerciseLibraryItem>
  >(new Map());
  const [isWorkoutExpanded, setIsWorkoutExpanded] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().getDay();

  useEffect(() => {
    loadTodayData();
    loadPreviousNotes();
    loadExerciseLibrary();
  }, [user]);

  const loadExerciseLibrary = async () => {
    try {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("*");

      if (error) throw error;

      const libraryMap = new Map<string, ExerciseLibraryItem>();
      data?.forEach((exercise) => {
        libraryMap.set(exercise.id, exercise);
      });
      setExerciseLibraryMap(libraryMap);
    } catch (error) {
      console.error("Error loading exercise library:", error);
    }
  };

  // Auto-save notes with debounce
  useEffect(() => {
    if (!user || notes === todayLog?.notes) return;

    setSaveStatus("saving");
    const timeoutId = setTimeout(() => {
      saveNotesAuto();
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [notes, user]);

  const loadTodayData = async () => {
    if (!user) return;

    setLoading(true);

    const { data: activePlan } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (activePlan) {
      const { data: workoutDay } = await supabase
        .from("workout_days")
        .select("*")
        .eq("plan_id", activePlan.id)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle();

      setTodayWorkout(workoutDay);
    }

    const { data: dailyLog } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .maybeSingle();

    if (dailyLog) {
      setTodayLog(dailyLog);
      setNotes(dailyLog.notes);
      // Load completed exercises from the log
      if (
        dailyLog.completed_exercises &&
        Array.isArray(dailyLog.completed_exercises)
      ) {
        setCompletedExercises(dailyLog.completed_exercises);
      } else {
        setCompletedExercises([]);
      }
    } else {
      // Reset completed exercises if no log for today
      setCompletedExercises([]);
    }

    const { data: weightLog } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .maybeSingle();

    if (weightLog) {
      setTodayWeight(weightLog);
      setWeight(weightLog.weight.toString());
      setUnit(weightLog.unit);
    }

    setLoading(false);
  };

  const loadPreviousNotes = async () => {
    if (!user) return;

    // Load logs from the calendar month being viewed
    const firstDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    );
    const lastDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0
    );
    const startDateStr = firstDay.toISOString().split("T")[0];
    const endDateStr = lastDay.toISOString().split("T")[0];

    const { data: logs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", startDateStr)
      .lte("log_date", endDateStr)
      .order("log_date", { ascending: false });

    if (logs) {
      setPreviousNotes(logs);
    }
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: (Date | null)[] = [];

    // Add empty slots for days before month starts (adjusted for Monday start)
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    for (let i = 0; i < adjustedStart; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const changeMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(calendarMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCalendarMonth(newMonth);
    setSelectedDate(null); // Reset selected date when changing months
  };

  useEffect(() => {
    if (showNotesHistory) {
      loadPreviousNotes();
    }
  }, [calendarMonth, showNotesHistory]);

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    if (!notesTextareaRef) return;

    const start = notesTextareaRef.selectionStart;
    const end = notesTextareaRef.selectionEnd;
    const selectedText = notes.substring(start, end);
    const beforeText = notes.substring(0, start);
    const afterText = notes.substring(end);

    const newText = beforeText + prefix + selectedText + suffix + afterText;
    setNotes(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      notesTextareaRef.focus();
      notesTextareaRef.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  const insertListItem = (type: "bullet" | "numbered") => {
    if (!notesTextareaRef) return;

    const start = notesTextareaRef.selectionStart;
    const beforeText = notes.substring(0, start);
    const afterText = notes.substring(start);

    // Check if we're at the start of a line
    const needsNewLine = beforeText.length > 0 && !beforeText.endsWith("\n");
    const prefix = needsNewLine ? "\n" : "";
    const listItem = type === "bullet" ? "• " : "1. ";

    const newText = beforeText + prefix + listItem + afterText;
    setNotes(newText);

    setTimeout(() => {
      notesTextareaRef.focus();
      const newPosition = start + prefix.length + listItem.length;
      notesTextareaRef.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertHeading = () => {
    if (!notesTextareaRef) return;

    const start = notesTextareaRef.selectionStart;
    const end = notesTextareaRef.selectionEnd;
    const selectedText = notes.substring(start, end);
    const beforeText = notes.substring(0, start);
    const afterText = notes.substring(end);

    const needsNewLine = beforeText.length > 0 && !beforeText.endsWith("\n");
    const prefix = needsNewLine ? "\n" : "";

    const newText = beforeText + prefix + "## " + selectedText + afterText;
    setNotes(newText);

    setTimeout(() => {
      notesTextareaRef.focus();
      const newPosition = start + prefix.length + 3;
      notesTextareaRef.setSelectionRange(
        newPosition,
        newPosition + selectedText.length
      );
    }, 0);
  };

  const clearFormatting = () => {
    if (!notesTextareaRef) return;

    const start = notesTextareaRef.selectionStart;
    const end = notesTextareaRef.selectionEnd;
    const selectedText = notes.substring(start, end);

    // Remove common markdown formatting
    const cleaned = selectedText
      .replace(/\*\*/g, "") // Bold
      .replace(/\*/g, "") // Italic
      .replace(/^#+\s/gm, "") // Headings
      .replace(/^[•\-]\s/gm, "") // Bullet points
      .replace(/^\d+\.\s/gm, ""); // Numbered lists

    const beforeText = notes.substring(0, start);
    const afterText = notes.substring(end);

    setNotes(beforeText + cleaned + afterText);

    setTimeout(() => {
      notesTextareaRef.focus();
      notesTextareaRef.setSelectionRange(start, start + cleaned.length);
    }, 0);
  };

  const toggleExercise = async (exerciseName: string) => {
    if (!user) return;

    const isCompleted = completedExercises.includes(exerciseName);

    // Prevent unchecking completed exercises
    if (isCompleted) return;

    const newCompletedExercises = [...completedExercises, exerciseName];

    setCompletedExercises(newCompletedExercises);

    // Check if all exercises are completed
    const allExercisesCount = todayWorkout?.exercises.length || 0;
    const workoutFullyCompleted =
      newCompletedExercises.length === allExercisesCount &&
      allExercisesCount > 0;

    if (todayLog) {
      const { data } = await supabase
        .from("daily_logs")
        .update({
          completed_exercises: newCompletedExercises,
          workout_completed: workoutFullyCompleted,
        })
        .eq("id", todayLog.id)
        .select()
        .single();

      if (data) setTodayLog(data);
    } else {
      const { data } = await supabase
        .from("daily_logs")
        .insert({
          user_id: user.id,
          log_date: today,
          workout_completed: workoutFullyCompleted,
          workout_day_id: todayWorkout?.id || null,
          notes: "",
          completed_exercises: newCompletedExercises,
        })
        .select()
        .single();

      if (data) setTodayLog(data);
    }
  };

  const saveWeight = async () => {
    if (!user || !weight) return;

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue)) return;

    if (todayWeight) {
      const { data } = await supabase
        .from("weight_logs")
        .update({ weight: weightValue, unit })
        .eq("id", todayWeight.id)
        .select()
        .single();

      if (data) setTodayWeight(data);
    } else {
      const { data } = await supabase
        .from("weight_logs")
        .insert({
          user_id: user.id,
          log_date: today,
          weight: weightValue,
          unit,
        })
        .select()
        .single();

      if (data) setTodayWeight(data);
    }
  };

  const saveNotesAuto = async () => {
    if (!user) return;

    try {
      if (todayLog) {
        const { data } = await supabase
          .from("daily_logs")
          .update({ notes })
          .eq("id", todayLog.id)
          .select()
          .single();

        if (data) {
          setTodayLog(data);
          setSaveStatus("saved");
          // If notes were cleared and history is showing, reload it
          if (showNotesHistory) {
            loadPreviousNotes();
          }
        }
      } else {
        const { data } = await supabase
          .from("daily_logs")
          .insert({
            user_id: user.id,
            log_date: today,
            workout_completed: false,
            notes,
          })
          .select()
          .single();

        if (data) {
          setTodayLog(data);
          setSaveStatus("saved");
        }
      }

      // Reset to idle after showing "saved" for 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving notes:", error);
      setSaveStatus("idle");
    }
  };

  const handleWorkoutComplete = async (completed: string[]) => {
    // Don't close session here - let user continue or manually exit
    setCompletedExercises(completed);

    // Update the database
    if (todayLog) {
      await supabase
        .from("daily_logs")
        .update({
          completed_exercises: completed,
          workout_completed:
            completed.length === todayWorkout?.exercises.length,
        })
        .eq("id", todayLog.id);
    } else if (user) {
      await supabase.from("daily_logs").insert({
        user_id: user.id,
        log_date: today,
        workout_completed: completed.length === todayWorkout?.exercises.length,
        workout_day_id: todayWorkout?.id || null,
        notes: "",
        completed_exercises: completed,
      });
    }

    // Reload data to update the dashboard in background
    loadTodayData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {showWorkoutSession && todayWorkout && !todayWorkout.is_rest_day && (
        <WorkoutSession
          exercises={todayWorkout.exercises}
          workoutName={todayWorkout.workout_name}
          onClose={() => setShowWorkoutSession(false)}
          onComplete={handleWorkoutComplete}
          exerciseLibrary={exerciseLibraryMap}
          initialCompletedExercises={completedExercises}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-6">Today's Tracker</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Today's Workout
              </h3>
              {todayWorkout &&
                !todayWorkout.is_rest_day &&
                todayWorkout.exercises.length > 0 && (
                  <button
                    onClick={() => setShowWorkoutSession(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition font-semibold"
                  >
                    <Play className="w-4 h-4" />
                    Start Workout
                  </button>
                )}
            </div>

            {todayWorkout ? (
              todayWorkout.is_rest_day ? (
                <div className="text-center py-8">
                  <div className="text-slate-400 mb-4">Rest Day</div>
                  <p className="text-slate-500 text-sm">
                    Take it easy and recover!
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h4 className="text-cyan-400 font-medium text-lg mb-3">
                      {todayWorkout.workout_name}
                    </h4>
                    <div
                      className={`space-y-2 overflow-y-auto transition-all duration-300 ${
                        isWorkoutExpanded ? "max-h-[600px]" : "max-h-[250px]"
                      } pr-1`}
                    >
                      {todayWorkout.exercises.map((exercise, i) => {
                        const isCompleted = completedExercises.includes(
                          exercise.name
                        );
                        return (
                          <button
                            key={i}
                            onClick={() => toggleExercise(exercise.name)}
                            className={`w-full bg-slate-900 p-3 rounded-lg flex items-center gap-3 transition ${
                              isCompleted
                                ? "border-2 border-green-500/50 cursor-not-allowed"
                                : "border-2 border-transparent hover:bg-slate-800 cursor-pointer"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 text-left">
                              <div
                                className={`font-medium ${
                                  isCompleted ? "text-green-400" : "text-white"
                                }`}
                              >
                                {exercise.name}
                              </div>
                              <div className="text-slate-400 text-sm">
                                {exercise.sets} sets × {exercise.reps} reps
                                {exercise.weight && ` @ ${exercise.weight} kg`}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Expand/Collapse Button */}
                    {todayWorkout.exercises.length > 3 && (
                      <button
                        onClick={() => setIsWorkoutExpanded(!isWorkoutExpanded)}
                        className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition border border-slate-700"
                      >
                        {isWorkoutExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Expand All
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm font-medium">
                        Progress
                      </span>
                      <span className="text-slate-400 text-sm">
                        {completedExercises.length} /{" "}
                        {todayWorkout.exercises.length}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${(() => {
                          const progress =
                            (completedExercises.length /
                              todayWorkout.exercises.length) *
                            100;
                          if (progress === 0) return "bg-slate-600";
                          if (progress < 33) return "bg-emerald-900/80";
                          if (progress < 67) return "bg-emerald-700/90";
                          if (progress < 100) return "bg-emerald-600";
                          return "bg-gradient-to-r from-green-500 to-emerald-400";
                        })()}`}
                        style={{
                          width: `${
                            (completedExercises.length /
                              todayWorkout.exercises.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    {completedExercises.length ===
                      todayWorkout.exercises.length &&
                      todayWorkout.exercises.length > 0 && (
                        <div className="mt-3 text-center text-green-400 font-medium animate-pulse">
                          🎉 Workout Complete!
                        </div>
                      )}
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-2">No workout scheduled</div>
                <p className="text-slate-500 text-sm">
                  Create a workout plan to see today's exercises
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Weight Log</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Today's Weight
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70.5"
                    className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as "kg" | "lbs")}
                    className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              </div>

              <button
                onClick={saveWeight}
                disabled={!weight}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {todayWeight ? "Update Weight" : "Save Weight"}
              </button>

              {todayWeight && (
                <div className="text-center text-sm text-slate-400 mt-2">
                  Logged: {todayWeight.weight} {todayWeight.unit}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Physical Progress Logger */}
        <PhysicalProgressLogger />

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-semibold text-white">Notes</h3>
            </div>
            <button
              onClick={() => {
                setShowNotesHistory(!showNotesHistory);
                if (!showNotesHistory) {
                  loadPreviousNotes();
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-700 rounded-lg transition"
            >
              {showNotesHistory ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Calendar
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <CalendarIcon className="w-4 h-4" />
                  View Calendar
                </>
              )}
            </button>
          </div>

          {/* Today's Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Today (
              {new Date(today).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
              )
            </label>

            {/* Formatting Toolbar */}
            <div className="mb-2 flex flex-wrap items-center gap-1 p-2 bg-slate-900 border border-slate-700 rounded-t-lg border-b-0">
              <button
                type="button"
                onClick={() => insertFormatting("**")}
                className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("*")}
                className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={insertHeading}
                className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                title="Heading"
              >
                <Type className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertListItem("bullet")}
                className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertListItem("numbered")}
                className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={clearFormatting}
                className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                title="Clear Formatting"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="flex-1" />

              {/* Auto-save status indicator */}
              <div className="flex items-center gap-2">
                {saveStatus === "saving" && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Dumbbell className="w-3 h-3 animate-bounce" />
                    Saving...
                  </div>
                )}
                {saveStatus === "saved" && (
                  <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <Check className="w-3 h-3" />
                    Saved
                  </div>
                )}
                <span className="text-xs text-slate-500">
                  {notes.length} chars
                </span>
              </div>
            </div>

            <textarea
              ref={(el) => setNotesTextareaRef(el)}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (saveStatus === "saved") setSaveStatus("idle");
              }}
              placeholder="Write your today's notes here... (auto-saves as you type)"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-b-lg text-white placeholder-slate-500 min-h-[160px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Calendar View for Previous Notes */}
          {showNotesHistory && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Notes Calendar
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeMonth("prev")}
                    className="p-1.5 hover:bg-slate-700 rounded-lg transition"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>
                  <span className="text-sm font-medium text-slate-300 min-w-[120px] text-center">
                    {calendarMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => changeMonth("next")}
                    className="p-1.5 hover:bg-slate-700 rounded-lg transition"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
              {/* Calendar Grid */}
              <div className="mb-4">
                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-slate-500 py-1"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((date, index) => {
                    if (!date) {
                      return (
                        <div key={`empty-${index}`} className="aspect-square" />
                      );
                    }

                    const dateStr = date.toISOString().split("T")[0];
                    const log = previousNotes.find(
                      (l) => l.log_date === dateStr
                    );
                    const hasNotes =
                      log && log.notes && log.notes.trim() !== "";
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;

                    return (
                      <button
                        key={dateStr}
                        onClick={() =>
                          setSelectedDate(isSelected ? null : dateStr)
                        }
                        disabled={!hasNotes && !isToday}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition relative
                        ${isToday ? "ring-2 ring-blue-400" : ""}
                        ${isSelected ? "bg-blue-500 text-white" : ""}
                        ${
                          !isSelected && hasNotes && log.workout_completed
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : ""
                        }
                        ${
                          !isSelected && hasNotes && !log.workout_completed
                            ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                            : ""
                        }
                        ${
                          !isSelected && !hasNotes && !isToday
                            ? "text-slate-600 cursor-default"
                            : ""
                        }
                        ${
                          !isSelected && !hasNotes && isToday
                            ? "text-slate-400"
                            : ""
                        }
                      `}
                      >
                        {date.getDate()}
                        {hasNotes && !isSelected && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50" />
                    <span>Workout + Notes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50" />
                    <span>Notes Only</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded ring-2 ring-blue-400" />
                    <span>Today</span>
                  </div>
                </div>
              </div>
              ;{/* Selected Date Details */}
              {selectedDate &&
                (() => {
                  const log = previousNotes.find(
                    (l) => l.log_date === selectedDate
                  );
                  if (!log || !log.notes) return null;

                  return (
                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-300">
                            {new Date(selectedDate).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                          {log.workout_completed && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/50">
                              ✓ Workout Completed
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {log.notes}
                      </p>
                    </div>
                  );
                })()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
