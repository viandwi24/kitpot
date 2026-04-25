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
import { getTokenSymbol, type CircleData } from "@/hooks/use-circles";
import { parseTxError } from "@/lib/tx-errors";

interface JoinFormProps {
  circleId: bigint;
  circle: CircleData;
}

export function JoinForm({ circleId, circle }: JoinFormProps) {
  const router = useRouter();
  const { address: evmAddress } = useAccount();
  const { username } = useInterwovenKit();
  const { joinCircle, approveToken, isPending, error } = useKitpotTx();
  const tokenSymbol = getTokenSymbol(circle.tokenAddress);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const initUsername = username ? `${username}` : (evmAddress ? truncateAddress(evmAddress) : "");

  const { data: tokenBalance } = useReadContract({
    address: circle.tokenAddress,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: evmAddress ? [evmAddress] : undefined,
    query: { enabled: !!evmAddress },
  }) as { data: bigint | undefined };

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: circle.tokenAddress,
    abi: MOCK_USDC_ABI, // same ABI shape for all mock ERC20s
    functionName: "allowance",
    args: evmAddress ? [evmAddress, CONTRACTS.kitpotCircle] : undefined,
    query: { enabled: !!evmAddress },
  });

  const needsApproval = allowance !== undefined && allowance < circle.contributionAmount;
  const insufficientBalance = tokenBalance !== undefined && tokenBalance < circle.contributionAmount;
  const circleFull = circle.memberCount >= circle.maxMembers;

  useEffect(() => {
    if (success) router.push(`/circles/${circleId.toString()}`);
  }, [success, router, circleId]);

  async function handleJoin() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (needsApproval) {
        setStatusMsg(`Approving ${tokenSymbol}...`);
        await approveToken(circle.tokenAddress, CONTRACTS.kitpotCircle);
        await refetchAllowance();
      }
      setStatusMsg("Joining circle...");
      await joinCircle(circleId, initUsername);
      setSuccess(true);
    } catch (err: unknown) {
      const parsed = parseTxError(err);
      setSubmitError(parsed.hint);
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
            <span className="font-medium">{formatUSDC(circle.contributionAmount)} {tokenSymbol} / cycle</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Collateral required</span>
            <span className="font-medium">{formatUSDC(circle.contributionAmount)} {tokenSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Members</span>
            <span className="font-medium">{circle.memberCount.toString()} / {circle.maxMembers.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total pot</span>
            <span className="font-semibold text-primary">
              {formatUSDC(circle.contributionAmount * circle.maxMembers)} {tokenSymbol}
            </span>
          </div>
        </div>

        {needsApproval && !submitting && (
          <p className="text-xs text-muted-foreground text-center">
            First time: will approve {tokenSymbol} then join automatically.
          </p>
        )}

        {circleFull && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            <p className="font-medium">Circle full</p>
            <p className="mt-1 text-xs">This circle has reached its maximum number of members.</p>
          </div>
        )}

        {insufficientBalance && !circleFull && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            <p className="font-medium">Insufficient {tokenSymbol} balance</p>
            <p className="mt-1 text-xs">
              You don&apos;t have enough {tokenSymbol} for collateral.{" "}
              <a href="/bridge" className="underline hover:text-yellow-100">Mint at Faucet</a>
            </p>
          </div>
        )}

        {(error || submitError) && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">Transaction failed</p>
            <p className="mt-1 text-xs opacity-80">{parseTxError(error ?? submitError).hint}</p>
          </div>
        )}

        <Button onClick={handleJoin} className="w-full" disabled={submitting || isPending || !evmAddress || insufficientBalance || circleFull}>
          {buttonLabel()}
        </Button>
      </CardContent>
    </Card>
  );
}
