"use client";

import { useAccount, useReadContracts } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { ACHIEVEMENTS_ABI } from "@/lib/abi/KitpotAchievements";
import { CONTRACTS } from "@/lib/contracts";
import { ACHIEVEMENT_NAMES, ACHIEVEMENT_ICONS, useAchievementTokenIds, useTokenSvg } from "@/hooks/use-achievements";
import { VerifyOnChain } from "@/components/achievements/verify-onchain";

const ACHIEVEMENT_DESCRIPTIONS = [
  "Join your first savings circle",
  "Receive your first pot payout",
  "Complete a full savings circle",
  "Complete a circle with 100% on-time payments",
  "3 consecutive on-time payments",
  "10 consecutive on-time payments",
  "25 consecutive on-time payments",
  "Create a circle that completes successfully",
  "Join a circle with 500+ stablecoin contribution",
  "Complete 5+ circles",
  "Achieve Diamond trust tier",
  "Join during the launch period",
];

/** Card for an unlocked achievement — fetches real on-chain SVG. */
function UnlockedCard({
  name,
  description,
  tokenId,
  earnedAt,
  typeIndex,
}: {
  name: string;
  description: string;
  tokenId: bigint;
  earnedAt: number;
  typeIndex: number;
}) {
  const metadata = useTokenSvg(tokenId);
  const earnedDate = new Date(earnedAt * 1000).toLocaleDateString();

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-4">
          {metadata?.image ? (
            <img
              src={metadata.image}
              alt={metadata.name ?? name}
              className="h-14 w-14 shrink-0 rounded-2xl border border-primary/30 bg-primary/10"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={ACHIEVEMENT_ICONS[typeIndex]} />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{metadata?.name ?? name}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Lock className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary font-medium">Soulbound NFT</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Earned {earnedDate}</p>
          </div>
        </div>
        <VerifyOnChain tokenId={tokenId} earnedAt={earnedAt} />
      </CardContent>
    </Card>
  );
}

export default function AchievementsPage() {
  const { address } = useAccount();
  const { data: tokenIds } = useAchievementTokenIds(address);

  const achContracts = (tokenIds ?? []).map((id) => ({
    address: CONTRACTS.achievements as `0x${string}`,
    abi: ACHIEVEMENTS_ABI,
    functionName: "achievements" as const,
    args: [id] as const,
  }));
  const { data: achData } = useReadContracts({
    contracts: achContracts,
    query: { enabled: (tokenIds ?? []).length > 0 },
  });

  // Map achievement type → { tokenId, earnedAt }
  const earnedMap = new Map<number, { tokenId: bigint; earnedAt: number }>();
  achData?.forEach((r, i) => {
    if (r.status === "success" && r.result) {
      const result = r.result as readonly [number, string, bigint, bigint];
      earnedMap.set(Number(result[0]), {
        tokenId: tokenIds![i],
        earnedAt: Number(result[2]),
      });
    }
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Achievements</h1>
      <p className="mb-2 text-muted-foreground">
        Soulbound NFT badges earned through your savings circle activity.
        {address && ` ${earnedMap.size}/${ACHIEVEMENT_NAMES.length} unlocked.`}
      </p>
      <p className="mb-6 text-xs text-muted-foreground/70 border border-border/30 rounded-lg px-3 py-2 bg-secondary/20">
        Kitpot-2 is a custom Initia rollup not yet listed in the public registry.
        Each soulbound NFT here is real on-chain — verify any badge via the JSON-RPC
        contract call snippet under each card, or query directly via the RPC endpoint.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENT_NAMES.map((name, i) => {
          const earned = earnedMap.get(i);
          if (earned) {
            return (
              <UnlockedCard
                key={i}
                name={name}
                description={ACHIEVEMENT_DESCRIPTIONS[i]}
                tokenId={earned.tokenId}
                earnedAt={earned.earnedAt}
                typeIndex={i}
              />
            );
          }
          return (
            <Card key={i} className="opacity-50">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={ACHIEVEMENT_ICONS[i]} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{ACHIEVEMENT_DESCRIPTIONS[i]}</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Locked</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!address && (
        <p className="mt-8 text-center text-muted-foreground">Connect wallet to see your achievements.</p>
      )}
    </div>
  );
}
