"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { X } from "lucide-react";
import { KITPOT_EVM_CHAIN_PARAMS } from "@/lib/network";

const KITPOT_EVM_CHAIN_ID = 64146729809684;
const DISMISS_KEY = "kitpot:network-warning-dismissed";

export function NetworkWarning() {
  const { chainId, isConnected } = useAccount();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  });

  if (!isConnected || chainId === KITPOT_EVM_CHAIN_ID || dismissed) {
    return null;
  }

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function handleAddNetwork() {
    try {
      await (window as unknown as { ethereum?: { request: (args: { method: string; params: unknown[] }) => Promise<unknown> } }).ethereum?.request({
        method: "wallet_addEthereumChain",
        params: [KITPOT_EVM_CHAIN_PARAMS],
      });
    } catch {
      // User rejected or wallet doesn't support it — silently ignore
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-sm">
      <p className="text-yellow-200 flex-1">
        Your wallet is on a different chain. Kitpot uses Cosmos signing so you can still transact, but for the smoothest experience:
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleAddNetwork}
          className="rounded-md bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-200 hover:bg-yellow-500/30 transition-colors"
        >
          Add Kitpot to Wallet
        </button>
        <a
          href="/"
          className="rounded-md bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-200 hover:bg-yellow-500/30 transition-colors"
        >
          Use Google login
        </a>
        <button
          onClick={handleDismiss}
          className="p-1 text-yellow-200/60 hover:text-yellow-200 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
