"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { parseUnits } from "viem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTokenBalance } from "@/hooks/use-bridge";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";
import { formatUSDC } from "@/lib/utils";
import { PAYMENT_TOKENS } from "@/lib/contracts";
import { getNetworkConfig } from "@/lib/network";

const net = getNetworkConfig();

export default function FaucetPage() {
  const { address } = useAccount();
  const { openDeposit, openWithdraw } = useInterwovenKit();

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Testnet Faucet</h1>
        <p className="mt-2 text-muted-foreground">
          Get the tokens you need to join savings circles on {net.cosmosChainId}. Mint
          mock stablecoins below; bridge native GAS from Initia L1 via the
          Interwoven Bridge.
        </p>
      </div>

      {/* ── Per-token mint rows ── */}
      {PAYMENT_TOKENS.map((token) => (
        <TokenMintCard key={token.symbol} token={token} address={address} />
      ))}

      {/* ── Interwoven Bridge (bidirectional) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interwoven Bridge</CardTitle>
          <CardDescription>
            Bridge INIT or other assets from L1 to your appchain — and back.
            This demonstrates how Kitpot plugs into the Interwoven Stack for
            faster onboarding and easier liquidity access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            If the bridge modal shows &ldquo;No available assets&rdquo;, your
            wallet has no <code>uinit</code> on the source chain yet — this is a
            documented limitation of the Interwoven UI when chain IDs are not in
            the public registry.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              disabled={!address}
              onClick={() =>
                openDeposit({
                  denoms: ["uinit"],
                  chainId: "initiation-2",
                })
              }
            >
              Deposit from L1 &rarr;
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={!address}
              onClick={() =>
                openWithdraw({
                  denoms: ["uinit"],
                  chainId: net.cosmosChainId,
                })
              }
            >
              &larr; Withdraw to L1
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Per-token mint card ──

function TokenMintCard({
  token,
  address,
}: {
  token: (typeof PAYMENT_TOKENS)[number];
  address: `0x${string}` | undefined;
}) {
  const { data: balance, refetch: refetchBalance } = useTokenBalance(token.address);
  const { mintToken, isPending } = useKitpotTx();
  const [amount, setAmount] = useState("1000");
  const [mintedAmount, setMintedAmount] = useState<string | null>(null);

  async function handleMint() {
    if (!address) return;
    try {
      await mintToken(token.address, address, parseUnits(amount, token.decimals));
      setMintedAmount(amount);
      refetchBalance();
      setTimeout(() => setMintedAmount(null), 3500);
    } catch {
      setMintedAmount(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{token.symbol}</CardTitle>
        <CardDescription>{token.name} — testnet only</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">
          {balance !== undefined ? formatUSDC(balance) : "..."}{" "}
          <span className="text-base text-muted-foreground">{token.symbol}</span>
        </div>
        {mintedAmount && (
          <p className="text-sm text-primary">+{mintedAmount} {token.symbol} minted</p>
        )}
        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            className="flex-1"
          />
          <Button disabled={isPending || !address} onClick={handleMint}>
            {isPending ? "Minting..." : `Mint ${token.symbol}`}
          </Button>
        </div>
        {!address && (
          <p className="text-center text-xs text-muted-foreground">Connect wallet to mint</p>
        )}
      </CardContent>
    </Card>
  );
}
