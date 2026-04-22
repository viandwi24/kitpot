"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useJoinCircle, useUSDCApproval } from "@/hooks/use-create-circle";
import { useInitUsername } from "@/hooks/use-init-username";
import { formatUSDC, truncateAddress } from "@/lib/utils";
import { CONTRACTS } from "@/lib/contracts";
import type { CircleData } from "@/hooks/use-circles";

interface JoinFormProps {
  circleId: bigint;
  circle: CircleData;
}

export function JoinForm({ circleId, circle }: JoinFormProps) {
  const router = useRouter();
  const { address } = useAccount();
  const { name: resolvedName } = useInitUsername(address);
  const { joinCircle, isPending, isConfirming, isSuccess, error } = useJoinCircle();
  const {
    needsApproval,
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    refetch: refetchAllowance,
  } = useUSDCApproval(CONTRACTS.kitpotCircle, circle.contributionAmount);

  const initUsername = resolvedName ? `${resolvedName}.init` : (address ? truncateAddress(address) : "");
  const autoJoinRef = useRef(false);

  function handleJoin() {
    if (needsApproval) {
      autoJoinRef.current = true;
      approve();
    } else {
      joinCircle(circleId, initUsername);
    }
  }

  useEffect(() => {
    if (!isApproveSuccess) return;
    refetchAllowance().then(() => {
      if (autoJoinRef.current) {
        autoJoinRef.current = false;
        joinCircle(circleId, initUsername);
      }
    });
  }, [isApproveSuccess]);

  useEffect(() => { if (isSuccess) router.push(`/circles/${circleId.toString()}`); }, [isSuccess]);

  const isBusy = isApprovePending || isApproveConfirming || isPending || isConfirming;

  function buttonLabel() {
    if (isApprovePending) return "Waiting for wallet...";
    if (isApproveConfirming) return "Approving USDC...";
    if (isPending) return "Waiting for wallet...";
    if (isConfirming) return "Joining circle...";
    return "Join Circle";
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Join {circle.name}</CardTitle>
        <CardDescription>Deposit collateral and lock in your spot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-secondary/40 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contribution</span>
            <span className="font-medium">{formatUSDC(circle.contributionAmount)} USDC / cycle</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Collateral required</span>
            <span className="font-medium">{formatUSDC(circle.contributionAmount)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Members</span>
            <span className="font-medium">{circle.memberCount.toString()} / {circle.maxMembers.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total pot</span>
            <span className="font-semibold text-primary">
              {formatUSDC(circle.contributionAmount * circle.maxMembers)} USDC
            </span>
          </div>
        </div>

        {needsApproval && !isBusy && (
          <p className="text-xs text-muted-foreground text-center">
            First time: will approve USDC then join automatically.
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">Transaction failed</p>
            <p className="mt-1 text-xs opacity-80">{error.message.slice(0, 200)}</p>
          </div>
        )}

        <Button onClick={handleJoin} className="w-full" disabled={isBusy || !address}>
          {buttonLabel()}
        </Button>
      </CardContent>
    </Card>
  );
}
