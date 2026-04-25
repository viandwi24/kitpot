"use client";

import { useAccount, useReadContracts } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { ACHIEVEMENTS_ABI } from "@/lib/abi/KitpotAchievements";
import { CONTRACTS } from "@/lib/contracts";
import { ACHIEVEMENT_NAMES, ACHIEVEMENT_ICONS, useAchievementTokenIds, useTokenSvg } from "@/hooks/use-achievements";
import { VerifyOnChain } from "@/components/achievements/verify-onchain";

function AchievementIcon({ tokenId, typeIndex, unlocked }: { tokenId?: bigint; typeIndex: number; unlocked: boolean }) {
  const metadata = useTokenSvg(unlocked ? tokenId : undefined);
  const path = ACHIEVEMENT_ICONS[typeIndex] ?? ACHIEVEMENT_ICONS[0];

  if (metadata?.image) {
    return (
      <img
        src={metadata.image}
        alt={metadata.name ?? ACHIEVEMENT_NAMES[typeIndex]}
        className="h-14 w-14 rounded-2xl border border-primary/30 bg-primary/10"
      />
    );
  }

  return (
    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
      unlocked ? "border-primary/30 bg-primary/10" : "border-border bg-secondary opacity-40"
    }`}>
      <svg className={`h-6 w-6 ${unlocked ? "text-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </div>
  );
}

export function AchievementGallery({ address }: { address?: `0x${string}` }) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address ?? connectedAddress;
  const { data: tokenIds } = useAchievementTokenIds(targetAddress);

  // Read achievement type for each token
  const contracts = (tokenIds ?? []).map((id) => ({
    address: CONTRACTS.achievements as `0x${string}`,
    abi: ACHIEVEMENTS_ABI,
    functionName: "achievements" as const,
    args: [id] as const,
  }));

  const { data: achievementData } = useReadContracts({
    contracts,
    query: { enabled: (tokenIds ?? []).length > 0 },
  });

  // Map achievement type → { tokenId, earnedAt }
  const earnedMap = new Map<number, { tokenId: bigint; earnedAt: number }>();
  if (achievementData) {
    achievementData.forEach((result, i) => {
      if (result.status === "success" && result.result) {
        const r = result.result as readonly [number, string, bigint, bigint];
        earnedMap.set(Number(r[0]), {
          tokenId: tokenIds![i],
          earnedAt: Number(r[2]),
        });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Achievements ({earnedMap.size}/{ACHIEVEMENT_NAMES.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {ACHIEVEMENT_NAMES.map((name, i) => {
            const earned = earnedMap.get(i);
            const unlocked = !!earned;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <AchievementIcon typeIndex={i} unlocked={unlocked} tokenId={earned?.tokenId} />
                <span className={`text-[10px] text-center leading-tight ${
                  unlocked ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {name}
                </span>
                {unlocked && (
                  <div className="flex items-center gap-0.5">
                    <Lock className="h-2 w-2 text-primary" />
                    <span className="text-[9px] text-primary">SBT</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
