// TODO: DEPRECATED — Remove after contract redeploy + UI migration to ClaimPotButton / SubstituteClaimButton.
// Kept for backward compat with old deployed contract.
"use client";

import { Button } from "@/components/ui/button";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";

interface AdvanceCycleButtonProps {
  circleId: bigint;
  allPaid: boolean;
  canAdvance: boolean;
}

export function AdvanceCycleButton({ circleId, allPaid, canAdvance }: AdvanceCycleButtonProps) {
  const { advanceCycle, isPending } = useKitpotTx();

  const disabled = !allPaid || !canAdvance || isPending;

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1"
      disabled={disabled}
      onClick={() => advanceCycle(circleId)}
    >
      {isPending
        ? "Distributing..."
        : !allPaid
        ? "Waiting for all payments"
        : "Distribute Pot"}
    </Button>
  );
}
