"use client";

import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "./connect-button";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="mr-8 flex items-center gap-2.5">
          <Image src="/kitpot_logo.svg" alt="Kitpot" width={32} height={32} />
          <span className="text-xl font-bold text-primary">Kitpot</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/discover" className="text-muted-foreground transition-colors hover:text-foreground">
            Discover
          </Link>
          <Link href="/circles" className="text-muted-foreground transition-colors hover:text-foreground">
            My Circles
          </Link>
          <Link href="/circles/new" className="text-muted-foreground transition-colors hover:text-foreground">
            Create
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
