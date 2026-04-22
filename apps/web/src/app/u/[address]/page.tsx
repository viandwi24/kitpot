"use client";

import { use } from "react";
import { useReputation, TIER_NAMES, LEVEL_NAMES } from "@/hooks/use-reputation";
import { useAchievementTokenIds, ACHIEVEMENT_NAMES, ACHIEVEMENT_ICONS } from "@/hooks/use-achievements";
import { useReadContracts } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/reputation/tier-badge";
import { LevelBadge } from "@/components/gamification/level-badge";
import { XPBar } from "@/components/gamification/xp-bar";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { InitUsername } from "@/components/username/init-username";
import { formatUSDC, truncateAddress } from "@/lib/utils";
import { ACHIEVEMENTS_ABI } from "@/lib/abi/KitpotAchievements";
import { CONTRACTS } from "@/lib/contracts";

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address: rawAddress } = use(params);
  const address = rawAddress as `0x${string}`;
  const { data: rep } = useReputation(address);
  const { data: tokenIds } = useAchievementTokenIds(address);

  // Read achievement types for each token
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

  if (!rep) {
    return <p className="py-12 text-center text-muted-foreground">Loading profile...</p>;
  }

  const tier = Number(rep.tier);
  const level = Number(rep.tier); // tier maps to level display for now
  const xp = rep.xp;
  const streak = Number(rep.consecutiveOnTime);
  const questStreak = Number(rep.questStreakDays);
  const onTimeRate =
    rep.totalCyclesOnTime + rep.totalCyclesMissed > 0n
      ? Number((rep.totalCyclesOnTime * 100n) / (rep.totalCyclesOnTime + rep.totalCyclesMissed))
      : 100;

  // Determine actual level from XP thresholds
  const xpNum = Number(xp);
  const actualLevel = xpNum >= 10000 ? 5 : xpNum >= 4000 ? 4 : xpNum >= 1500 ? 3 : xpNum >= 500 ? 2 : xpNum >= 100 ? 1 : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {truncateAddress(address, 2).slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">
              <InitUsername address={address} />
            </h1>
            <TierBadge tier={tier} size="md" />
          </div>
          <LevelBadge level={actualLevel} xp={xp} size="sm" />
          <XPBar level={actualLevel} currentXP={xp} className="mt-2" />
        </div>
        {(streak > 0 || questStreak > 0) && (
          <StreakFlame days={Math.max(streak, questStreak)} />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Circles", value: rep.totalCirclesCompleted.toString() },
          { label: "On-time", value: `${onTimeRate}%` },
          { label: "Streak", value: rep.consecutiveOnTime.toString() },
          { label: "XP", value: xp.toString() },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Contributed</span>
            <span>{formatUSDC(rep.totalContributed)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Pot Received</span>
            <span>{formatUSDC(rep.totalPotReceived)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Circles Joined</span>
            <span>{rep.totalCirclesJoined.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payments Made</span>
            <span>{rep.totalCyclesPaid.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payments Missed</span>
            <span>{rep.totalCyclesMissed.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Longest Streak</span>
            <span>{rep.longestStreak.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quest Streak</span>
            <span>{rep.questStreakDays.toString()} days</span>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Achievements ({earnedTypes.size}/{ACHIEVEMENT_NAMES.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {ACHIEVEMENT_NAMES.map((name, i) => {
              const unlocked = earnedTypes.has(i);
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                    unlocked ? "border-primary/30 bg-primary/10" : "border-border bg-secondary opacity-40"
                  }`}>
                    <svg className={`h-5 w-5 ${unlocked ? "text-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={ACHIEVEMENT_ICONS[i]} />
                    </svg>
                  </div>
                  <span className={`text-[10px] text-center leading-tight ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        {truncateAddress(address)}
      </p>
    </div>
  );
}
