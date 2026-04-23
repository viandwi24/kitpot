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

export default function FaucetPage() {
  const { address } = useAccount();
  const { data: balance } = useTokenBalance(CONTRACTS.mockUSDC);
  const { mint, isPending, isConfirming, isSuccess } = useMintTestUSDC();
  const [amount, setAmount] = useState("1000");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Testnet Faucet</h1>
      <p className="mb-6 text-muted-foreground">
        Mint free test USDC to your wallet and start joining savings circles.
      </p>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {balance !== undefined ? formatUSDC(balance) : "..."}{" "}
            <span className="text-lg text-muted-foreground">USDC</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Get Test USDC</CardTitle>
          <CardDescription>Mint free USDC for testing on kitpot-2 testnet</CardDescription>
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
            disabled={isPending || isConfirming || !address}
            onClick={() => mint(amount)}
          >
            {isPending || isConfirming
              ? "Minting..."
              : isSuccess
              ? "Minted! Refresh to see balance"
              : `Mint ${amount} USDC`}
          </Button>
          {!address && (
            <p className="text-center text-xs text-muted-foreground">Connect wallet to mint</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
