import { TrendingUp } from "lucide-react";

interface WeightChangeCardProps {
  weightChange: number;
  startWeight: number;
  currentWeight: number;
  unit: string;
}

export default function WeightChangeCard({
  weightChange,
  startWeight,
  currentWeight,
  unit,
}: WeightChangeCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg md:rounded-xl p-4 md:p-6 border border-slate-700">
      <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
        <div className="p-1.5 md:p-2 bg-green-500/20 rounded-lg">
          <TrendingUp className="w-4 md:w-5 h-4 md:h-5 text-green-400" />
        </div>
        <h3 className="text-slate-400 text-xs md:text-sm font-medium">
          Weight Change
        </h3>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white mb-0.5 md:mb-1">
        {weightChange > 0 ? "+" : ""}
        {weightChange.toFixed(1)}
        <span className="text-lg md:text-xl text-slate-400 ml-1">{unit}</span>
      </div>
      <div className="text-slate-500 text-xs md:text-sm">
        {startWeight > 0 && `${startWeight} → ${currentWeight}`}
      </div>
    </div>
  );
}

