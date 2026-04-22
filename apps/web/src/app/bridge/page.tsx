"use client";

import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUSDC } from "@/lib/utils";
import { useTokenBalance, useMintTestUSDC } from "@/hooks/use-bridge";
import { CONTRACTS } from "@/lib/contracts";
import { useState } from "react";

export default function BridgePage() {
  const { address } = useAccount();
  const { data: balance } = useTokenBalance(CONTRACTS.mockUSDC);
  const { mint, isPending, isConfirming, isSuccess } = useMintTestUSDC();
  const [amount, setAmount] = useState("1000");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Bridge & Top-up</h1>
      <p className="mb-6 text-muted-foreground">
        Deposit funds from Initia hub to your kitpot-1 rollup wallet.
      </p>

      {/* Balance */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {balance !== undefined ? formatUSDC(balance) : "..."} <span className="text-lg text-muted-foreground">USDC</span>
          </div>
        </CardContent>
      </Card>

      {/* Interwoven Bridge */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Interwoven Bridge</CardTitle>
          <CardDescription>
            Transfer USDC from Initia hub to kitpot-1 rollup via IBC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-secondary p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
              <span>Initia Hub (L1)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span>kitpot-1 (Rollup)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asset</span>
              <span>USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bridge Fee</span>
              <span>~0.01 INIT</span>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => {
              // TODO: Replace with useInterwovenKit().openBridge() after full package install
              // For now this opens the bridge modal from InterwovenKit
              alert("Bridge opens via InterwovenKit — available after connecting to Initia testnet");
            }}
          >
            Bridge from Initia Hub
          </Button>
        </CardContent>
      </Card>

      {/* Testnet Faucet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Testnet Faucet</CardTitle>
          <CardDescription>Mint free USDC for testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Amount (USDC)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
            />
          </div>
          <Button
            className="w-full"
            variant="secondary"
            disabled={isPending || isConfirming || !address}
            onClick={() => mint(amount)}
          >
            {isPending || isConfirming
              ? "Minting..."
              : isSuccess
              ? "Minted! Refresh to see balance"
              : `Mint ${amount} USDC`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
