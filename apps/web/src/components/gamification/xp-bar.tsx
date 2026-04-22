"use client";

import { LEVEL_NAMES, LEVEL_XP_THRESHOLDS } from "@/hooks/use-reputation";

interface XPBarProps {
  level: number;
  currentXP: bigint;
  className?: string;
}

export function XPBar({ level, currentXP, className }: XPBarProps) {
  const currentThreshold = BigInt(LEVEL_XP_THRESHOLDS[level] ?? 0);
  const nextThreshold = BigInt(LEVEL_XP_THRESHOLDS[level + 1] ?? LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1]);

  const xpInLevel = currentXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const pct = xpNeeded > 0n ? Number((xpInLevel * 100n) / xpNeeded) : 100;

  const nextName = LEVEL_NAMES[level + 1] ?? "Max";

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>{currentXP.toString()} XP</span>
        <span>{pct}% to {nextName}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
