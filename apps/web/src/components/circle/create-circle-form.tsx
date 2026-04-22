"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateCircle } from "@/hooks/use-create-circle";

const CYCLE_PRESETS = [
  { label: "Demo (60s)", value: 60, grace: 30 },
  { label: "5 min", value: 300, grace: 120 },
  { label: "30 days", value: 2592000, grace: 259200 },
];

const TIER_OPTIONS = [
  { label: "None (anyone)", value: 0 },
  { label: "Bronze+", value: 1 },
  { label: "Silver+", value: 2 },
  { label: "Gold+", value: 3 },
  { label: "Diamond only", value: 4 },
];

export function CreateCircleForm() {
  const router = useRouter();
  const { createCircle, isPending, isConfirming, isSuccess, error } = useCreateCircle();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contributionAmount, setContributionAmount] = useState("100");
  const [maxMembers, setMaxMembers] = useState(3);
  const [cycleDuration, setCycleDuration] = useState(60);
  const [gracePeriod, setGracePeriod] = useState(30);
  const [isPublic, setIsPublic] = useState(true);
  const [minimumTier, setMinimumTier] = useState(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createCircle({
      name,
      description,
      contributionAmount,
      maxMembers,
      cycleDuration,
      gracePeriod,
      latePenaltyBps: 500, // 5% default
      isPublic,
      minimumTier,
    });
  }

  if (isSuccess) {
    router.push("/circles");
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Create a New Circle</CardTitle>
        <CardDescription>
          Start a savings circle. You become the first member and deposit collateral.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Circle Name</Label>
            <Input
              id="name"
              placeholder="Alumni Savings Group"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Monthly savings for university alumni"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Contribution per Cycle (USDC)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              placeholder="100"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="members">Number of Members</Label>
            <Input
              id="members"
              type="number"
              min={3}
              max={20}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Min 3, max 20. Each member receives the pot exactly once.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Cycle Duration</Label>
            <div className="flex gap-2">
              {CYCLE_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={cycleDuration === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCycleDuration(preset.value);
                    setGracePeriod(preset.grace);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Minimum Trust Tier</Label>
            <div className="flex flex-wrap gap-2">
              {TIER_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={minimumTier === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMinimumTier(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`relative h-6 w-11 rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-secondary"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isPublic ? "translate-x-5" : ""}`} />
            </button>
            <Label>Public (visible in Discover)</Label>
          </div>

          <div className="rounded-2xl bg-secondary p-4 text-sm space-y-1">
            <p>
              <strong>Summary:</strong> {maxMembers} members x {contributionAmount} USDC ={" "}
              <strong>{Number(contributionAmount) * maxMembers} USDC</strong> per pot
            </p>
            <p className="text-muted-foreground">Collateral: {contributionAmount} USDC (returned after completion)</p>
            <p className="text-muted-foreground">Late penalty: 5% of contribution per late payment</p>
            <p className="text-muted-foreground">Platform fee: 1% per pot</p>
          </div>

          {error && (
            <p className="text-sm text-destructive">
              Error: {error.message.slice(0, 100)}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending || isConfirming}>
            {isPending
              ? "Waiting for approval..."
              : isConfirming
              ? "Confirming..."
              : "Create Circle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
