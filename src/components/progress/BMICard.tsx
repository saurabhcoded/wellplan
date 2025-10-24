import { Scale } from "lucide-react";

interface BMICardProps {
  currentWeight: number;
  heightCm: number | null;
}

interface BMICategory {
  label: string;
  color: string;
  range: string;
}

export default function BMICard({ currentWeight, heightCm }: BMICardProps) {
  const calculateBMI = (): number | null => {
    if (!heightCm || !currentWeight || currentWeight === 0) return null;

    const heightM = heightCm / 100;
    const bmi = currentWeight / (heightM * heightM);
    return bmi;
  };

  const getBMICategory = (bmi: number | null): BMICategory => {
    if (!bmi) return { label: "N/A", color: "slate", range: "" };

    if (bmi < 18.5)
      return {
        label: "Underweight",
        color: "blue",
        range: "< 18.5",
      };
    if (bmi < 25)
      return {
        label: "Normal",
        color: "green",
        range: "18.5 - 24.9",
      };
    if (bmi < 30)
      return {
        label: "Overweight",
        color: "yellow",
        range: "25 - 29.9",
      };
    return {
      label: "Obese",
      color: "red",
      range: "≥ 30",
    };
  };

  const bmi = calculateBMI();
  const category = getBMICategory(bmi);

  const colorClasses = {
    blue: "text-blue-400 border-blue-500/50 bg-blue-500/10",
    green: "text-green-400 border-green-500/50 bg-green-500/10",
    yellow: "text-yellow-400 border-yellow-500/50 bg-yellow-500/10",
    red: "text-red-400 border-red-500/50 bg-red-500/10",
    slate: "text-slate-400 border-slate-500/50 bg-slate-500/10",
  };

  const getBMIPosition = (bmiValue: number) => {
    return Math.min(Math.max(((bmiValue - 15) / 20) * 100, 0), 100);
  };

  if (!bmi) {
    return (
      <div className="bg-slate-800 rounded-lg md:rounded-xl p-4 md:p-6 border border-slate-700">
        <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
          <div className="p-1.5 md:p-2 bg-purple-500/20 rounded-lg">
            <Scale className="w-4 md:w-5 h-4 md:h-5 text-purple-400" />
          </div>
          <h3 className="text-slate-400 text-xs md:text-sm font-medium">BMI</h3>
        </div>
        <div className="text-center py-3 md:py-4">
          <div className="text-lg md:text-xl font-bold text-slate-500 mb-1">
            --
          </div>
          <div className="text-[10px] md:text-xs text-slate-500">
            Add height in Account
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg md:rounded-xl p-4 md:p-6 border border-slate-700">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
            <div className="p-1.5 md:p-2 bg-purple-500/20 rounded-lg">
              <Scale className="w-4 md:w-5 h-4 md:h-5 text-purple-400" />
            </div>
            <h3 className="text-slate-400 text-xs md:text-sm font-medium">
              BMI
            </h3>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mb-0.5 md:mb-1">
            {bmi.toFixed(1)}
          </div>
          <div className="text-slate-500 text-[10px] md:text-xs mb-2 md:mb-3">
            {category.range}
          </div>

          {/* BMI Category Badge */}
          <div
            className={`flex-1 inline-block px-2 md:px-3 py-0.5 md:py-1 rounded-full border text-[10px] md:text-xs font-semibold ${
              colorClasses[category.color as keyof typeof colorClasses]
            }`}
          >
            {category.label}
          </div>
        </div>
        {/* Vertical BMI Scale */}
        <div className="flex gap-1.5">
          <div className="w-2 h-16 bg-slate-700 rounded-full overflow-hidden relative flex flex-col">
            {/* Gradient background showing BMI ranges */}
            <div className="flex-1 bg-gradient-to-b from-red-400 to-red-500"></div>
            <div className="flex-1 bg-gradient-to-b from-yellow-400 to-yellow-500"></div>
            <div className="flex-1 bg-gradient-to-b from-green-400 to-green-500"></div>
            <div className="flex-1 bg-gradient-to-b from-blue-400 to-blue-500"></div>
            {/* Indicator */}
            <div
              className="absolute left-0 right-0 h-1 bg-white shadow-lg"
              style={{
                bottom: `${getBMIPosition(bmi)}%`,
              }}
            ></div>
          </div>
          <div className="flex flex-col justify-between text-[10px] text-slate-500">
            <span>35</span>
            <span>30</span>
            <span>25</span>
            <span>20</span>
            <span>15</span>
          </div>
        </div>
      </div>
    </div>
  );
}
