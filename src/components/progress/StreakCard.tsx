import { Calendar } from "lucide-react";
import { DailyLog } from "../../lib/supabase";

interface StreakCardProps {
  dailyLogs: DailyLog[];
}

export default function StreakCard({ dailyLogs }: StreakCardProps) {
  const calculateStreak = () => {
    let streak = 0;
    const sortedLogs = [...dailyLogs].sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    );

    for (const log of sortedLogs) {
      if (log.workout_completed) streak++;
      else break;
    }

    return streak;
  };

  const streak = calculateStreak();

  return (
    <div className="bg-slate-800 rounded-lg md:rounded-xl p-4 md:p-6 border border-slate-700">
      <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
        <div className="p-1.5 md:p-2 bg-cyan-500/20 rounded-lg">
          <Calendar className="w-4 md:w-5 h-4 md:h-5 text-cyan-400" />
        </div>
        <h3 className="text-slate-400 text-xs md:text-sm font-medium">
          Streak
        </h3>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white mb-0.5 md:mb-1">
        {streak}
      </div>
      <div className="text-slate-500 text-xs md:text-sm">consecutive days</div>
    </div>
  );
}

