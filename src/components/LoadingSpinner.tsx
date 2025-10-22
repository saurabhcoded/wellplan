import { Dumbbell } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  text = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        {/* Spinning ring around dumbbell */}
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin`}
        />
        {/* Dumbbell icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Dumbbell
            className={`${
              size === "sm" ? "w-3 h-3" : size === "md" ? "w-6 h-6" : "w-8 h-8"
            } text-cyan-400`}
          />
        </div>
      </div>
      {text && (
        <p className={`text-slate-400 ${textSizeClasses[size]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
}

