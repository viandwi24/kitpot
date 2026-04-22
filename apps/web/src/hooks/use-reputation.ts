"use client";

import { useReadContract } from "wagmi";
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
