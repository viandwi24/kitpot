import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />

      {/* Hero */}
      <section className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pt-28 pb-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Built on Initia
        </div>

        <h1 className="max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
          Savings Circles,{" "}
          <span className="text-primary">Fully Trustless</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          300M+ people worldwide use rotating savings circles.
          Kitpot puts them on-chain — approve once, contributions run automatically.
          No middleman, no spreadsheets, no trust required.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild size="xl">
            <Link href="/circles/new">Create a Circle</Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link href="/circles">My Circles</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid w-full max-w-2xl grid-cols-3 gap-4">
          {[
            { value: "300M+", label: "ROSCA Participants" },
            { value: "1%", label: "Platform Fee" },
            { value: "60s", label: "Demo Cycle" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="text-2xl font-bold sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative mx-auto max-w-4xl px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Create & Invite",
              description: "Start a circle, set the contribution amount, and invite members by their .init username.",
            },
            {
              step: "02",
              title: "Auto-Sign Once",
              description: "Each member approves a single auto-signing session. No more monthly approvals, ever.",
            },
            {
              step: "03",
              title: "Automated Payouts",
              description: "Every cycle, contributions are collected automatically and the pot goes to the next member.",
            },
          ].map((feature) => (
            <div
              key={feature.step}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {feature.step}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Initia Features */}
      <section className="relative mx-auto max-w-4xl px-4 py-20">
        <h2 className="mb-4 text-center text-3xl font-bold">Powered by Initia</h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Native features that aren&apos;t available on any other chain.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Auto-Signing Sessions",
              description: "Approve once, run for 12 months. Like subscribing to Netflix — no monthly wallet pop-ups.",
              tag: "UX",
            },
            {
              title: ".init Usernames",
              description: "Invite friends by name, not wallet address. As natural as mentioning someone on social media.",
              tag: "Social",
            },
            {
              title: "Interwoven Bridge",
              description: "Seamlessly deposit from Initia hub to the kitpot-1 rollup. Users never see two chains.",
              tag: "Infra",
            },
            {
              title: "Social Login",
              description: "Google, email, or Apple sign-in. No MetaMask, no seed phrases, no crypto knowledge needed.",
              tag: "Onboard",
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {feature.tag}
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-4xl px-4 py-20">
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <h2 className="text-3xl font-bold">
            500 years of savings circles.<br />
            <span className="text-primary">Now trustless.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            No treasurer who can run away. No WhatsApp reminders. No spreadsheets.
            Just a smart contract that handles everything.
          </p>
          <div className="mt-8">
            <Button asChild size="xl">
              <Link href="/circles/new">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
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
