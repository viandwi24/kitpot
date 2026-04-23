"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DailyQuestPanel } from "@/components/gamification/daily-quest-panel";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

function AnimateIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LandingSections() {
  return (
    <div className="relative overflow-x-hidden">
      {/* Hero background glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-primary/8 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/4 top-40 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px]" />
      <div className="pointer-events-none absolute right-1/4 top-60 h-[200px] w-[200px] rounded-full bg-primary/4 blur-[60px]" />

      {/* ─── HERO ─── */}
      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-24 pt-28 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Built on Initia
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[5.5rem]"
        >
          Save Together.{" "}
          <span className="text-primary">Level Up Together.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground"
        >
          Trustless savings circles with XP, badges, and on-chain reputation.
          Approve once — contributions run automatically.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Button asChild size="xl" className="shadow-lg shadow-primary/20">
            <Link href="/circles/new">Create a Circle</Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link href="/discover">Explore Circles</Link>
          </Button>
        </motion.div>

      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative mx-auto max-w-5xl px-4 py-20">
        <AnimateIn className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
          <p className="mt-3 text-muted-foreground">Three steps, zero friction.</p>
        </AnimateIn>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Create & Invite",
              description: "Start a circle, set the contribution amount, and invite members by their .init username.",
            },
            {
              step: "02",
              title: "Auto-Sign Once",
              description: "Each member approves a single session. No more monthly wallet pop-ups, ever.",
            },
            {
              step: "03",
              title: "Automated Payouts",
              description: "Every cycle, contributions are collected and the pot goes to the next member automatically.",
            },
          ].map((feature, i) => (
            <AnimateIn key={feature.step} delay={i * 0.1}>
              <div className="group relative h-full rounded-2xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
                  {feature.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                <div className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-primary/60 to-primary/20 transition-all duration-500 group-hover:w-full" />
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ─── INITIA FEATURES ─── */}
      <section className="relative mx-auto max-w-5xl px-4 py-20">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-primary/4 blur-[100px]" />

        <AnimateIn className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Powered by Initia</h2>
          <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
            Native features that aren&apos;t available on any other chain.
          </p>
        </AnimateIn>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Auto-Signing Sessions", description: "Approve once, run for 12 months. Like subscribing to Netflix — no monthly wallet pop-ups.", tag: "UX" },
            { title: ".init Usernames", description: "Invite friends by name, not wallet address. As natural as mentioning someone on social media.", tag: "Social" },
            { title: "Interwoven Bridge", description: "Deposit from Initia hub to kitpot-1 rollup via IBC. Users never see two chains.", tag: "IBC" },
            { title: "Social Login", description: "Google, email, or Apple sign-in. No MetaMask, no seed phrases, no crypto knowledge needed.", tag: "Onboard" },
          ].map((feature, i) => (
            <AnimateIn key={feature.title} delay={i * 0.08}>
              <div className="rounded-2xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-primary/30">
                <div className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
                  {feature.tag}
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ─── GAMIFICATION ─── */}
      <section className="relative mx-auto max-w-5xl px-4 py-20">
        <AnimateIn className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Level Up Your Reputation</h2>
          <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
            Every on-time payment earns XP. Complete circles to unlock trust tiers and soulbound achievement NFTs.
          </p>
        </AnimateIn>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { stat: "6", unit: "Levels", title: "Earn XP", description: "Novice → Legendary. Payments, completions, daily quests, and referrals all earn XP." },
            { stat: "5", unit: "Tiers", title: "Build Trust", description: "Bronze, Silver, Gold, Diamond. Higher tiers unlock more exclusive circles." },
            { stat: "12", unit: "Badges", title: "Collect Badges", description: "Soulbound NFTs minted on-chain. Perfect Circle, Veteran, Diamond — visible proof." },
          ].map((item, i) => (
            <AnimateIn key={item.title} delay={i * 0.1}>
              <div className="rounded-2xl border border-border/60 bg-card p-7 text-center transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-1 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-primary">{item.stat}</span>
                  <span className="text-sm font-medium text-primary/70">{item.unit}</span>
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

        <AnimateIn delay={0.3} className="mt-10 flex justify-center gap-4">
          <Button asChild variant="outline" size="lg">
            <Link href="/leaderboard">View Leaderboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/achievements">View Badges</Link>
          </Button>
        </AnimateIn>
      </section>

      {/* ─── DAILY QUEST ─── */}
      <section className="relative mx-auto max-w-lg px-4 pb-10">
        <DailyQuestPanel />
      </section>

      {/* ─── CTA ─── */}
      <section className="relative mx-auto max-w-5xl px-4 py-20">
        <AnimateIn>
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-14 text-center shadow-2xl shadow-primary/5">
            <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-primary/10 blur-[80px]" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">
                500 years of savings circles.<br />
                <span className="text-primary">Now trustless.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-muted-foreground">
                No treasurer who can run away. No WhatsApp reminders. No spreadsheets.
                Just a smart contract that handles everything.
              </p>
              <div className="mt-10">
                <Button asChild size="xl" className="shadow-lg shadow-primary/20">
                  <Link href="/circles/new">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/kitpot_logo.svg" alt="Kitpot" width={20} height={20} />
            <span>Kitpot</span>
          </div>
          <span>Built for INITIATE Hackathon 2026</span>
        </div>
      </footer>
    </div>
  );
}
