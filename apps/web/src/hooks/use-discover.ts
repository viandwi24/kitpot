"use client";

import { useReadContracts, useReadContract } from "wagmi";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { CONTRACTS } from "@/lib/contracts";
import type { CircleData } from "./use-circles";

export function usePublicCircles(totalCircles: number) {
  // Read all circles and filter for public + forming
  const contracts = Array.from({ length: totalCircles }, (_, i) => ({
    address: CONTRACTS.kitpotCircle as `0x${string}`,
    abi: KITPOT_ABI,
    functionName: "getCircle" as const,
    args: [BigInt(i)] as const,
  }));

  const results = useReadContracts({
    contracts: totalCircles > 0 ? contracts : [],
    query: { enabled: totalCircles > 0 },
  });

  const publicCircles: CircleData[] = [];
  if (results.data) {
    results.data.forEach((result) => {
      if (result.status === "success" && result.result) {
        const circle = result.result as unknown as CircleData;
        // Only show public circles that are still forming
        if (circle.isPublic && circle.status === 0) {
          publicCircles.push(circle);
        }
      }
    });
  }

  return { ...results, publicCircles };
}
