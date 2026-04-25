"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { maxUint256 } from "viem";
import { Button } from "@/components/ui/button";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { CONTRACTS } from "@/lib/contracts";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";
import { useHasPaid } from "@/hooks/use-circle-dashboard";
import { getTokenSymbol, type CircleData } from "@/hooks/use-circles";
import { parseTxError } from "@/lib/tx-errors";

interface DepositButtonProps {
  circleId: bigint;
  circle: CircleData;
  userAddress: `0x${string}` | undefined;
}

export function DepositButton({ circleId, circle, userAddress }: DepositButtonProps) {
  const { data: alreadyPaid, refetch: refetchPaid } = useHasPaid(circleId, circle.currentCycle, userAddress);
  const { deposit, approveToken, isPending, error } = useKitpotTx();
  const tokenSymbol = getTokenSymbol(circle.tokenAddress);

  const { data: tokenBalance } = useReadContract({
    address: circle.tokenAddress,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  }) as { data: bigint | undefined };

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: circle.tokenAddress,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, CONTRACTS.kitpotCircle] : undefined,
    query: { enabled: !!userAddress },
  });

  const needsApproval = allowance !== undefined && allowance < circle.contributionAmount;
  const insufficientBalance = tokenBalance !== undefined && tokenBalance < circle.contributionAmount;

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [depositError, setDepositError] = useState<string | null>(null);

  if (!userAddress || alreadyPaid || done) {
    return (
      <Button disabled size="sm" className="flex-1">
        {alreadyPaid || done ? "Already Paid" : "Connect wallet"}
      </Button>
    );
  }

  async function handleDeposit() {
    if (!userAddress) return;
    setSubmitting(true);
    setDepositError(null);
    try {
      if (needsApproval) {
        setStatusMsg("Approving...");
        await approveToken(circle.tokenAddress, CONTRACTS.kitpotCircle, maxUint256);
        await refetchAllowance();
      }

      setStatusMsg("Depositing...");
      await deposit(circleId);
      await refetchPaid();
      setDone(true);
    } catch (err) {
      const parsed = parseTxError(err);
      setDepositError(parsed.hint);
    } finally {
      setSubmitting(false);
      setStatusMsg("");
    }
  }

  return (
    <div className="flex flex-col gap-2 flex-1">
      {insufficientBalance && (
        <p className="text-xs text-yellow-400">
          Not enough {tokenSymbol}.{" "}
          <a href="/bridge" className="underline">Mint at Faucet</a>
        </p>
      )}
      {depositError && (
        <p className="text-xs text-destructive">{depositError}</p>
      )}
      <Button size="sm" className="w-full" disabled={submitting || isPending || insufficientBalance} onClick={handleDeposit}>
        {submitting || isPending ? (statusMsg || "Processing...") : "Pay Contribution"}
      </Button>
    </div>
  );
}
