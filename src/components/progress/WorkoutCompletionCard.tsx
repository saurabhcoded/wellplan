import { Activity } from "lucide-react";

interface WorkoutCompletionCardProps {
  completedWorkouts: number;
  totalWorkouts: number;
}

export default function WorkoutCompletionCard({
  completedWorkouts,
  totalWorkouts,
}: WorkoutCompletionCardProps) {
  const percentage =
    totalWorkouts > 0
      ? Math.round((completedWorkouts / totalWorkouts) * 100)
      : 0;

  const getProgressColor = () => {
    if (percentage === 0) return "bg-slate-600";
    if (percentage < 33) return "bg-emerald-900/80";
    if (percentage < 67) return "bg-emerald-700/90";
    if (percentage < 100) return "bg-emerald-600";
    return "bg-gradient-to-r from-green-500 to-emerald-400";
  };

  return (
    <div className="bg-slate-800 rounded-lg md:rounded-xl p-4 md:p-6 border border-slate-700">
      <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
        <div className="p-1.5 md:p-2 bg-blue-500/20 rounded-lg">
          <Activity className="w-4 md:w-5 h-4 md:h-5 text-blue-400" />
        </div>
        <h3 className="text-slate-400 text-xs md:text-sm font-medium">
          Workout Completion
        </h3>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white mb-0.5 md:mb-1">
        {percentage}%
      </div>
      <div className="text-slate-500 text-xs md:text-sm mb-2 md:mb-3">
        {completedWorkouts} of {totalWorkouts} workouts
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 md:h-2.5">
        <div
          className={`h-2 md:h-2.5 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

