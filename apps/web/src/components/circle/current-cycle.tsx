"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountdown } from "@/hooks/use-countdown";
import { useCurrentCycleInfo, useCycleTiming } from "@/hooks/use-circle-dashboard";
import { formatUSDC } from "@/lib/utils";
import { DepositButton } from "./deposit-button";
import { ClaimPotButton } from "./claim-pot-button";
import { SubstituteClaimButton } from "./substitute-claim-button";
import { CycleCountdown } from "./cycle-countdown";
import { getTokenSymbol, type CircleData, type MemberData } from "@/hooks/use-circles";

interface CurrentCycleProps {
  circle: CircleData;
  members: MemberData[];
  circleId: bigint;
  userAddress: `0x${string}` | undefined;
}

export function CurrentCycle({ circle, members, circleId, userAddress }: CurrentCycleProps) {
  const { data: cycleInfo } = useCurrentCycleInfo(circleId);
  const { data: timing } = useCycleTiming(circleId);

  const cycleEndTime = cycleInfo ? Number(cycleInfo[2]) : 0;
  const recipient = cycleInfo ? cycleInfo[3] : undefined;
  const allPaid = cycleInfo ? cycleInfo[4] : false;

  const { formatted: countdown, isExpired } = useCountdown(cycleEndTime);

  const recipientMember = members.find((m) => m.addr === recipient);
  const totalPot = circle.contributionAmount * circle.maxMembers;
  const fee = totalPot / 100n;
  const payout = totalPot - fee;

  // Timing state from contract view
  const canRecipientClaim = timing ? (timing as { canRecipientClaim: boolean }).canRecipientClaim : false;
  const canSubstituteClaim = timing ? (timing as { canSubstituteClaim: boolean }).canSubstituteClaim : false;
  const dormantDeadline = timing ? Number((timing as { dormantDeadline: bigint }).dormantDeadline) : 0;
  const isRecipient = userAddress && recipient && userAddress.toLowerCase() === recipient.toLowerCase();

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
              {formatUSDC(totalPot)} {getTokenSymbol(circle.tokenAddress)}
              <span className="text-xs text-muted-foreground"> (- {formatUSDC(fee)} fee)</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <DepositButton circleId={circleId} circle={circle} userAddress={userAddress} />
        </div>

        {/* Claim state machine */}
        {canSubstituteClaim ? (
          <SubstituteClaimButton
            circleId={circleId}
            potAmount={payout}
            tokenAddress={circle.tokenAddress as `0x${string}`}
          />
        ) : canRecipientClaim && isRecipient ? (
          <ClaimPotButton
            circleId={circleId}
            potAmount={payout}
            tokenAddress={circle.tokenAddress as `0x${string}`}
          />
        ) : canRecipientClaim && !isRecipient ? (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-200/80">
            <p className="font-medium">Waiting for recipient to claim</p>
            <CycleCountdown deadlineTs={dormantDeadline} label="Substitute claim opens in" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
