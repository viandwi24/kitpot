"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUSDC } from "@/lib/utils";
import { useTokenBalance, useMintTestUSDC } from "@/hooks/use-bridge";
import { CONTRACTS } from "@/lib/contracts";

export function BridgeDeposit() {
  const { data: balance } = useTokenBalance(CONTRACTS.mockUSDC);
  const { mint, isPending, isConfirming, isSuccess } = useMintTestUSDC();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Balance & Top-up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">USDC Balance: </span>
          <span className="font-medium">
            {balance !== undefined ? formatUSDC(balance) : "..."} USDC
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              // TODO: useInterwovenKit().openBridge() after package install
              alert("Bridge modal available after InterwovenKit is installed");
            }}
          >
            Deposit via Bridge
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            disabled={isPending || isConfirming}
            onClick={() => mint("1000")}
          >
            {isPending || isConfirming
              ? "Minting..."
              : isSuccess
              ? "Minted! Refresh"
              : "Mint 1000 USDC (Testnet)"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
