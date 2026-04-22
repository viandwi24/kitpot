"use client";

import { LEVEL_NAMES } from "@/hooks/use-reputation";

interface LevelBadgeProps {
  level: number;
  xp: bigint;
  size?: "sm" | "md" | "lg";
}

const LEVEL_COLORS = [
  "border-muted-foreground/30 text-muted-foreground",  // Novice
  "border-green-600/50 text-green-500",                 // Apprentice
  "border-blue-500/50 text-blue-400",                   // Saver
  "border-purple-500/50 text-purple-400",               // Expert
  "border-yellow-500/50 text-yellow-400",               // Master
  "border-red-500/50 text-red-400",                     // Legendary
];

export function LevelBadge({ level, xp, size = "md" }: LevelBadgeProps) {
  const name = LEVEL_NAMES[level] ?? "Novice";
  const color = LEVEL_COLORS[level] ?? LEVEL_COLORS[0];

  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-12 w-12 text-sm",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center justify-center rounded-full border-2 font-bold ${color} ${sizeClasses[size]}`}>
        {level + 1}
      </div>
      {size !== "sm" && (
        <div className="text-sm">
          <span className="font-medium">{name}</span>
          <span className="ml-1 text-muted-foreground">{xp.toString()} XP</span>
        </div>
      )}
    </div>
  );
}
