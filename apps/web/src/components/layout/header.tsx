"use client";

import Link from "next/link";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ConnectButton } from "./connect-button";
import { ThemeToggle } from "./theme-toggle";
import { LevelBadge } from "@/components/gamification/level-badge";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { useReputation } from "@/hooks/use-reputation";

function NavbarXP() {
  const { address } = useAccount();
  const { data: rep } = useReputation(address);

  if (!rep || !address) return null;

  const xp = rep.xp;
  const xpNum = Number(xp);
  const level = xpNum >= 10000 ? 5 : xpNum >= 4000 ? 4 : xpNum >= 1500 ? 3 : xpNum >= 500 ? 2 : xpNum >= 100 ? 1 : 0;
  const streak = Number(rep.questStreakDays);

  return (
    <Link href={`/u/${address}`} className="flex items-center gap-2">
      <LevelBadge level={level} xp={xp} size="sm" />
      {streak > 0 && <StreakFlame days={streak} />}
    </Link>
  );
}

export function Header() {
  const { address } = useAccount();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="mr-8 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
            <Image src="/kitpot_logo.svg" alt="Kitpot" width={22} height={22} />
          </span>
          <span className="text-xl font-bold text-primary">Kitpot</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/discover" className="text-muted-foreground transition-colors hover:text-foreground">
            Discover
          </Link>
          <Link href="/leaderboard" className="text-muted-foreground transition-colors hover:text-foreground">
            Leaderboard
          </Link>
          <Link href="/bridge" className="text-muted-foreground transition-colors hover:text-foreground">
            Bridge
          </Link>
          {address && (
            <>
              <span className="h-4 w-px bg-border" />
              <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
                My Dashboard
              </Link>
              <Link href="/circles" className="text-muted-foreground transition-colors hover:text-foreground">
                My Circles
              </Link>
              <Link href="/achievements" className="text-muted-foreground transition-colors hover:text-foreground">
                Badges
              </Link>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <NavbarXP />
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
