"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { REPUTATION_ABI } from "@/lib/abi/KitpotReputation";
import { CONTRACTS } from "@/lib/contracts";

export const TIER_NAMES = ["Unranked", "Bronze", "Silver", "Gold", "Diamond"] as const;
export const TIER_COLORS: Record<number, string> = {
  0: "text-muted-foreground",
  1: "text-amber-600",
  2: "text-slate-400",
  3: "text-yellow-400",
  4: "text-cyan-300",
};

export const LEVEL_NAMES = ["Novice", "Apprentice", "Saver", "Expert", "Master", "Legendary"] as const;
export const LEVEL_XP_THRESHOLDS = [0, 100, 500, 1500, 4000, 10000] as const;

export function useReputation(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.reputation,
    abi: REPUTATION_ABI,
    functionName: "getReputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useTier(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.reputation,
    abi: REPUTATION_ABI,
    functionName: "getTier",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useLevel(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.reputation,
    abi: REPUTATION_ABI,
    functionName: "getLevel",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useXPProgress(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.reputation,
    abi: REPUTATION_ABI,
    functionName: "xpForNextLevel",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useClaimDailyQuest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function claim() {
    writeContract({
      address: CONTRACTS.reputation,
      abi: REPUTATION_ABI,
      functionName: "claimDailyQuest",
    });
  }

  return { claim, isPending, isConfirming, isSuccess, error };
}
