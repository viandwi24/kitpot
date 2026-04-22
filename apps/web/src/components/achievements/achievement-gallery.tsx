"use client";

import { useAccount, useReadContracts } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACHIEVEMENTS_ABI } from "@/lib/abi/KitpotAchievements";
import { CONTRACTS } from "@/lib/contracts";
import { ACHIEVEMENT_NAMES, ACHIEVEMENT_ICONS, useAchievementTokenIds } from "@/hooks/use-achievements";

function AchievementIcon({ typeIndex, unlocked }: { typeIndex: number; unlocked: boolean }) {
  const path = ACHIEVEMENT_ICONS[typeIndex] ?? ACHIEVEMENT_ICONS[0];
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

export function AchievementGallery() {
  const { address } = useAccount();
  const { data: tokenIds } = useAchievementTokenIds(address);

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

  // Build set of unlocked achievement types
  const unlockedTypes = new Set<number>();
  if (achievementData) {
    achievementData.forEach((result) => {
      if (result.status === "success" && result.result) {
        unlockedTypes.add(Number(result.result[0])); // achievementType is first field
      }
    });
  }

  const totalUnlocked = unlockedTypes.size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Achievements ({totalUnlocked}/{ACHIEVEMENT_NAMES.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {ACHIEVEMENT_NAMES.map((name, i) => {
            const unlocked = unlockedTypes.has(i);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <AchievementIcon typeIndex={i} unlocked={unlocked} />
                <span className={`text-[10px] text-center leading-tight ${
                  unlocked ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
