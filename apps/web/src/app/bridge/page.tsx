"use client";

import { useAccount } from "wagmi";
import { useInterwovenKit } from "@initia/interwovenkit-react";
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
  const { openBridge } = useInterwovenKit();
  const { data: balance, refetch: refetchBalance } = useTokenBalance(CONTRACTS.mockUSDC);
  const { mint, isPending, mintedAmount } = useMintTestUSDC(() => refetchBalance());
  const [amount, setAmount] = useState("1000");

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Testnet Faucet</h1>
        <p className="mt-2 text-muted-foreground">
          Mint free test USDC or bridge from Initia L1 to join savings circles on kitpot-2.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {balance !== undefined ? formatUSDC(balance) : "..."}{" "}
            <span className="text-lg text-muted-foreground">USDC</span>
          </div>
          {mintedAmount && (
            <p className="mt-2 text-sm text-primary">+{mintedAmount} USDC minted</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mint Test USDC</CardTitle>
          <CardDescription>Free mock USDC for testing — kitpot-2 testnet</CardDescription>
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
            disabled={isPending || !address}
            onClick={() => mint(amount)}
          >
            {isPending ? "Minting..." : `Mint ${amount} USDC`}
          </Button>
          {!address && (
            <p className="text-center text-xs text-muted-foreground">
              Connect wallet to mint
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bridge from Initia L1</CardTitle>
          <CardDescription>
            Move assets from Initia hub (initiation-2) to the kitpot-2 rollup via Interwoven Bridge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            disabled={!address}
            onClick={() => openBridge()}
          >
            Open Bridge
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
