"use client";

import { useState, useEffect } from "react";
import { getUsername, resolveUsername } from "@/lib/initia/username";

export function useInitUsername(address: string | undefined) {
  const [name, setName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) { setName(null); return; }
    setIsLoading(true);
    getUsername(address)
      .then(setName)
      .finally(() => setIsLoading(false));
  }, [address]);

  return { name, isLoading };
}

export function useResolveUsername(username: string | undefined) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!username || username.length < 2) { setAddress(null); return; }
    setIsLoading(true);
    resolveUsername(username)
      .then(setAddress)
      .finally(() => setIsLoading(false));
  }, [username]);

  return { address, isLoading };
}
