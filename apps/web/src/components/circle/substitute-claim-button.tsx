"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";
import { parseTxError } from "@/lib/tx-errors";
import { formatUSDC } from "@/lib/utils";
import { getTokenSymbol } from "@/hooks/use-circles";

interface SubstituteClaimButtonProps {
  circleId: bigint;
  potAmount: bigint;
  tokenAddress: `0x${string}`;
}

export function SubstituteClaimButton({ circleId, potAmount, tokenAddress }: SubstituteClaimButtonProps) {
  const { substituteClaim, isPending } = useKitpotTx();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const symbol = getTokenSymbol(tokenAddress);
  // Keeper reward is 0.1% of pot
  const keeperReward = potAmount / 1000n;

  async function handleSubstituteClaim() {
    setSubmitting(true);
    setError(null);
    try {
      await substituteClaim(circleId);
      setDone(true);
    } catch (err) {
      setError(parseTxError(err).hint);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 text-center">
        Substitute claim executed! Keeper reward earned.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Recipient hasn&apos;t claimed. You can deliver their pot and earn 0.1%
        ({formatUSDC(keeperReward)} {symbol}) keeper fee.
      </p>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleSubstituteClaim}
        disabled={submitting || isPending}
      >
        {submitting || isPending
          ? "Processing..."
          : `Substitute claim (earn ${formatUSDC(keeperReward)} ${symbol})`}
      </Button>
    </div>
  );
}
