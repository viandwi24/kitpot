"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { CONTRACTS, PAYMENT_TOKENS } from "@/lib/contracts";

export interface CircleData {
  id: bigint;
  name: string;
  description: string;
  creator: `0x${string}`;
  tokenAddress: `0x${string}`;
  contributionAmount: bigint;
  maxMembers: bigint;
  totalCycles: bigint;
  currentCycle: bigint;
  cycleDuration: bigint;
  gracePeriod: bigint;
  startTime: bigint;
  memberCount: bigint;
  latePenaltyBps: bigint;
  status: number;
  isPublic: boolean;
  minimumTier: number;
}

export interface MemberData {
  addr: `0x${string}`;
  initUsername: string;
  joinedAt: bigint;
  hasReceivedPot: boolean;
  turnOrder: bigint;
}

/** Resolve a payment token address to its symbol. Falls back to "TOKEN" if unknown. */
export function getTokenSymbol(tokenAddress: `0x${string}`): string {
  const found = PAYMENT_TOKENS.find(
    (t) => t.address.toLowerCase() === tokenAddress.toLowerCase(),
  );
  return found?.symbol ?? "TOKEN";
}

export function useCircleCount() {
  return useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "getCircleCount",
  });
}

export function useCircle(circleId: bigint) {
  return useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "getCircle",
    args: [circleId],
    query: { refetchInterval: 3000 },
  });
}

export function useCircleMembers(circleId: bigint) {
  return useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "getMembers",
    args: [circleId],
    query: { refetchInterval: 3000 },
  });
}

export function useIsMember(circleId: bigint, address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "isMember",
    args: address ? [circleId, address] : undefined,
    query: { enabled: !!address },
  });
}

export function useMyCircles(address: `0x${string}` | undefined, totalCircles: number) {
  // Read isMember for each circle ID
  const contracts = Array.from({ length: totalCircles }, (_, i) => ({
    address: CONTRACTS.kitpotCircle as `0x${string}`,
    abi: KITPOT_ABI,
    functionName: "isMember" as const,
    args: [BigInt(i), address!] as const,
  }));

  const results = useReadContracts({
    contracts: address ? contracts : [],
    query: { enabled: !!address && totalCircles > 0 },
  });

  // Get circle IDs where user is member
  const myCircleIds: bigint[] = [];
  if (results.data) {
    results.data.forEach((result, index) => {
      if (result.status === "success" && result.result === true) {
        myCircleIds.push(BigInt(index));
      }
    });
  }

  return {
    ...results,
    myCircleIds,
  };
}
