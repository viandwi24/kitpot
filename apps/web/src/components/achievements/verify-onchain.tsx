"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { CONTRACTS, CHAIN_CONFIG } from "@/lib/contracts";

interface VerifyOnChainProps {
  tokenId: bigint;
  earnedAt: number; // unix timestamp
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function VerifyOnChain({ tokenId, earnedAt }: VerifyOnChainProps) {
  const [open, setOpen] = useState(false);
  const contractAddr = CONTRACTS.achievements;
  const rpcUrl = CHAIN_CONFIG.jsonRpc;
  const chainId = CHAIN_CONFIG.evmChainId;
  const earnedDate = new Date(earnedAt * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const castCmd = `cast call ${contractAddr} "ownerOf(uint256)" ${tokenId.toString()} --rpc-url ${rpcUrl}`;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        Verify on-chain
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-border/50 bg-secondary/30 p-3 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Contract</span>
            <code className="truncate flex-1 font-mono">{contractAddr}</code>
            <CopyButton value={contractAddr} label="contract address" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Token ID</span>
            <code className="font-mono">{tokenId.toString()}</code>
            <CopyButton value={tokenId.toString()} label="token ID" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Earned</span>
            <span>{earnedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Chain</span>
            <span>kitpot-2 (EVM {chainId})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 shrink-0">RPC</span>
            <code className="truncate flex-1 font-mono">{rpcUrl}</code>
            <CopyButton value={rpcUrl} label="RPC URL" />
          </div>
          <div className="mt-2">
            <p className="text-muted-foreground mb-1">Verify yourself:</p>
            <div className="relative">
              <pre className="rounded bg-background/60 p-2 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all">{castCmd}</pre>
              <div className="absolute top-1 right-1">
                <CopyButton value={castCmd} label="cast command" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
