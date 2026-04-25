export interface ParsedError {
  title: string;
  hint: string;
  action?: { label: string; href: string };
}

const KNOWN_REVERTS: Array<{ pattern: string; title: string; hint: string; action?: { label: string; href: string } }> = [
  { pattern: "Members 3-20", title: "Invalid member count", hint: "Circles must have between 3 and 20 members." },
  { pattern: "Grace > cycle", title: "Invalid grace period", hint: "Grace period cannot be longer than the cycle duration." },
  { pattern: "Not a member", title: "Not a member", hint: "You are not a member of this circle." },
  { pattern: "Cycle not elapsed", title: "Too early", hint: "The current cycle has not ended yet. Wait for the cycle timer to finish." },
  { pattern: "Already paid this cycle", title: "Already paid", hint: "You already made your payment for this cycle." },
  { pattern: "Penalty too high", title: "Invalid penalty", hint: "The late penalty percentage is too high." },
  { pattern: "Circle full", title: "Circle full", hint: "This circle has reached its maximum number of members." },
];

export function parseTxError(err: unknown): ParsedError {
  const raw = err instanceof Error ? err.message : String(err);

  // Check known revert strings
  for (const r of KNOWN_REVERTS) {
    if (raw.includes(r.pattern)) {
      return { title: r.title, hint: r.hint, action: r.action };
    }
  }

  // ERC20 balance issue
  if (raw.includes("ERC20InsufficientBalance") || (raw.includes("Reverted") && !raw.includes("user rejected"))) {
    return {
      title: "Insufficient balance",
      hint: "You don't have enough tokens for this transaction. Mint more at the Faucet.",
      action: { label: "Go to Faucet", href: "/bridge" },
    };
  }

  // User cancelled
  if (raw.includes("user rejected") || raw.includes("User denied") || raw.includes("request rejected")) {
    return { title: "Cancelled", hint: "You cancelled the signature." };
  }

  // Fee-grant not found (auto-sign indexing lag)
  if (raw.includes("fee-grant not found")) {
    return {
      title: "Auto-sign indexing",
      hint: "Auto-sign grants are still indexing on-chain. Try again in 30 seconds.",
    };
  }

  // Insufficient gas
  if (raw.includes("insufficient funds")) {
    return {
      title: "No GAS",
      hint: "Wallet has no GAS for transaction fees. Visit the Faucet or wait for auto-funding.",
      action: { label: "Go to Faucet", href: "/bridge" },
    };
  }

  // Fallback
  return {
    title: "Transaction failed",
    hint: raw.length > 300 ? `${raw.slice(0, 300)}...` : raw,
  };
}
