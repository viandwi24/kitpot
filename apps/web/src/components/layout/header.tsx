"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton, useWelcomeModal } from "./connect-button";
import { WelcomeModal } from "./welcome-modal";
import { AutoSignToggle } from "./auto-sign-toggle";
import { ThemeToggle } from "./theme-toggle";
import { LevelBadge } from "@/components/gamification/level-badge";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { useReputation } from "@/hooks/use-reputation";

// ── Nav links ──

interface NavLink {
  href: string;
  label: string;
  authOnly?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: "/discover", label: "Discover" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/bridge", label: "Faucet" },
  { href: "/dashboard", label: "My Dashboard", authOnly: true },
  { href: "/circles", label: "My Circles", authOnly: true },
  { href: "/achievements", label: "Badges", authOnly: true },
  { href: "/about", label: "Program" },
];

// ── XP badge for navbar ──

function NavbarXP() {
  const { address } = useAccount();
  const { data: rep } = useReputation(address);

  if (!rep || !address) return null;

  const xpNum = Number(rep.xp);
  const level = xpNum >= 10000 ? 5 : xpNum >= 4000 ? 4 : xpNum >= 1500 ? 3 : xpNum >= 500 ? 2 : xpNum >= 100 ? 1 : 0;
  const streak = Number(rep.questStreakDays);

  return (
    <Link href={`/u/${address}`} className="flex items-center gap-2">
      <LevelBadge level={level} xp={rep.xp} size="sm" />
      {streak > 0 && <StreakFlame days={streak} />}
    </Link>
  );
}

// ── Mobile drawer ──

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { address } = useAccount();
  const pathname = usePathname();

  const visibleLinks = NAV_LINKS.filter((link) => !link.authOnly || address);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-72 bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-medium text-muted-foreground">Menu</span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <nav className="flex flex-col p-4 gap-1">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* XP + Actions */}
        <div className="border-t border-border p-4 space-y-4">
          <NavbarXP />
          <div className="flex items-center gap-2">
            <AutoSignToggle />
          </div>
          <ConnectButton />
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

// ── Header ──

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { address } = useAccount();
  const pathname = usePathname();
  const { showWelcome, handleClose } = useWelcomeModal();

  const visibleLinks = NAV_LINKS.filter((link) => !link.authOnly || address);

  return (
    <>
      <WelcomeModal open={showWelcome} onClose={handleClose} />
      <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center px-4">
          {/* Logo */}
          <Link href="/" className="mr-6 flex items-center gap-2.5 lg:mr-8">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
              <Image src="/kitpot_logo.svg" alt="Kitpot" width={22} height={22} />
            </span>
            <span className="text-xl font-bold text-primary">Kitpot</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {visibleLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop right side */}
          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <NavbarXP />
            <AutoSignToggle />
            <ConnectButton />
            <ThemeToggle />
          </div>

          {/* Mobile right side */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <ConnectButton />
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
