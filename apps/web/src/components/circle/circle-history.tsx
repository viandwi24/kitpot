"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSDC } from "@/lib/utils";
import type { CircleData, MemberData } from "@/hooks/use-circles";

interface CircleHistoryProps {
  circle: CircleData;
  members: MemberData[];
}

export function CircleHistory({ circle, members }: CircleHistoryProps) {
  const completedCycles = Number(circle.currentCycle);

  if (completedCycles === 0) return null;

  const totalPot = circle.contributionAmount * circle.maxMembers;
  const fee = totalPot / 100n;
  const payout = totalPot - fee;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: completedCycles }, (_, i) => {
            const member = members[i];
            return (
              <div key={i} className="flex items-center justify-between rounded-xl bg-secondary px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Cycle {i + 1}</span>
                  <span className="font-medium">
                    {member?.initUsername || member?.addr.slice(0, 10) || "..."}
                  </span>
                </div>
                <span className="text-sm text-primary">{formatUSDC(payout)} USDC</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
