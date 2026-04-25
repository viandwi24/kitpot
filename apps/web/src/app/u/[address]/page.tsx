"use client";

import { use } from "react";
import { useReputation } from "@/hooks/use-reputation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/reputation/tier-badge";
import { LevelBadge } from "@/components/gamification/level-badge";
import { XPBar } from "@/components/gamification/xp-bar";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { InitUsername } from "@/components/username/init-username";
import { AchievementGallery } from "@/components/achievements/achievement-gallery";
import { formatUSDC, truncateAddress } from "@/lib/utils";

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address: rawAddress } = use(params);
  const address = rawAddress as `0x${string}`;
  const { data: rep } = useReputation(address);

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
              <InitUsername address={address} noLink />
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
            <span>{formatUSDC(rep.totalContributed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Pot Received</span>
            <span>{formatUSDC(rep.totalPotReceived)}</span>
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
      <AchievementGallery address={address} />

      <p className="text-center text-xs text-muted-foreground font-mono break-all select-all">
        {address}
      </p>
    </div>
  );
}
