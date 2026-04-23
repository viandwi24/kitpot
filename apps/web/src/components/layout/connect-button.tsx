"use client";

import { useEffect, useState } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";
import { useInitUsername } from "@/hooks/use-init-username";
import { NETWORKS, getSelectedNetwork } from "@/lib/network";

const ONBOARDED_PREFIX = "kitpot_onboarded";

function hasSeenWelcome(address: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return (
      window.localStorage.getItem(`${ONBOARDED_PREFIX}_${address.toLowerCase()}`) === "1" ||
      window.localStorage.getItem(ONBOARDED_PREFIX) === "1"
    );
  } catch {
    return true;
  }
}

function markSeenWelcome(address: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${ONBOARDED_PREFIX}_${address.toLowerCase()}`, "1");
    window.localStorage.setItem(ONBOARDED_PREFIX, "1");
  } catch {
    /* ignore storage errors */
  }
}

export function useWelcomeModal() {
  const { isConnected } = useInterwovenKit();
  const { address: evmAddress } = useAccount();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!isConnected || !evmAddress) return;
    if (hasSeenWelcome(evmAddress)) return;
    setShowWelcome(true);
  }, [isConnected, evmAddress]);

  function handleClose() {
    if (evmAddress) markSeenWelcome(evmAddress);
    setShowWelcome(false);
  }

  return { showWelcome, handleClose };
}

function useAutoSwitchNetwork() {
  const { address } = useAccount();

  useEffect(() => {
    if (!address) return;
    if (getSelectedNetwork() !== "testnet") return;

    const eth = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!eth) return;

    const { chainId, rpcUrl } = NETWORKS.testnet;
    const chainIdHex = `0x${chainId.toString(16)}`;

    eth.request({ method: "eth_chainId" }).then((current) => {
      if (current === chainIdHex) return;
      eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      }).catch((err: { code?: number }) => {
        if (err?.code === 4902) {
          eth.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: chainIdHex,
              chainName: "Kitpot Testnet",
              nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: null,
            }],
          });
        }
      });
    });
  }, [address]);
}

export function ConnectButton() {
  useAutoSwitchNetwork();
  const { username: kitUsername, isConnected, openConnect, openWallet } = useInterwovenKit();
  const { address: evmAddress } = useAccount();
  const { name: resolvedUsername } = useInitUsername(isConnected ? evmAddress : undefined);

  const displayName = kitUsername || resolvedUsername;

  if (isConnected && evmAddress) {
    return (
      <button
        onClick={openWallet}
        className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/80 transition-colors"
      >
        <div className="h-2 w-2 rounded-full bg-primary" />
        {displayName ? `${displayName}.init` : truncateAddress(evmAddress)}
      </button>
    );
  }

  return (
    <Button size="default" onClick={openConnect}>
      Connect Wallet
    </Button>
  );
}
