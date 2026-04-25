"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTRACTS } from "@/lib/contracts";
import { getNetworkConfig } from "@/lib/network";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";

const net = getNetworkConfig();

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function StatusDot({ status }: { status: "live" | "down" | "checking" }) {
  const color =
    status === "live" ? "bg-emerald-500" : status === "down" ? "bg-red-500" : "bg-yellow-500 animate-pulse";
  const label = status === "live" ? "Live" : status === "down" ? "Down" : "Checking…";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`size-2 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

interface AddressRowProps {
  label: string;
  address: string;
  extra?: React.ReactNode;
}
function AddressRow({ label, address, extra }: AddressRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/20 px-3 py-2">
      <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <code className="flex-1 truncate font-mono text-xs">{address}</code>
      {extra && <span className="text-xs text-muted-foreground">{extra}</span>}
      <CopyButton value={address} label={label} />
    </div>
  );
}

interface RpcRowProps {
  label: string;
  url: string;
  pingFn: (url: string) => Promise<boolean>;
}
function RpcRow({ label, url, pingFn }: RpcRowProps) {
  const [status, setStatus] = useState<"checking" | "live" | "down">("checking");

  useEffect(() => {
    let cancelled = false;
    pingFn(url)
      .then((ok) => !cancelled && setStatus(ok ? "live" : "down"))
      .catch(() => !cancelled && setStatus("down"));
    return () => {
      cancelled = true;
    };
  }, [url, pingFn]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/20 px-3 py-2">
      <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <code className="flex-1 truncate font-mono text-xs">{url}</code>
      <StatusDot status={status} />
      <CopyButton value={url} label={label} />
    </div>
  );
}

async function pingEvmRpc(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
    });
    const j = await r.json();
    return typeof j?.result === "string" && j.result.startsWith("0x");
  } catch {
    return false;
  }
}

async function pingCosmosRpc(url: string): Promise<boolean> {
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/status`);
    const j = await r.json();
    return typeof j?.result?.node_info?.network === "string";
  } catch {
    return false;
  }
}

async function pingCosmosRest(url: string): Promise<boolean> {
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/cosmos/base/tendermint/v1beta1/node_info`);
    return r.ok;
  } catch {
    return false;
  }
}

export default function AboutPage() {
  // Live data from contracts
  const { data: nextCircleId } = useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "nextCircleId",
  });

  // Latest block + nextTokenId (raw eth_call since ABI is missing the getter)
  const [latestBlock, setLatestBlock] = useState<string>("…");
  const [nftCount, setNftCount] = useState<string>("…");

  useEffect(() => {
    let cancelled = false;

    async function ethCall<T>(method: string, params: unknown[]): Promise<T | null> {
      try {
        const r = await fetch(net.jsonRpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
        });
        const j = await r.json();
        return typeof j?.result === "string" ? (j.result as T) : null;
      } catch {
        return null;
      }
    }

    (async () => {
      const blockHex = await ethCall<string>("eth_blockNumber", []);
      if (!cancelled && blockHex) setLatestBlock(parseInt(blockHex, 16).toLocaleString());

      // nextTokenId() selector = first 4 bytes of keccak256("nextTokenId()") = 0x75794a3c
      const nftHex = await ethCall<string>("eth_call", [
        { to: CONTRACTS.achievements, data: "0x75794a3c" },
        "latest",
      ]);
      if (!cancelled && nftHex && nftHex !== "0x") {
        try {
          setNftCount(BigInt(nftHex).toString());
        } catch {
          /* ignore */
        }
      } else if (!cancelled) {
        setNftCount("?");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Program Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything Kitpot runs on — chain config, RPC endpoints, contract addresses, and live state.
          Bookmark this page for debugging or for verifying on-chain state without trusting our UI.
        </p>
      </div>

      {/* ── Network ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Network</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Chain ID (Cosmos)</p>
              <p className="font-mono">{net.cosmosChainId}</p>
            </div>
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Chain ID (EVM)</p>
              <p className="font-mono">
                {net.evmChainId} <span className="text-xs text-muted-foreground">(0x{net.evmChainId.toString(16)})</span>
              </p>
            </div>
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Native Token</p>
              <p className="font-mono">
                {net.nativeSymbol} <span className="text-xs text-muted-foreground">({net.nativeDecimals} decimals)</span>
              </p>
            </div>
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Latest Block</p>
              <p className="font-mono">{latestBlock}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── RPC Endpoints ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">RPC Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <RpcRow label="EVM JSON-RPC" url={net.jsonRpc} pingFn={pingEvmRpc} />
          <RpcRow label="Cosmos RPC" url={net.cosmosRpc} pingFn={pingCosmosRpc} />
          <RpcRow label="Cosmos REST" url={net.cosmosRest} pingFn={pingCosmosRest} />
        </CardContent>
      </Card>

      {/* ── Contracts ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Smart Contracts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <AddressRow
            label="KitpotCircle"
            address={CONTRACTS.kitpotCircle}
            extra={
              nextCircleId !== undefined
                ? `${(nextCircleId as bigint).toString()} circle${(nextCircleId as bigint) === 1n ? "" : "s"}`
                : undefined
            }
          />
          <AddressRow label="MockUSDC" address={CONTRACTS.mockUSDC} extra="6 decimals" />
          <AddressRow label="MockUSDe" address={CONTRACTS.mockUSDe} extra="6 decimals" />
          <AddressRow label="KitpotReputation" address={CONTRACTS.reputation} />
          <AddressRow
            label="KitpotAchievements"
            address={CONTRACTS.achievements}
            extra={
              nftCount !== "…" && nftCount !== "?"
                ? `${nftCount} NFT${nftCount === "1" ? "" : "s"} minted`
                : undefined
            }
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Verify any contract has live code:{" "}
            <code className="rounded bg-secondary/40 px-1.5 py-0.5 font-mono text-[11px]">
              cast code &lt;address&gt; --rpc-url {net.jsonRpc}
            </code>
          </p>
        </CardContent>
      </Card>

      {/* ── L1 / Bridge source ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Initia L1 (Bridge Source)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/20 px-3 py-2">
            <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">Source Chain</span>
            <code className="flex-1 font-mono text-xs">initiation-2</code>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/20 px-3 py-2">
            <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">L1 RPC</span>
            <code className="flex-1 truncate font-mono text-xs">https://rpc.testnet.initia.xyz</code>
            <CopyButton value="https://rpc.testnet.initia.xyz" label="L1 RPC" />
          </div>
          <a
            href="https://faucet.testnet.initia.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-secondary/20 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            Get testnet INIT (L1 faucet)
          </a>
        </CardContent>
      </Card>

      {/* ── Resources ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="https://docs.initia.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/20 px-3 py-2 text-sm transition-colors hover:bg-secondary/40"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            Initia Docs
            <span className="ml-auto text-xs text-muted-foreground">docs.initia.xyz</span>
          </a>
          <a
            href="https://docs.initia.xyz/hackathon"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/20 px-3 py-2 text-sm transition-colors hover:bg-secondary/40"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            INITIATE Hackathon
            <span className="ml-auto text-xs text-muted-foreground">docs.initia.xyz/hackathon</span>
          </a>
          <a
            href="https://docs.initia.xyz/interwovenkit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/20 px-3 py-2 text-sm transition-colors hover:bg-secondary/40"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            InterwovenKit Docs
            <span className="ml-auto text-xs text-muted-foreground">docs.initia.xyz/interwovenkit</span>
          </a>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Kitpot-2 is a custom Initia rollup not yet listed in the public registry. Use the JSON-RPC endpoint above
        or the snippets in each address row to verify on-chain state independently.
      </p>
    </div>
  );
}
