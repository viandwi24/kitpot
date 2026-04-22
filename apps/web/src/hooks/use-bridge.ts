"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseUnits } from "viem";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { CONTRACTS, USDC_DECIMALS } from "@/lib/contracts";

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
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function mint(amount: string = "1000") {
    if (!address) return;
    writeContract({
      address: CONTRACTS.mockUSDC,
      abi: MOCK_USDC_ABI,
      functionName: "mint",
      args: [address, parseUnits(amount, USDC_DECIMALS)],
    });
  }

  return { mint, isPending, isConfirming, isSuccess };
}
