"use client";

import Link from "next/link";
import { Wallet, Star, CheckCircle, Trophy, Search, User, ArrowLeftRight, Plus, Activity, Zap, Shield, Flame, Gift } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { useReputation, TIER_NAMES, TIER_COLORS, LEVEL_NAMES, LEVEL_XP_THRESHOLDS } from "@/hooks/use-reputation";
import { useCircleCount, useMyCircles } from "@/hooks/use-circles";
import { useAchievementTokenIds, ACHIEVEMENT_NAMES, ACHIEVEMENT_ICONS } from "@/hooks/use-achievements";
import { LevelBadge } from "@/components/gamification/level-badge";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { DailyQuestPanel } from "@/components/gamification/daily-quest-panel";
import { Button } from "@/components/ui/button";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { CONTRACTS } from "@/lib/contracts";
import { truncateAddress, formatUSDC } from "@/lib/utils";

const TIER_GLOWS: Record<number, string> = {
  0: "shadow-none",
  1: "shadow-amber-600/20",
  2: "shadow-slate-400/20",
  3: "shadow-yellow-400/20",
  4: "shadow-cyan-300/30",
};

const TIER_RING: Record<number, string> = {
  0: "ring-border",
  1: "ring-amber-600/50",
  2: "ring-slate-400/50",
  3: "ring-yellow-400/50",
  4: "ring-cyan-300/60",
};

const STATUS_LABEL: Record<number, string> = { 0: "Pending", 1: "Active", 2: "Done", 3: "Cancelled" };
const STATUS_DOT: Record<number, string> = {
  0: "bg-yellow-400",
  1: "bg-primary animate-pulse",
  2: "bg-muted-foreground",
  3: "bg-destructive",
};

function XPBarAnimated({ level, currentXP }: { level: number; currentXP: bigint }) {
  const currentThreshold = BigInt(LEVEL_XP_THRESHOLDS[level] ?? 0);
  const nextThreshold = BigInt(LEVEL_XP_THRESHOLDS[level + 1] ?? LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1]);
  const xpInLevel = currentXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const pct = xpNeeded > 0n ? Math.min(Number((xpInLevel * 100n) / xpNeeded), 100) : 100;
  const nextName = LEVEL_NAMES[level + 1] ?? "MAX";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{currentXP.toString()} XP</span>
        <span className="text-primary font-medium">{pct}% → {nextName}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-secondary/80 overflow-hidden ring-1 ring-border/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}

function ActiveCircleCard({ circleId }: { circleId: bigint }) {
  const { data: circle } = useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "getCircle",
    args: [circleId],
  }) as { data: any };

  if (!circle) return null;
  const status = Number(circle.status);
  const contribution = formatUnits(circle.contributionAmount, 6);
  const progress = `${circle.currentCycle}/${circle.maxMembers}`;

  return (
    <Link href={`/circles/${circleId}`}>
      <div className="group flex items-center justify-between rounded-xl border border-border/50 bg-card/50 px-4 py-3 transition-all hover:border-primary/30 hover:bg-card hover:shadow-sm">
        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status] ?? "bg-muted-foreground"}`} />
          <div>
            <p className="font-medium text-sm">{circle.name}</p>
            <p className="text-xs text-muted-foreground">{contribution} USDC · Cycle {progress}</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">View →</span>
      </div>
    </Link>
  );
}

function AchievementGrid({ address }: { address: `0x${string}` }) {
  const { data: tokenIds } = useAchievementTokenIds(address);
  const { data: achData } = useReadContract({
    address: CONTRACTS.kitpotCircle,
    abi: KITPOT_ABI,
    functionName: "getCircleCount",
  });

  // Build earned set from token IDs (simplified: use count)
  const earned = tokenIds?.length ?? 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ACHIEVEMENT_NAMES.map((name, i) => {
        const unlocked = i < earned;
        return (
          <div key={i} title={name} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
            unlocked
              ? "border-primary/30 bg-primary/10 shadow-sm shadow-primary/10"
              : "border-border/40 bg-secondary/30 opacity-40"
          }`}>
            <svg className={`h-4 w-4 ${unlocked ? "text-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={ACHIEVEMENT_ICONS[i]} />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: rep } = useReputation(address);
  const { data: circleCount } = useCircleCount();
  const { myCircleIds } = useMyCircles(address, Number(circleCount ?? 0));
  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as { data: bigint | undefined };

  if (!isConnected || !address) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <div className="text-4xl">🎮</div>
        <h2 className="text-2xl font-bold">Connect to enter your dashboard</h2>
        <p className="text-muted-foreground max-w-sm">
          Connect your wallet to see your balance, progress, circles, and achievements.
        </p>
      </div>
    );
  }

  if (!rep) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your stats...</p>
        </div>
      </div>
    );
  }

  const tier = Number(rep.tier);
  const xp = rep.xp;
  const xpNum = Number(xp);
  const level = xpNum >= 10000 ? 5 : xpNum >= 4000 ? 4 : xpNum >= 1500 ? 3 : xpNum >= 500 ? 2 : xpNum >= 100 ? 1 : 0;
  const streak = Math.max(Number(rep.consecutiveOnTime), Number(rep.questStreakDays));
  const onTimeRate =
    rep.totalCyclesOnTime + rep.totalCyclesMissed > 0n
      ? Math.round(Number((rep.totalCyclesOnTime * 100n) / (rep.totalCyclesOnTime + rep.totalCyclesMissed)))
      : 100;

  const activeCircles = myCircleIds.slice(0, 5);
  const usdcFormatted = usdcBalance !== undefined ? parseFloat(formatUnits(usdcBalance, 6)).toFixed(2) : "—";

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[700px] rounded-full bg-primary/5 blur-[100px]" />

      {/* ── HERO: Welcome ── */}
      <div className={`relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xl ${TIER_GLOWS[tier]} ring-1 ${TIER_RING[tier]}`}>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent" />
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary ring-2 ${TIER_RING[tier]}`}>
            {address.slice(2, 4).toUpperCase()}
            {tier >= 1 && (
              <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background ${tier >= 4 ? "bg-cyan-400" : tier >= 3 ? "bg-yellow-400" : tier >= 2 ? "bg-slate-300" : "bg-amber-600"}`}>
                <Shield className="h-2.5 w-2.5 text-background" />
              </span>
            )}
          </div>

          {/* Name + level */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-muted-foreground">{truncateAddress(address)}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary ${TIER_COLORS[tier]}`}>
                {TIER_NAMES[tier]}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <LevelBadge level={level} xp={xp} size="sm" />
              <span className="text-sm font-semibold">{LEVEL_NAMES[level]}</span>
            </div>
            <div className="mt-3 max-w-xs">
              <XPBarAnimated level={level} currentXP={xp} />
            </div>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex flex-col items-center gap-1">
              <StreakFlame days={streak} />
              <span className="text-[10px] text-muted-foreground">streak</span>
            </div>
          )}
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          { Icon: Wallet, label: "USDC Balance", value: usdcFormatted, color: "text-emerald-400", iconColor: "text-emerald-400" },
          { Icon: Zap, label: "Total XP", value: xpNum.toLocaleString(), color: "text-primary", iconColor: "text-primary" },
          { Icon: CheckCircle, label: "On-time Rate", value: `${onTimeRate}%`, color: onTimeRate >= 90 ? "text-emerald-400" : "text-yellow-400", iconColor: "text-emerald-400" },
          { Icon: Trophy, label: "Circles Done", value: rep.totalCirclesCompleted.toString(), color: "text-amber-400", iconColor: "text-amber-400" },
        ] as const).map((s) => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card p-4 space-y-1 hover:border-primary/20 transition-colors">
            <s.Icon className={`h-4 w-4 ${s.iconColor}`} />
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: Active Circles */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">My Circles</h2>
            <Link href="/circles/new" className="text-xs text-primary hover:underline">+ New Circle</Link>
          </div>

          {activeCircles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 p-8 text-center space-y-3">
              <div className="flex justify-center"><Activity className="h-8 w-8 text-muted-foreground/40" /></div>
              <p className="text-sm text-muted-foreground">No circles yet</p>
              <Button asChild size="sm">
                <Link href="/circles/new">Create your first circle</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeCircles.map((id) => (
                <ActiveCircleCard key={id.toString()} circleId={id} />
              ))}
              {myCircleIds.length > 5 && (
                <Link href="/circles" className="block text-center text-xs text-muted-foreground hover:text-primary py-2">
                  View all {myCircleIds.length} circles →
                </Link>
              )}
            </div>
          )}

          {/* Activity stats row */}
          <div className="rounded-xl border border-border/40 bg-card/40 p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activity</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[
                { label: "Payments", value: rep.totalCyclesPaid.toString() },
                { label: "Missed", value: rep.totalCyclesMissed.toString() },
                { label: "Pot Received", value: `${formatUSDC(rep.totalPotReceived)} USDC` },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Quest + Quick Actions */}
        <div className="space-y-4">
          {/* Daily Quest */}
          <div>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Daily Quest</h2>
            <DailyQuestPanel />
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
            {([
              { href: "/discover", label: "Discover Circles", Icon: Search },
              { href: "/leaderboard", label: "Leaderboard", Icon: Trophy },
              { href: `/u/${address}`, label: "My Profile", Icon: User },
              { href: "/bridge", label: "Bridge / Faucet", Icon: ArrowLeftRight },
            ] as const).map((a) => (
              <Link key={a.href} href={a.href}>
                <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/40 px-4 py-2.5 text-sm hover:border-primary/30 hover:bg-card transition-all group">
                  <div className="flex items-center gap-2.5">
                    <a.Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span>{a.label}</span>
                  </div>
                  <span className="text-muted-foreground text-xs group-hover:text-primary transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── ACHIEVEMENTS ── */}
      <div className="rounded-xl border border-border/40 bg-card/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Achievements
          </h2>
          <Link href="/achievements" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        <AchievementGrid address={address} />
      </div>
    </div>
  );
}
