"use client";

import { Badge } from "@/components/ui/badge";
import { TIER_NAMES, TIER_COLORS } from "@/hooks/use-reputation";

interface TierBadgeProps {
  tier: number;
  size?: "sm" | "md";
}

export function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  const name = TIER_NAMES[tier] ?? "Unranked";
  const color = TIER_COLORS[tier] ?? TIER_COLORS[0];

  if (tier === 0) return null; // Don't show badge for Unranked

  return (
    <Badge variant="outline" className={`${color} ${size === "sm" ? "text-[10px] px-1.5 py-0" : ""}`}>
      {name}
    </Badge>
  );
}
