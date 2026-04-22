"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { CONTRACTS, USDC_DECIMALS } from "@/lib/contracts";

interface CreateCircleParams {
  name: string;
  description: string;
  contributionAmount: string;
  maxMembers: number;
  cycleDuration: number;
  gracePeriod: number;
  latePenaltyBps: number;
  isPublic: boolean;
  minimumTier: number;
}

export function useCreateCircle() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function createCircle(params: CreateCircleParams) {
    writeContract({
      address: CONTRACTS.kitpotCircle,
      abi: KITPOT_ABI,
      functionName: "createCircle",
      args: [
        params.name,
        params.description,
        CONTRACTS.mockUSDC,
        parseUnits(params.contributionAmount, USDC_DECIMALS),
        BigInt(params.maxMembers),
        BigInt(params.cycleDuration),
        BigInt(params.gracePeriod),
        BigInt(params.latePenaltyBps),
        params.isPublic,
        params.minimumTier,
      ],
    });
  }

  return { createCircle, hash, isPending, isConfirming, isSuccess, error };
}

export function useJoinCircle() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function joinCircle(circleId: bigint, initUsername: string) {
    writeContract({
      address: CONTRACTS.kitpotCircle,
      abi: KITPOT_ABI,
      functionName: "joinCircle",
      args: [circleId, initUsername],
    });
  }

  return { joinCircle, hash, isPending, isConfirming, isSuccess, error };
}
