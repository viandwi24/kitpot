"use client";

import { useUsernameQuery } from "@initia/interwovenkit-react";
import { truncateAddress } from "@/lib/utils";

interface InitUsernameProps {
  address: string;
  fallback?: string;
  className?: string;
}

/** Displays .init username if available, otherwise truncated address.
 *  Uses native InterwovenKit useUsernameQuery hook. */
export function InitUsername({ address, fallback, className }: InitUsernameProps) {
  const { data: username, isLoading } = useUsernameQuery(address);

  if (isLoading) {
    return <span className={`animate-pulse text-muted-foreground ${className ?? ""}`}>...</span>;
  }

  if (username) {
    return <span className={className}>{username}</span>;
  }

  return <span className={className}>{fallback ?? truncateAddress(address)}</span>;
}
