"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";
import { parseUnits } from "viem";
import { useReadContract } from "wagmi";
import { CONTRACTS, USDC_DECIMALS } from "@/lib/contracts";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useAccount } from "wagmi";
import { truncateAddress } from "@/lib/utils";

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
  const { address: evmAddress } = useAccount();
  const { username } = useInterwovenKit();
  const { createCircle, approveUSDC, isPending, error } = useKitpotTx();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contributionAmount, setContributionAmount] = useState("100");
  const [maxMembers, setMaxMembers] = useState(3);
  const [cycleDuration, setCycleDuration] = useState(60);
  const [gracePeriod, setGracePeriod] = useState(30);
  const [isPublic, setIsPublic] = useState(true);
  const [minimumTier, setMinimumTier] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const collateralNeeded = parseUnits(contributionAmount || "0", USDC_DECIMALS);
  const initUsername = username ? `${username}` : (evmAddress ? truncateAddress(evmAddress) : "");

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: evmAddress ? [evmAddress, CONTRACTS.kitpotCircle] : undefined,
    query: { enabled: !!evmAddress },
  });

  const needsApproval = allowance !== undefined && allowance < collateralNeeded;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (needsApproval) {
        await approveUSDC(CONTRACTS.kitpotCircle);
        await refetchAllowance();
      }
      await createCircle({
        name,
        description,
        contributionAmount: collateralNeeded,
        maxMembers: BigInt(maxMembers),
        cycleDuration: BigInt(cycleDuration),
        gracePeriod: BigInt(gracePeriod),
        latePenaltyBps: 500n,
        isPublic,
        minimumTier,
        initUsername,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (success) router.push("/circles");
  }, [success, router]);

  const isBusy = submitting || isPending;

  function buttonLabel() {
    if (submitting && needsApproval) return "Approving USDC...";
    if (submitting || isPending) return "Creating circle...";
    if (needsApproval) return "Approve USDC & Create";
    return "Create Circle";
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

          <button
            type="button"
            className="flex w-full items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            Advanced settings
          </button>

          {showAdvanced && (
            <div className="space-y-4 rounded-xl border border-border/40 bg-secondary/20 p-4">
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
            </div>
          )}

          <div className="rounded-2xl bg-secondary p-4 text-sm space-y-1">
            <p>
              <strong>Summary:</strong> {maxMembers} members x {contributionAmount} USDC ={" "}
              <strong>{Number(contributionAmount) * maxMembers} USDC</strong> per pot
            </p>
            <p className="text-muted-foreground">Collateral: {contributionAmount} USDC (returned after completion)</p>
            <p className="text-muted-foreground">Late penalty: 5% of contribution per late payment</p>
            <p className="text-muted-foreground">Platform fee: 1% per pot</p>
          </div>

          {needsApproval && !isBusy && (
            <p className="text-xs text-muted-foreground text-center">
              First time: will ask you to approve USDC, then create circle in one flow.
            </p>
          )}

          {(error || submitError) && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p className="font-medium">Transaction failed</p>
              <p className="mt-1 text-xs opacity-80">{(error?.message || submitError || "").slice(0, 200)}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isBusy}>
            {buttonLabel()}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
