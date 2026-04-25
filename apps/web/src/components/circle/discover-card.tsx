"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/reputation/tier-badge";
import { formatUSDC } from "@/lib/utils";
import { getTokenSymbol, type CircleData } from "@/hooks/use-circles";

const TIER_LABELS = ["None", "Bronze+", "Silver+", "Gold+", "Diamond"];

export function DiscoverCard({ circle }: { circle: CircleData }) {
  const slotsRemaining = Number(circle.maxMembers - circle.memberCount);

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{circle.name}</CardTitle>
          <div className="flex items-center gap-2">
            {Number(circle.minimumTier) > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {TIER_LABELS[Number(circle.minimumTier)]}
              </Badge>
            )}
            <Badge variant="secondary">{slotsRemaining} slots</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {circle.description && (
          <p className="text-sm text-muted-foreground">{circle.description}</p>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatUSDC(circle.contributionAmount)} {getTokenSymbol(circle.tokenAddress)}/cycle · {circle.maxMembers.toString()} members
          </span>
          <Button asChild size="sm">
            <Link href={`/join/${circle.id.toString()}`}>Join</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
