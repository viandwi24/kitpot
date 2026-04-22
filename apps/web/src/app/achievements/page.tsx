"use client";

import { useAccount, useReadContracts } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACHIEVEMENTS_ABI } from "@/lib/abi/KitpotAchievements";
import { CONTRACTS } from "@/lib/contracts";
import { ACHIEVEMENT_NAMES, ACHIEVEMENT_ICONS, useAchievementTokenIds } from "@/hooks/use-achievements";

const ACHIEVEMENT_DESCRIPTIONS = [
  "Join your first savings circle",
  "Receive your first pot payout",
  "Complete a full savings circle",
  "Complete a circle with 100% on-time payments",
  "3 consecutive on-time payments",
  "10 consecutive on-time payments",
  "25 consecutive on-time payments",
  "Create a circle that completes successfully",
  "Join a circle with 500+ USDC contribution",
  "Complete 5+ circles",
  "Achieve Diamond trust tier",
  "Join during the launch period",
];

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

  const earnedTypes = new Set<number>();
  achData?.forEach((r) => {
    if (r.status === "success" && r.result) earnedTypes.add(Number(r.result[0]));
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Achievements</h1>
      <p className="mb-6 text-muted-foreground">
        Soulbound NFT badges earned through your savings circle activity.
        {address && ` ${earnedTypes.size}/${ACHIEVEMENT_NAMES.length} unlocked.`}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENT_NAMES.map((name, i) => {
          const unlocked = earnedTypes.has(i);
          return (
            <Card key={i} className={unlocked ? "" : "opacity-50"}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                  unlocked ? "border-primary/30 bg-primary/10" : "border-border bg-secondary"
                }`}>
                  <svg className={`h-6 w-6 ${unlocked ? "text-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={ACHIEVEMENT_ICONS[i]} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{ACHIEVEMENT_DESCRIPTIONS[i]}</p>
                  {unlocked && (
                    <p className="mt-1 text-xs text-primary">Earned (Soulbound NFT)</p>
                  )}
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
