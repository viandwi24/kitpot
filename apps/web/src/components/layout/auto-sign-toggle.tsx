"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { getNetworkConfig } from "@/lib/network";

const CHAIN_ID = getNetworkConfig().cosmosChainId;

// Permissions scope is declared at provider level via `enableAutoSign` prop
// (see providers.tsx). SDK @2.8.0 does NOT accept a second-arg options object
// on autoSign.enable — passing one is a TypeScript error. Plan 18 §2.2 flags
// this as a discrepancy vs BlockForge blueprint (different SDK version).

export function AutoSignToggle() {
  const { autoSign, isConnected } = useInterwovenKit();
  if (!isConnected || !autoSign) return null;

  const enabled = autoSign.isEnabledByChain[CHAIN_ID] ?? false;
  const expiresAt = autoSign.expiredAtByChain[CHAIN_ID];

  async function toggle() {
    if (!autoSign) return;
    if (enabled) {
      try {
        await autoSign.disable(CHAIN_ID);
      } catch (err) {
        // Recovery pattern from BlockForge blueprint: client cache may desync
        // with on-chain grants. Re-enable then clean disable resets state.
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("authorization not found")) {
          await autoSign.enable(CHAIN_ID);
          await autoSign.disable(CHAIN_ID);
          return;
        }
        throw err;
      }
    } else {
      await autoSign.enable(CHAIN_ID);
    }
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
