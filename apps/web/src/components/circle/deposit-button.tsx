"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { CONTRACTS } from "@/lib/contracts";
import { useHasPaid } from "@/hooks/use-circle-dashboard";
import type { CircleData } from "@/hooks/use-circles";

interface DepositButtonProps {
  circleId: bigint;
  circle: CircleData;
  userAddress: `0x${string}` | undefined;
}

export function DepositButton({ circleId, circle, userAddress }: DepositButtonProps) {
  const { data: alreadyPaid } = useHasPaid(circleId, circle.currentCycle, userAddress);

  const { data: allowance } = useReadContract({
    address: CONTRACTS.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, CONTRACTS.kitpotCircle] : undefined,
    query: { enabled: !!userAddress },
  });

  const needsApproval = allowance !== undefined && allowance < circle.contributionAmount;

  const { writeContract: writeApprove, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isApprovingConfirm } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: writeDeposit, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { isLoading: isDepositingConfirm, isSuccess: depositConfirmed } = useWaitForTransactionReceipt({ hash: depositHash });

  if (!userAddress || alreadyPaid || depositConfirmed) {
    return (
      <Button disabled size="sm" className="flex-1">
        {alreadyPaid || depositConfirmed ? "Already Paid" : "Connect wallet"}
      </Button>
    );
  }

  if (needsApproval) {
    return (
      <Button
        size="sm"
        className="flex-1"
        disabled={isApproving || isApprovingConfirm}
        onClick={() =>
          writeApprove({
            address: CONTRACTS.mockUSDC,
            abi: MOCK_USDC_ABI,
            functionName: "approve",
            args: [CONTRACTS.kitpotCircle, circle.contributionAmount * circle.totalCycles],
          })
        }
      >
        {isApproving || isApprovingConfirm ? "Approving..." : "Approve USDC"}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="flex-1"
      disabled={isDepositing || isDepositingConfirm}
      onClick={() =>
        writeDeposit({
          address: CONTRACTS.kitpotCircle,
          abi: KITPOT_ABI,
          functionName: "deposit",
          args: [circleId],
        })
      }
    >
      {isDepositing || isDepositingConfirm ? "Depositing..." : "Pay Contribution"}
    </Button>
  );
}
