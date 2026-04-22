"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { CONTRACTS } from "@/lib/contracts";

interface AdvanceCycleButtonProps {
  circleId: bigint;
  allPaid: boolean;
  canAdvance: boolean;
}

export function AdvanceCycleButton({ circleId, allPaid, canAdvance }: AdvanceCycleButtonProps) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const disabled = !allPaid || !canAdvance || isPending || isConfirming;

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1"
      disabled={disabled}
      onClick={() =>
        writeContract({
          address: CONTRACTS.kitpotCircle,
          abi: KITPOT_ABI,
          functionName: "advanceCycle",
          args: [circleId],
        })
      }
    >
      {isPending || isConfirming
        ? "Distributing..."
        : !allPaid
        ? "Waiting for all payments"
        : "Distribute Pot"}
    </Button>
  );
}
