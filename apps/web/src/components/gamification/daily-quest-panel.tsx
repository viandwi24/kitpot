"use client";

import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReputation } from "@/hooks/use-reputation";
import { useKitpotTx } from "@/hooks/use-kitpot-tx";
import { StreakFlame } from "./streak-flame";
import { useState } from "react";

export function DailyQuestPanel() {
  const { address } = useAccount();
  const { data: rep } = useReputation(address);
  const { claimDailyQuest, isPending } = useKitpotTx();
  const [isSuccess, setIsSuccess] = useState(false);

  async function claim() {
    try {
      await claimDailyQuest();
      setIsSuccess(true);
    } catch {
      // error is surfaced via useKitpotTx().error
    }
  }
  const [refCopied, setRefCopied] = useState(false);

  const today = Math.floor(Date.now() / 86400000);
  const claimedToday = rep ? Number(rep.lastQuestClaimDay) >= today : false;
  const streak = rep ? Number(rep.questStreakDays) : 0;

  function copyReferralLink() {
    if (!address) return;
    const link = `${window.location.origin}/join/0?ref=${address}`;
    navigator.clipboard.writeText(link);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  }

  if (!address) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Daily Quests</span>
          <StreakFlame days={streak} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quest 1: Daily check-in */}
        <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
          <div>
            <p className="text-sm font-medium">Daily Check-in</p>
            <p className="text-xs text-muted-foreground">Claim once per day for +25 XP</p>
          </div>
          <Button
            size="sm"
            disabled={claimedToday || isPending}
            onClick={claim}
          >
            {claimedToday || isSuccess ? "Claimed" : isPending ? "..." : "+25 XP"}
          </Button>
        </div>

        {/* Quest 2: Pay on time (auto-tracked) */}
        <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
          <div>
            <p className="text-sm font-medium">Pay On Time</p>
            <p className="text-xs text-muted-foreground">Deposit before grace period ends</p>
          </div>
          <span className="text-xs text-muted-foreground">Auto +10 XP</span>
        </div>

        {/* Quest 3: Invite a friend */}
        <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
          <div>
            <p className="text-sm font-medium">Invite a Friend</p>
            <p className="text-xs text-muted-foreground">Both get +50 XP on their first deposit</p>
          </div>
          <Button size="sm" variant="outline" onClick={copyReferralLink}>
            {refCopied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
