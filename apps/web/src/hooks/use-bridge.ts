"use client";

import { useReadContract, useAccount } from "wagmi";
import { parseUnits } from "viem";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { USDC_DECIMALS } from "@/lib/contracts";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";
import { useState } from "react";

export function useTokenBalance(tokenAddress: `0x${string}`) {
  const { address } = useAccount();

  return useReadContract({
    address: tokenAddress,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });
}

export function useMintTestUSDC(onSuccess?: () => void) {
  const { address } = useAccount();
  const { mintTestUSDC, isPending } = useKitpotTx();
  const [mintedAmount, setMintedAmount] = useState<string | null>(null);

  async function mint(amount: string = "1000") {
    if (!address) return;
    try {
      await mintTestUSDC(address as `0x${string}`, parseUnits(amount, USDC_DECIMALS));
      setMintedAmount(amount);
      onSuccess?.();
      setTimeout(() => setMintedAmount(null), 3500);
    } catch {
      setMintedAmount(null);
    }
  }

  return { mint, isPending, isConfirming: false, mintedAmount };
}
