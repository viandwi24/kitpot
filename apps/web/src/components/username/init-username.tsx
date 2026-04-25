"use client";

import Link from "next/link";
import { useUsernameQuery } from "@initia/interwovenkit-react";
import { truncateAddress } from "@/lib/utils";

interface InitUsernameProps {
  address: string;
  fallback?: string;
  className?: string;
  /** When true, render as plain text without a link. Default: false. */
  noLink?: boolean;
}

/** Displays .init username if available, otherwise truncated address.
 *  Wraps in a link to /u/[address] by default.
 *  Uses native InterwovenKit useUsernameQuery hook. */
export function InitUsername({ address, fallback, className, noLink }: InitUsernameProps) {
  const { data: username, isLoading } = useUsernameQuery(address);

  if (isLoading) {
    return <span className={`animate-pulse text-muted-foreground ${className ?? ""}`}>...</span>;
  }

  const label = username ?? fallback ?? truncateAddress(address);

  if (noLink) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link
      href={`/u/${address}`}
      className={`hover:underline ${className ?? ""}`}
    >
      {label}
    </Link>
  );
}
