"use client";

import { useState, useEffect } from "react";

interface CycleCountdownProps {
  deadlineTs: number;
  label: string;
}

export function CycleCountdown({ deadlineTs, label }: CycleCountdownProps) {
  const [now, setNow] = useState(() => Date.now() / 1000);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, deadlineTs - now);

  const fmt =
    remaining <= 0
      ? "Ready"
      : remaining < 60
        ? `${Math.floor(remaining)}s`
        : remaining < 3600
          ? `${Math.floor(remaining / 60)}m ${Math.floor(remaining % 60)}s`
          : `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m`;

  return (
    <span className="text-sm">
      {label}: <strong className="font-mono">{fmt}</strong>
    </span>
  );
}
