"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";
import { parseTxError } from "@/lib/tx-errors";
import { formatUSDC } from "@/lib/utils";
import { getTokenSymbol } from "@/hooks/use-circles";

interface ClaimPotButtonProps {
  circleId: bigint;
  potAmount: bigint;
  tokenAddress: `0x${string}`;
}

export function ClaimPotButton({ circleId, potAmount, tokenAddress }: ClaimPotButtonProps) {
  const { claimPot, isPending } = useKitpotTx();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const symbol = getTokenSymbol(tokenAddress);

  async function handleClaim() {
    setSubmitting(true);
    setError(null);
    try {
      await claimPot(circleId);
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
        Pot claimed successfully!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <Button
        className="w-full"
        onClick={handleClaim}
        disabled={submitting || isPending}
      >
        {submitting || isPending
          ? "Claiming..."
          : `Claim ${formatUSDC(potAmount)} ${symbol} pot`}
      </Button>
    </div>
  );
}
