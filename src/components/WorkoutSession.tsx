import { useState, useEffect, useRef } from "react";
import { Exercise, ExerciseLibraryItem } from "../lib/supabase";
import {
  X,
  Play,
  Pause,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Timer,
  Dumbbell,
  Info,
} from "lucide-react";

interface WorkoutSessionProps {
  exercises: Exercise[];
  workoutName: string;
  onClose: () => void;
  onComplete: (completed: string[]) => void;
  exerciseLibrary: Map<string, ExerciseLibraryItem>;
  initialCompletedExercises?: string[];
}

type SessionPhase = "exercise" | "rest";

export default function WorkoutSession({
  exercises,
  workoutName,
  onClose,
  onComplete,
  exerciseLibrary,
  initialCompletedExercises = [],
}: WorkoutSessionProps) {
  // Find first incomplete exercise to start with
  const findFirstIncompleteIndex = () => {
    const index = exercises.findIndex(
      (ex) => !initialCompletedExercises.includes(ex.name)
    );
    return index === -1 ? 0 : index; // If all complete, start at 0
  };

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(
    findFirstIncompleteIndex()
  );
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<SessionPhase>("exercise");
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set(initialCompletedExercises)
  );
  const [showCompletion, setShowCompletion] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const instructionsRef = useRef<HTMLDivElement>(null);

  const currentExercise = exercises[currentExerciseIndex];
  const restDuration = currentExercise?.rest_seconds || 90;
  const libraryExercise = currentExercise?.exercise_library_id
    ? exerciseLibrary.get(currentExercise.exercise_library_id)
    : null;

  // Close instructions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        instructionsRef.current &&
        !instructionsRef.current.contains(event.target as Node)
      ) {
        setShowInstructions(false);
      }
    };

    if (showInstructions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showInstructions]);

  // Default cycling GIF (you can replace with your own URL)
  const defaultGif =
    "https://i.pinimg.com/originals/c6/03/58/c603582aa7fd62d407c797fba80bad24.gif";

  // Get media URL
  const getMediaUrl = () => {
    if (libraryExercise?.media_url) {
      return libraryExercise.media_url;
    }
    return defaultGif;
  };

  // Get media type
  const getMediaType = () => {
    if (libraryExercise?.media_type) {
      return libraryExercise.media_type;
    }
    return "gif";
  };

  // Timer effect for rest period
  useEffect(() => {
    if (phase === "rest" && restTimeLeft > 0 && !isPaused) {
      const timer = setInterval(() => {
        setRestTimeLeft((prev) => {
          if (prev <= 1) {
            // Rest complete, move to next set or exercise
            handleRestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase, restTimeLeft, isPaused]);

  const handleRestComplete = () => {
    setPhase("exercise");
    setRestTimeLeft(0);
  };

  const handleSetComplete = () => {
    if (currentSet < currentExercise.sets) {
      // More sets to go - start rest
      setPhase("rest");
      setRestTimeLeft(restDuration);
      setCurrentSet(currentSet + 1);
    } else {
      // Exercise complete - mark as done and move to next
      const newCompleted = new Set(completedExercises);
      newCompleted.add(currentExercise.name);
      setCompletedExercises(newCompleted);

      // Save progress after completing each exercise
      const completedArray = Array.from(newCompleted);
      onComplete(completedArray);

      if (currentExerciseIndex < exercises.length - 1) {
        // Move to next exercise
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setPhase("exercise");
      } else {
        // All exercises complete! Show completion screen
        setShowCompletion(true);
        setTimeout(() => {
          onClose();
        }, 3000); // Give user 3 seconds to see completion
      }
    }
  };

  const handleSkipRest = () => {
    setPhase("exercise");
    setRestTimeLeft(0);
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setCurrentSet(1);
      setPhase("exercise");
      setRestTimeLeft(0);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      // Mark current as complete
      const newCompleted = new Set(completedExercises);
      newCompleted.add(currentExercise.name);
      setCompletedExercises(newCompleted);

      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setPhase("exercise");
      setRestTimeLeft(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage =
    ((currentExerciseIndex + currentSet / currentExercise.sets) /
      exercises.length) *
    100;

  const handleClose = () => {
    // Save current progress before closing
    onComplete(Array.from(completedExercises));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base md:text-lg font-bold text-white">
                {workoutName}
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                Exercise {currentExerciseIndex + 1} of {exercises.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            {/* Info icon - only show if there are instructions */}
            {libraryExercise?.description && (
              <div className="relative" ref={instructionsRef}>
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className={`p-2 rounded-lg transition ${
                    showInstructions
                      ? "bg-blue-500 text-white"
                      : "hover:bg-slate-700 text-slate-400 hover:text-white"
                  }`}
                  title="Instructions"
                >
                  <Info className="w-5 h-5" />
                </button>

                {/* Instructions Tooltip/Popper */}
                {showInstructions && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Arrow */}
                    <div className="absolute -top-2 right-3 w-4 h-4 bg-slate-800 border-t border-l border-slate-600 transform rotate-45"></div>

                    <div className="relative">
                      <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3 flex items-center justify-between">
                        <span>Instructions</span>
                        <button
                          onClick={() => setShowInstructions(false)}
                          className="text-slate-400 hover:text-white transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </h4>
                      <div className="max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {libraryExercise.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-800 px-4 py-1.5 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="max-w-5xl mx-auto px-4 py-4 md:py-6 flex-1 flex flex-col">
          {showCompletion ? (
            // Completion Screen
            <div className="flex items-center justify-center flex-1">
              <div className="text-center space-y-4 animate-pulse">
                <div className="text-6xl md:text-8xl mb-2 md:mb-4">🎉</div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
                  Workout Complete!
                </h2>
                <p className="text-xl md:text-2xl text-cyan-400">
                  Great job on completing all exercises!
                </p>
                <div className="mt-4 md:mt-8 text-slate-400">
                  Returning to dashboard...
                </div>
              </div>
            </div>
          ) : phase === "exercise" ? (
            // Exercise Phase
            <div className="space-y-3 md:space-y-4 flex-1 flex flex-col">
              {/* Exercise Info */}
              <div className="text-center flex-shrink-0">
                <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">
                  {currentExercise.name}
                </h3>
                <div className="flex items-center justify-center gap-3 md:gap-6 text-slate-400 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl font-bold text-cyan-400">
                      {currentSet}
                    </span>
                    <span className="text-sm md:text-lg">
                      / {currentExercise.sets}
                    </span>
                    <span className="text-sm md:text-base">sets</span>
                  </div>
                  <div className="w-1 h-6 md:h-8 bg-slate-700" />
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl font-bold text-cyan-400">
                      {currentExercise.reps}
                    </span>
                    <span className="text-sm md:text-base">reps</span>
                  </div>
                  {currentExercise.weight && (
                    <>
                      <div className="w-1 h-6 md:h-8 bg-slate-700" />
                      <div className="flex items-center gap-2">
                        <span className="text-xl md:text-2xl font-bold text-cyan-400">
                          {currentExercise.weight}
                        </span>
                        <span className="text-sm md:text-base">kg</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Media Display */}
              <div className="bg-slate-800 rounded-lg md:rounded-2xl overflow-hidden border border-white flex-1 flex items-center justify-center max-h-[45vh] md:max-h-[55vh]">
                <div className="w-full h-full bg-white flex items-center justify-center">
                  {getMediaType() === "youtube" ? (
                    <iframe
                      src={getMediaUrl()}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={getMediaUrl()}
                      alt={currentExercise.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback to default GIF if image fails to load
                        e.currentTarget.src = defaultGif;
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 md:gap-4 flex-col md:flex-row flex-shrink-0">
                <button
                  onClick={handleSetComplete}
                  className="flex-[2] flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg md:rounded-xl hover:from-green-600 hover:to-emerald-600 transition font-semibold text-base md:text-lg"
                >
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                  Complete Set
                </button>
                <div className="flex gap-2 md:gap-4">
                  <button
                    onClick={handlePreviousExercise}
                    disabled={currentExerciseIndex === 0}
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-3 md:py-4 bg-slate-800 border border-slate-700 text-slate-400 rounded-lg md:rounded-xl hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                    Previous
                  </button>

                  <button
                    onClick={handleNextExercise}
                    disabled={currentExerciseIndex === exercises.length - 1}
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-3 md:py-4 bg-slate-800 border border-slate-700 text-slate-400 rounded-lg md:rounded-xl hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Rest Phase
            <div className="flex items-center justify-center flex-1">
              <div className="text-center space-y-4 md:space-y-8">
                <div>
                  <div className="flex items-center justify-center gap-3 mb-2 md:mb-4">
                    <Timer className="w-8 h-8 md:w-12 md:h-12 text-blue-400" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Rest Time
                  </h3>
                  <p className="text-slate-400 text-base md:text-lg">
                    Prepare for set {currentSet}
                  </p>
                </div>

                {/* Timer Display */}
                <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 256 256"
                  >
                    {/* Background circle */}
                    <circle
                      cx="128"
                      cy="128"
                      r="112"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="16"
                      className="text-slate-800"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="128"
                      cy="128"
                      r="112"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="16"
                      strokeLinecap="round"
                      className="text-blue-500 transition-all duration-1000"
                      strokeDasharray={`${2 * Math.PI * 112}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 112 * (1 - restTimeLeft / restDuration)
                      }`}
                    />
                  </svg>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl md:text-6xl font-bold text-white mb-1 md:mb-2">
                        {formatTime(restTimeLeft)}
                      </div>
                      <div className="text-sm md:text-base text-slate-400">
                        remaining
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rest Controls */}
                <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-slate-800 border border-slate-700 text-white rounded-lg md:rounded-xl hover:bg-slate-700 transition text-sm md:text-base"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 md:w-5 md:h-5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 md:w-5 md:h-5" />
                        Pause
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSkipRest}
                    className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-blue-500 text-white rounded-lg md:rounded-xl hover:bg-blue-600 transition text-sm md:text-base"
                  >
                    <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                    Skip Rest
                  </button>
                </div>

                {/* Next Exercise Preview */}
                <div className="bg-slate-800 rounded-lg md:rounded-xl p-3 md:p-4 border border-slate-700 max-w-md mx-auto">
                  <p className="text-xs md:text-sm text-slate-400 mb-1">
                    Up Next
                  </p>
                  <p className="text-sm md:text-base text-white font-semibold">
                    {currentExercise.name} - Set {currentSet} of{" "}
                    {currentExercise.sets}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exercise List Sidebar (Bottom on mobile) */}
      <div className="bg-slate-800 border-t border-slate-700 px-2 md:px-4 py-2 md:py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 md:pb-2 scrollbar-hide">
            {exercises.map((ex, idx) => {
              const isActive = idx === currentExerciseIndex;
              const isCompleted = completedExercises.has(ex.name);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentExerciseIndex(idx);
                    setCurrentSet(1);
                    setPhase("exercise");
                    setRestTimeLeft(0);
                  }}
                  className={`flex-shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : isCompleted
                      ? "bg-green-500/20 text-green-400 border border-green-500/50"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  }`}
                >
                  <span className="truncate max-w-[120px] md:max-w-none">
                    {idx + 1}. {ex.name}
                    {isCompleted && " ✓"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
