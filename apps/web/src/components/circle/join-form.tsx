"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { formatUSDC, truncateAddress } from "@/lib/utils";
import { CONTRACTS } from "@/lib/contracts";
import type { CircleData } from "@/hooks/use-circles";

interface JoinFormProps {
  circleId: bigint;
  circle: CircleData;
}

export function JoinForm({ circleId, circle }: JoinFormProps) {
  const router = useRouter();
  const { address: evmAddress } = useAccount();
  const { username } = useInterwovenKit();
  const { joinCircle, approveUSDC, isPending, error } = useKitpotTx();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const initUsername = username ? `${username}` : (evmAddress ? truncateAddress(evmAddress) : "");

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: evmAddress ? [evmAddress, CONTRACTS.kitpotCircle] : undefined,
    query: { enabled: !!evmAddress },
  });

  const needsApproval = allowance !== undefined && allowance < circle.contributionAmount;

  useEffect(() => {
    if (success) router.push(`/circles/${circleId.toString()}`);
  }, [success, router, circleId]);

  async function handleJoin() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (needsApproval) {
        setStatusMsg("Approving USDC...");
        await approveUSDC(CONTRACTS.kitpotCircle);
        await refetchAllowance();
      }
      setStatusMsg("Joining circle...");
      await joinCircle(circleId, initUsername);
      setSuccess(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setSubmitting(false);
      setStatusMsg("");
    }
  }

  function buttonLabel() {
    if (!submitting && !isPending) return "Join Circle";
    return statusMsg || "Processing...";
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

        {needsApproval && !submitting && (
          <p className="text-xs text-muted-foreground text-center">
            First time: will approve USDC then join automatically.
          </p>
        )}

        {(error || submitError) && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">Transaction failed</p>
            <p className="mt-1 text-xs opacity-80">{(error?.message || submitError || "").slice(0, 200)}</p>
          </div>
        )}

        <Button onClick={handleJoin} className="w-full" disabled={submitting || isPending || !evmAddress}>
          {buttonLabel()}
        </Button>
      </CardContent>
    </Card>
  );
}
