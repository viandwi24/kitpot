"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { maxUint256 } from "viem";
import { Button } from "@/components/ui/button";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { CONTRACTS } from "@/lib/contracts";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";
import { useHasPaid } from "@/hooks/use-circle-dashboard";
import type { CircleData } from "@/hooks/use-circles";

interface DepositButtonProps {
  circleId: bigint;
  circle: CircleData;
  userAddress: `0x${string}` | undefined;
}

export function DepositButton({ circleId, circle, userAddress }: DepositButtonProps) {
  const { data: alreadyPaid, refetch: refetchPaid } = useHasPaid(circleId, circle.currentCycle, userAddress);
  const { deposit, approveUSDC, isPending, error } = useKitpotTx();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, CONTRACTS.kitpotCircle] : undefined,
    query: { enabled: !!userAddress },
  });

  const needsApproval = allowance !== undefined && allowance < circle.contributionAmount;

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

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
    try {
      if (needsApproval) {
        setStatusMsg("Approving...");
        await approveUSDC(CONTRACTS.kitpotCircle, maxUint256);
        await refetchAllowance();
      }

      setStatusMsg("Depositing...");
      await deposit(circleId);
      await refetchPaid();
      setDone(true);
    } catch (err) {
      alert(err instanceof Error ? err.message.slice(0, 200) : "Transaction failed");
    } finally {
      setSubmitting(false);
      setStatusMsg("");
    }
  }

  return (
    <Button size="sm" className="flex-1" disabled={submitting || isPending} onClick={handleDeposit}>
      {submitting || isPending ? (statusMsg || "Processing...") : "Pay Contribution"}
    </Button>
  );
}
