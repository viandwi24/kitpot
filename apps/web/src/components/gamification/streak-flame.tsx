"use client";

interface StreakFlameProps {
  days: number;
  className?: string;
}

export function StreakFlame({ days, className }: StreakFlameProps) {
  if (days <= 0) return null;

  // Flame intensity scales with streak
  const intensity = days >= 25 ? "text-red-500" : days >= 10 ? "text-orange-400" : days >= 3 ? "text-yellow-400" : "text-muted-foreground";
  const scale = days >= 25 ? "scale-125" : days >= 10 ? "scale-110" : "";

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <svg className={`h-4 w-4 ${intensity} ${scale} transition-transform`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 23c-3.6 0-8-3.1-8-8.5C4 9 9.6 3 12 1c2.4 2 8 8 8 13.5 0 5.4-4.4 8.5-8 8.5zm0-19.5C10 5.8 6 10.8 6 14.5 6 18.6 9 21 12 21s6-2.4 6-6.5C18 10.8 14 5.8 12 3.5z"/>
        <path d="M12 21c-2 0-4-1.5-4-4.5C8 13.5 12 10 12 10s4 3.5 4 6.5c0 3-2 4.5-4 4.5z"/>
      </svg>
      <span className={`text-xs font-bold ${intensity}`}>{days}</span>
    </div>
  );
}
