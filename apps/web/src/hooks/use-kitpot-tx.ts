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
        return await submitTxBlock({ chainId: CHAIN_ID, messages });
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
            CONTRACTS.mockUSDC,
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
