"use client";

import { useReadContract, useAccount } from "wagmi";
import { parseUnits } from "viem";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { CONTRACTS, USDC_DECIMALS } from "@/lib/contracts";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";
import { useState } from "react";

export function useTokenBalance(tokenAddress: `0x${string}`) {
  const { address } = useAccount();

  return useReadContract({
    address: tokenAddress,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useMintTestUSDC() {
  const { address } = useAccount();
  const { mintTestUSDC, isPending } = useKitpotTx();
  const [isSuccess, setIsSuccess] = useState(false);

  async function mint(amount: string = "1000") {
    if (!address) return;
    setIsSuccess(false);
    await mintTestUSDC(address as `0x${string}`, parseUnits(amount, USDC_DECIMALS));
    setIsSuccess(true);
  }

  return { mint, isPending, isConfirming: false, isSuccess };
}
