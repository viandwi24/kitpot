"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { getNetworkConfig } from "@/lib/network";

const CHAIN_ID = getNetworkConfig().cosmosChainId;

export function AutoSignToggle() {
  const { autoSign, isConnected } = useInterwovenKit();
  if (!isConnected || !autoSign) return null;

  const enabled = autoSign.isEnabledByChain[CHAIN_ID] ?? false;
  const expiresAt = autoSign.expiredAtByChain[CHAIN_ID];

  async function toggle() {
    if (enabled) await autoSign.disable(CHAIN_ID);
    else await autoSign.enable(CHAIN_ID);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={autoSign.isLoading}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        enabled
          ? "border-emerald-500 text-emerald-400"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
      title={expiresAt ? `Expires ${expiresAt.toLocaleString()}` : undefined}
    >
      <span className={`size-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-muted"}`} />
      {enabled ? "Auto-sign ON" : "Enable auto-sign"}
    </button>
  );
}
