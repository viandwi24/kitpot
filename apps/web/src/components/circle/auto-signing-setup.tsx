"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUSDC } from "@/lib/utils";
import { useAutoSigning } from "@/hooks/use-auto-signing";
import type { CircleData } from "@/hooks/use-circles";

interface AutoSigningSetupProps {
  circleId: bigint;
  circle: CircleData;
}

export function AutoSigningSetup({ circleId, circle }: AutoSigningSetupProps) {
  const {
    hasSession,
    allowance,
    approveUSDC,
    authorizeSession,
    revokeSession,
    isApproving,
    isAuthorizing,
    isRevoking,
    approveSuccess,
  } = useAutoSigning(circleId);

  const totalAmount = circle.contributionAmount * circle.totalCycles;
  const needsApproval = allowance < totalAmount;

  const circleEndTime =
    circle.startTime + circle.cycleDuration * circle.totalCycles + 86400n;

  if (hasSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-primary">&#x2713;</span>
            Auto-Pay Active
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {formatUSDC(circle.contributionAmount)} USDC/cycle · Allowance remaining:{" "}
            {formatUSDC(allowance)}
          </p>
          <Button variant="outline" size="sm" onClick={revokeSession} disabled={isRevoking}>
            {isRevoking ? "Revoking..." : "Deactivate"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Auto-Pay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Set up once, contributions are paid automatically every cycle. No more clicking.
        </p>
        <div className="rounded-xl bg-secondary p-3 text-sm space-y-1">
          <p>{formatUSDC(circle.contributionAmount)} USDC per cycle</p>
          <p>Max {circle.totalCycles.toString()} cycles ({formatUSDC(totalAmount)} USDC total)</p>
        </div>

        {needsApproval && !approveSuccess ? (
          <Button
            className="w-full"
            onClick={() => approveUSDC(totalAmount)}
            disabled={isApproving}
          >
            {isApproving ? "Approving..." : "Step 1: Approve USDC"}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => authorizeSession(circle.contributionAmount, circleEndTime)}
            disabled={isAuthorizing}
          >
            {isAuthorizing ? "Activating..." : "Activate Auto-Pay"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
