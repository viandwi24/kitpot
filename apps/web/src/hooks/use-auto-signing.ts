"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { CONTRACTS } from "@/lib/contracts";

// For MVP, the "operator" is the contract itself — any address can call batchDeposit.
// In production, this would be a dedicated keeper/relayer address.
const OPERATOR_ADDRESS = CONTRACTS.kitpotCircle;

export function useAutoSigning(circleId: bigint) {
  const { address } = useAccount();

  const { data: sessionData } = useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "sessions",
    args: address ? [address, OPERATOR_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const { data: isValid } = useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "isSessionValid",
    args: address ? [address, OPERATOR_ADDRESS, circleId] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance } = useReadContract({
    address: CONTRACTS.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.kitpotCircle] : undefined,
    query: { enabled: !!address },
  });

  // Approve USDC
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // Authorize session
  const {
    writeContract: writeAuthorize,
    data: authorizeHash,
    isPending: isAuthorizing,
  } = useWriteContract();
  const { isLoading: isAuthorizeConfirming, isSuccess: authorizeSuccess } =
    useWaitForTransactionReceipt({ hash: authorizeHash });

  // Revoke session
  const {
    writeContract: writeRevoke,
    data: revokeHash,
    isPending: isRevoking,
  } = useWriteContract();
  const { isLoading: isRevokeConfirming } = useWaitForTransactionReceipt({ hash: revokeHash });

  function approveUSDC(totalAmount: bigint) {
    writeApprove({
      address: CONTRACTS.mockUSDC,
      abi: MOCK_USDC_ABI,
      functionName: "approve",
      args: [CONTRACTS.kitpotCircle, totalAmount],
    });
  }

  function authorizeSession(maxAmountPerCycle: bigint, expiry: bigint) {
    writeAuthorize({
      address: CONTRACTS.kitpotCircle,
      abi: KITPOT_ABI,
      functionName: "authorizeSession",
      args: [OPERATOR_ADDRESS, circleId, maxAmountPerCycle, expiry],
    });
  }

  function revokeSession() {
    writeRevoke({
      address: CONTRACTS.kitpotCircle,
      abi: KITPOT_ABI,
      functionName: "revokeSession",
      args: [OPERATOR_ADDRESS],
    });
  }

  return {
    hasSession: isValid ?? false,
    sessionData,
    allowance: allowance ?? 0n,
    approveUSDC,
    authorizeSession,
    revokeSession,
    isApproving: isApproving || isApproveConfirming,
    isAuthorizing: isAuthorizing || isAuthorizeConfirming,
    isRevoking: isRevoking || isRevokeConfirming,
    approveSuccess,
    authorizeSuccess,
  };
}
