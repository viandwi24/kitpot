"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountdown } from "@/hooks/use-countdown";
import { useCurrentCycleInfo } from "@/hooks/use-circle-dashboard";
import { formatUSDC } from "@/lib/utils";
import { DepositButton } from "./deposit-button";
import { AdvanceCycleButton } from "./advance-cycle-button";
import type { CircleData, MemberData } from "@/hooks/use-circles";

interface CurrentCycleProps {
  circle: CircleData;
  members: MemberData[];
  circleId: bigint;
  userAddress: `0x${string}` | undefined;
}

export function CurrentCycle({ circle, members, circleId, userAddress }: CurrentCycleProps) {
  const { data: cycleInfo } = useCurrentCycleInfo(circleId);

  const cycleEndTime = cycleInfo ? Number(cycleInfo[2]) : 0;
  const recipient = cycleInfo ? cycleInfo[3] : undefined;
  const allPaid = cycleInfo ? cycleInfo[4] : false;
  const canAdvance = cycleInfo ? cycleInfo[5] : false;

  const { formatted: countdown, isExpired } = useCountdown(cycleEndTime);

  const recipientMember = members.find((m) => m.addr === recipient);
  const totalPot = circle.contributionAmount * circle.maxMembers;
  const fee = totalPot / 100n;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Cycle {(circle.currentCycle + 1n).toString()} of {circle.totalCycles.toString()}</span>
          <span className="font-mono text-lg">{isExpired ? "Ready" : countdown}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Pot Recipient</p>
            <p className="font-medium">{recipientMember?.initUsername || recipient?.slice(0, 10) || "..."}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Pot</p>
            <p className="font-medium">
              {formatUSDC(totalPot)} USDC
              <span className="text-xs text-muted-foreground"> (- {formatUSDC(fee)} fee)</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <DepositButton circleId={circleId} circle={circle} userAddress={userAddress} />
          <AdvanceCycleButton circleId={circleId} allPaid={allPaid} canAdvance={canAdvance} />
        </div>
      </CardContent>
    </Card>
  );
}
