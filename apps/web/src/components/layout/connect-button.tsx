"use client";

import { useEffect, useState } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";

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

export function ConnectButton() {
  const { username, isConnected, openConnect, openWallet } = useInterwovenKit();
  const { address: evmAddress } = useAccount();

  if (isConnected && evmAddress) {
    return (
      <button
        onClick={openWallet}
        className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/80 transition-colors"
      >
        <div className="h-2 w-2 rounded-full bg-primary" />
        {username ? `${username}` : truncateAddress(evmAddress)}
      </button>
    );
  }

  return (
    <Button size="default" onClick={openConnect}>
      Connect Wallet
    </Button>
  );
}
