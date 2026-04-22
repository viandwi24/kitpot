"use client";

import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReputation, TIER_NAMES } from "@/hooks/use-reputation";
import { TierBadge } from "./tier-badge";
import { formatUSDC } from "@/lib/utils";

export function ReputationCard() {
  const { address } = useAccount();
  const { data: rep } = useReputation(address);

  if (!rep) {
    return null;
  }

  const tier = Number(rep.tier);
  const onTimeRate =
    rep.totalCyclesOnTime + rep.totalCyclesMissed > 0n
      ? Number((rep.totalCyclesOnTime * 100n) / (rep.totalCyclesOnTime + rep.totalCyclesMissed))
      : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Your Reputation</span>
          <TierBadge tier={tier} size="md" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{rep.totalCirclesCompleted.toString()}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{onTimeRate}%</div>
            <div className="text-xs text-muted-foreground">On-time</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{rep.consecutiveOnTime.toString()}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
        </div>

        {tier < 4 && (
          <div className="mt-4 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
            Next tier: <strong>{TIER_NAMES[tier + 1]}</strong>
            {tier === 0 && " — Complete 1 circle with 70%+ on-time"}
            {tier === 1 && " — Complete 3 circles with 85%+ on-time"}
            {tier === 2 && " — Complete 5 circles with 95%+ on-time"}
            {tier === 3 && " — Complete 10 circles with 99%+ on-time, 0 missed"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
