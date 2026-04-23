"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

interface ActionCard {
  icon: string;
  title: string;
  description: string;
  href: string;
}

const ACTION_CARDS: ActionCard[] = [
  { icon: "💰", title: "Create a Circle", description: "Start a savings group with friends. Set amount, members, and cycle duration.", href: "/circles/new" },
  { icon: "🔍", title: "Explore Circles", description: "Browse and join public savings circles.", href: "/discover" },
  { icon: "🌉", title: "Bridge USDC", description: "Deposit USDC from Initia hub to start saving.", href: "/bridge" },
];

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl rounded-t-2xl border border-border bg-background p-6 shadow-2xl sm:rounded-2xl sm:p-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close welcome"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>

        <div className="mb-6 sm:mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium tracking-wide uppercase text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Connected
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome to Kitpot</h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Trustless savings circles on Initia
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACTION_CARDS.map((card, idx) => (
            <Link
              key={card.href}
              href={card.href}
              onClick={onClose}
              className={`group relative flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4 transition-all hover:border-primary hover:bg-secondary/60 hover:-translate-y-0.5 ${
                idx === 2 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="text-2xl" aria-hidden>{card.icon}</div>
              <div className="text-sm font-semibold group-hover:text-primary transition-colors">
                {card.title}
              </div>
              <div className="text-xs leading-relaxed text-muted-foreground">
                {card.description}
              </div>
              <div className="mt-auto flex items-center gap-1 pt-2 text-xs font-medium text-primary opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                Go
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M2 5h6M5.5 2.5L8 5 5.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
