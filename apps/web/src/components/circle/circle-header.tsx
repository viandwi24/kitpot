"use client";

import { Badge } from "@/components/ui/badge";
import { formatUSDC } from "@/lib/utils";
import { getTokenSymbol, type CircleData } from "@/hooks/use-circles";

const STATUS_CONFIG: Record<number, { label: string; variant: "default" | "secondary" | "success" }> = {
  0: { label: "Forming", variant: "secondary" },
  1: { label: "Active", variant: "default" },
  2: { label: "Completed", variant: "success" },
};

export function CircleHeader({ circle }: { circle: CircleData }) {
  const status = STATUS_CONFIG[circle.status] ?? STATUS_CONFIG[0];

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold">{circle.name}</h1>
        <p className="text-muted-foreground">
          {formatUSDC(circle.contributionAmount)} {getTokenSymbol(circle.tokenAddress)}/cycle ·{" "}
          {circle.maxMembers.toString()} members ·{" "}
          {circle.status === 1
            ? `Cycle ${(circle.currentCycle + 1n).toString()}/${circle.totalCycles.toString()}`
            : `${circle.memberCount.toString()}/${circle.maxMembers.toString()} joined`}
        </p>
      </div>
      <Badge variant={status.variant} className="text-sm">
        {status.label}
      </Badge>
    </div>
  );
}
