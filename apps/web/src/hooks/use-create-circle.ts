"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { parseUnits, maxUint256 } from "viem";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
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
  initUsername: string;
}

export function useUSDCApproval(spender: `0x${string}`, amount: bigint) {
  const { address } = useAccount();
  const { data: allowance, refetch } = useReadContract({
    address: CONTRACTS.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: address ? [address, spender] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve() {
    writeContract({
      address: CONTRACTS.mockUSDC,
      abi: MOCK_USDC_ABI,
      functionName: "approve",
      args: [spender, maxUint256],
    });
  }

  const needsApproval = allowance !== undefined && allowance < amount;

  return { needsApproval, approve, isPending, isConfirming, isSuccess, error, refetch };
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
        params.initUsername,
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
