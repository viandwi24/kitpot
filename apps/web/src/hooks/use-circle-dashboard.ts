"use client";

import { useReadContract } from "wagmi";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { CONTRACTS } from "@/lib/contracts";

export function useCyclePaymentStatus(circleId: bigint) {
  return useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "getCyclePaymentStatus",
    args: [circleId],
  });
}

export function useCurrentCycleInfo(circleId: bigint) {
  return useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "getCurrentCycleInfo",
    args: [circleId],
  });
}

export function useAllMembersPaid(circleId: bigint) {
  return useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "allMembersPaid",
    args: [circleId],
  });
}

export function useHasPaid(circleId: bigint, cycle: bigint, address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "hasPaid",
    args: address ? [circleId, cycle, address] : undefined,
    query: { enabled: !!address },
  });
}
