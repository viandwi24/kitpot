"use client";

import { useInitUsername } from "@/hooks/use-init-username";
import { truncateAddress } from "@/lib/utils";

interface InitUsernameProps {
  address: string;
  fallback?: string;
  className?: string;
}

/** Displays .init username if available, otherwise truncated address */
export function InitUsername({ address, fallback, className }: InitUsernameProps) {
  const { name, isLoading } = useInitUsername(address);

  if (isLoading) {
    return <span className={`animate-pulse text-muted-foreground ${className ?? ""}`}>...</span>;
  }

  if (name) {
    return <span className={className}>{name}.init</span>;
  }

  return <span className={className}>{fallback ?? truncateAddress(address)}</span>;
}
