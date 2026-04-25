"use client";

import { useState } from "react";
import { encodeFunctionData, maxUint256, type Abi } from "viem";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { REPUTATION_ABI } from "@/lib/abi/KitpotReputation";
import { CONTRACTS } from "@/lib/contracts";
import { getNetworkConfig } from "@/lib/network";

const net = getNetworkConfig();
const CHAIN_ID = net.cosmosChainId;

function msgCall(
  contractAddr: `0x${string}`,
  abi: Abi,
  functionName: string,
  args: readonly unknown[],
  sender: string,
) {
  return {
    typeUrl: "/minievm.evm.v1.MsgCall",
    value: {
      sender: sender.toLowerCase(),
      contractAddr,
      input: encodeFunctionData({ abi: abi as Abi, functionName, args }),
      value: "0",
      accessList: [],
      authList: [],
    },
  };
}

// Minimal fee for submitTxBlock path. Rollup gas_price = 0, so any non-negative
// amount works. Shape (StdFee) is required by @initia/interwovenkit's TxParams
// type. SDK @2.8.0 does NOT accept an `autoSign` flag on requestTxBlock (that's
// a BlockForge blueprint pattern from a different SDK version). We must keep
// the split: submitTxBlock for auto-sign path, requestTxBlock for drawer path.
const AUTO_SIGN_FEE = {
  amount: [{ denom: net.nativeSymbol, amount: "0" }],
  gas: "500000",
};

export function useKitpotTx() {
  const { initiaAddress, requestTxBlock, submitTxBlock, autoSign } =
    useInterwovenKit();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function send(messages: ReturnType<typeof msgCall>[]) {
    if (!initiaAddress) throw new Error("Wallet not connected");
    setIsPending(true);
    setError(null);
    try {
      const isAuto = autoSign?.isEnabledByChain[CHAIN_ID] ?? false;
      if (isAuto) {
        return await submitTxBlock({ chainId: CHAIN_ID, messages, fee: AUTO_SIGN_FEE });
      }
      return await requestTxBlock({ chainId: CHAIN_ID, messages });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }

  return {
    isPending,
    error,
    autoSignEnabled: autoSign?.isEnabledByChain[CHAIN_ID] ?? false,

    // ── Token-generic helpers ──

    /** Approve any ERC20 token for a spender. */
    approveToken: (tokenAddress: `0x${string}`, spender: `0x${string}`, amount = maxUint256) =>
      send([
        msgCall(
          tokenAddress,
          MOCK_USDC_ABI as Abi, // same ABI shape for all ERC20 mocks
          "approve",
          [spender, amount],
          initiaAddress!,
        ),
      ]),

    /** Mint any mock ERC20 token (testnet only). */
    mintToken: (tokenAddress: `0x${string}`, to: `0x${string}`, amount: bigint) =>
      send([
        msgCall(
          tokenAddress,
          MOCK_USDC_ABI as Abi,
          "mint",
          [to, amount],
          initiaAddress!,
        ),
      ]),

    // ── Backward-compat wrappers (existing callers keep working) ──

    /** @deprecated Use approveToken(CONTRACTS.mockUSDC, spender, amount) */
    approveUSDC: (spender: `0x${string}`, amount = maxUint256) =>
      send([
        msgCall(
          CONTRACTS.mockUSDC,
          MOCK_USDC_ABI as Abi,
          "approve",
          [spender, amount],
          initiaAddress!,
        ),
      ]),

    createCircle: (p: {
      name: string;
      description: string;
      paymentToken?: `0x${string}`;
      contributionAmount: bigint;
      maxMembers: bigint;
      cycleDuration: bigint;
      gracePeriod: bigint;
      latePenaltyBps: bigint;
      isPublic: boolean;
      minimumTier: number;
      initUsername: string;
    }) =>
      send([
        msgCall(
          CONTRACTS.kitpotCircle,
          KITPOT_ABI as Abi,
          "createCircle",
          [
            p.name,
            p.description,
            p.paymentToken ?? CONTRACTS.mockUSDC,
            p.contributionAmount,
            p.maxMembers,
            p.cycleDuration,
            p.gracePeriod,
            p.latePenaltyBps,
            p.isPublic,
            p.minimumTier,
            p.initUsername,
          ],
          initiaAddress!,
        ),
      ]),

    joinCircle: (circleId: bigint, initUsername: string) =>
      send([
        msgCall(
          CONTRACTS.kitpotCircle,
          KITPOT_ABI as Abi,
          "joinCircle",
          [circleId, initUsername],
          initiaAddress!,
        ),
      ]),

    deposit: (circleId: bigint) =>
      send([
        msgCall(
          CONTRACTS.kitpotCircle,
          KITPOT_ABI as Abi,
          "deposit",
          [circleId],
          initiaAddress!,
        ),
      ]),

    claimPot: (circleId: bigint) =>
      send([
        msgCall(
          CONTRACTS.kitpotCircle,
          KITPOT_ABI as Abi,
          "claimPot",
          [circleId],
          initiaAddress!,
        ),
      ]),

    substituteClaim: (circleId: bigint) =>
      send([
        msgCall(
          CONTRACTS.kitpotCircle,
          KITPOT_ABI as Abi,
          "substituteClaim",
          [circleId],
          initiaAddress!,
        ),
      ]),

    /** @deprecated Use claimPot() or substituteClaim() */
    advanceCycle: (circleId: bigint) =>
      send([
        msgCall(
          CONTRACTS.kitpotCircle,
          KITPOT_ABI as Abi,
          "advanceCycle",
          [circleId],
          initiaAddress!,
        ),
      ]),

    claimDailyQuest: () =>
      send([
        msgCall(
          CONTRACTS.reputation,
          REPUTATION_ABI as Abi,
          "claimDailyQuest",
          [],
          initiaAddress!,
        ),
      ]),

    /** @deprecated Use mintToken(CONTRACTS.mockUSDC, to, amount) */
    mintTestUSDC: (to: `0x${string}`, amount: bigint) =>
      send([
        msgCall(
          CONTRACTS.mockUSDC,
          MOCK_USDC_ABI as Abi,
          "mint",
          [to, amount],
          initiaAddress!,
        ),
      ]),
  };
}
