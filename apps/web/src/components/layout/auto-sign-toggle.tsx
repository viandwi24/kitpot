"use client";

import { useState, useEffect, useRef } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { getNetworkConfig } from "@/lib/network";

const CHAIN_ID = getNetworkConfig().cosmosChainId;
const PENDING_TIMEOUT_MS = 90_000;

// Permissions scope is declared at provider level via `enableAutoSign` prop
// (see providers.tsx). SDK @2.8.0 does NOT accept a second-arg options object
// on autoSign.enable — passing one is a TypeScript error. Plan 18 §2.2 flags
// this as a discrepancy vs BlockForge blueprint (different SDK version).

export function AutoSignToggle() {
  const { autoSign, isConnected } = useInterwovenKit();
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabled = autoSign?.isEnabledByChain[CHAIN_ID] ?? false;
  const expiresAt = autoSign?.expiredAtByChain[CHAIN_ID];

  // When enabled flips true, clear pending state + timeout
  useEffect(() => {
    if (enabled && pending) {
      setPending(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [enabled, pending]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isConnected || !autoSign) return null;

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
      setPending(true);
      // Safety fallback: clear pending after 90s even if SDK never confirms
      timeoutRef.current = setTimeout(() => {
        setPending(false);
        timeoutRef.current = null;
      }, PENDING_TIMEOUT_MS);
      try {
        await autoSign.enable(CHAIN_ID);
        // Do NOT setPending(false) here — leave pending until useEffect sees enabled flip
      } catch {
        setPending(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }
  }

  const isPending = pending && !enabled;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending || autoSign.isLoading}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        enabled
          ? "border-emerald-500 text-emerald-400"
          : isPending
            ? "border-yellow-500/50 text-yellow-400 cursor-wait"
            : "border-border text-muted-foreground hover:text-foreground"
      }`}
      title={
        isPending
          ? "Waiting for grant tx to land on-chain (up to ~1 minute on testnet)"
          : expiresAt
            ? `Expires ${expiresAt.toLocaleString()}`
            : undefined
      }
    >
      <span className={`size-2 rounded-full ${
        enabled
          ? "bg-emerald-500"
          : isPending
            ? "bg-yellow-400 animate-pulse"
            : "bg-muted"
      }`} />
      {enabled ? "Auto-sign ON" : isPending ? "Granting\u2026" : "Enable auto-sign"}
    </button>
  );
}
