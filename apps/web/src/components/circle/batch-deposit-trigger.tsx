"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { CONTRACTS } from "@/lib/contracts";

interface BatchDepositTriggerProps {
  circleId: bigint;
}

export function BatchDepositTrigger({ circleId }: BatchDepositTriggerProps) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trigger Auto-Payments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Collect contributions from all members who have auto-pay enabled.
        </p>
        <Button
          className="w-full"
          variant="outline"
          disabled={isPending || isConfirming}
          onClick={() =>
            writeContract({
              address: CONTRACTS.kitpotCircle,
              abi: KITPOT_ABI,
              functionName: "batchDeposit",
              args: [circleId],
            })
          }
        >
          {isPending || isConfirming
            ? "Processing..."
            : isSuccess
            ? "Done! Refresh to see status"
            : "Collect All Contributions"}
        </Button>
      </CardContent>
    </Card>
  );
}
