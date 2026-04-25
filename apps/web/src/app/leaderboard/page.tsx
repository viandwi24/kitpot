"use client";

import { useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/reputation/tier-badge";
import { REPUTATION_ABI } from "@/lib/abi/KitpotReputation";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { CONTRACTS } from "@/lib/contracts";
import { truncateAddress } from "@/lib/utils";
import { useUsernameQuery } from "@initia/interwovenkit-react";
import Link from "next/link";

/** Per-row component that resolves .init username and conditionally shows truncated address. */
function LeaderboardRow({
  entry,
  rank,
  tab,
}: {
  entry: { address: `0x${string}`; xp: number; circles: number; streak: number; tier: number };
  rank: number;
  tab: "xp" | "circles" | "streak";
}) {
  const { data: username } = useUsernameQuery(entry.address);

  return (
    <Link href={`/u/${entry.address}`}>
      <div className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-secondary ${
        rank === 0 ? "bg-primary/5 border border-primary/20" : "bg-card"
      }`}>
        <div className="flex items-center gap-3">
          <span className={`w-6 text-center text-sm font-bold ${
            rank === 0 ? "text-yellow-400" : rank === 1 ? "text-slate-400" : rank === 2 ? "text-amber-600" : "text-muted-foreground"
          }`}>
            {rank + 1}
          </span>
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{username ?? truncateAddress(entry.address)}</span>
              <TierBadge tier={entry.tier} size="sm" />
            </div>
            {username && (
              <span className="text-xs text-muted-foreground">
                {truncateAddress(entry.address)}
              </span>
            )}
          </div>
        </div>
        <span className="text-sm font-bold">
          {tab === "xp" && `${entry.xp} XP`}
          {tab === "circles" && `${entry.circles} circles`}
          {tab === "streak" && `${entry.streak} streak`}
        </span>
      </div>
    </Link>
  );
}

type Tab = "xp" | "circles" | "streak";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("xp");

  // Get total circles to find all unique members
  const { data: circleCount } = useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "getCircleCount",
  });

  // Read members from each circle to build address list
  const memberContracts = Array.from({ length: Number(circleCount ?? 0) }, (_, i) => ({
    address: CONTRACTS.kitpotCircle as `0x${string}`,
    abi: KITPOT_ABI,
    functionName: "getMembers" as const,
    args: [BigInt(i)] as const,
  }));

  const { data: allMembers } = useReadContracts({
    contracts: memberContracts,
    query: { enabled: Number(circleCount ?? 0) > 0 },
  });

  // Deduplicate addresses
  const uniqueAddresses = new Set<`0x${string}`>();
  allMembers?.forEach((r) => {
    if (r.status === "success" && r.result) {
      (r.result as unknown as Array<{ addr: `0x${string}` }>).forEach((m) => uniqueAddresses.add(m.addr));
    }
  });
  const addresses = Array.from(uniqueAddresses);

  // Read reputation for each address
  const repContracts = addresses.map((addr) => ({
    address: CONTRACTS.reputation as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: "getReputation" as const,
    args: [addr] as const,
  }));

  const { data: repData, isLoading: repLoading } = useReadContracts({
    contracts: repContracts,
    query: { enabled: addresses.length > 0 },
  });

  // Build sorted leaderboard
  const entries = addresses
    .map((addr, i) => {
      const rep = repData?.[i];
      if (rep?.status !== "success" || !rep.result) return null;
      const r = rep.result as any;
      return {
        address: addr,
        xp: Number(r.xp),
        circles: Number(r.totalCirclesCompleted),
        streak: Number(r.longestStreak),
        tier: Number(r.tier),
      };
    })
    .filter(Boolean) as { address: `0x${string}`; xp: number; circles: number; streak: number; tier: number }[];

  const sorted = [...entries].sort((a, b) => {
    if (tab === "xp") return b.xp - a.xp;
    if (tab === "circles") return b.circles - a.circles;
    return b.streak - a.streak;
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Leaderboard</h1>
      <p className="mb-6 text-muted-foreground">Top members by reputation</p>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {([
          { key: "xp", label: "Top XP" },
          { key: "circles", label: "Most Circles" },
          { key: "streak", label: "Longest Streak" },
        ] as const).map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      {repLoading && addresses.length > 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No members yet. Create a circle to get started!
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry, rank) => (
            <LeaderboardRow key={entry.address} entry={entry} rank={rank} tab={tab} />
          ))}
        </div>
      )}
    </div>
  );
}
