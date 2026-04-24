"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useInterwovenKit } from "@initia/interwovenkit-react";

/**
 * Automatically triggers the server-side gas faucet on first connect.
 * Silent failure on purpose — if the faucet is down, the user will simply
 * see their first transaction fail with an obvious "insufficient funds"
 * message from InterwovenKit. That's better than blocking connection.
 *
 * SessionStorage guard prevents duplicate calls within the same tab session.
 * Server-side rate limit (1h per address) handles cross-session abuse.
 */

const SESSION_KEY_PREFIX = "kitpot:gas-faucet-claimed:";

export function useGasFaucet() {
  const { isConnected } = useInterwovenKit();
  const { address } = useAccount();

  useEffect(() => {
    if (!isConnected || !address) return;
    if (typeof window === "undefined") return;

    const key = `${SESSION_KEY_PREFIX}${address.toLowerCase()}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
    } catch {
      // sessionStorage may throw in private mode — proceed without guard
    }

    const controller = new AbortController();

    fetch("/api/gas-faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return;
        try {
          window.sessionStorage.setItem(key, "1");
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* silent — see docstring */
      });

    return () => controller.abort();
  }, [isConnected, address]);
}
