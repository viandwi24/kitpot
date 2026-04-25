"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUSDC } from "@/lib/utils";
import { getTokenSymbol, type CircleData } from "@/hooks/use-circles";

const STATUS_LABELS: Record<number, { label: string; variant: "default" | "secondary" | "success" }> = {
  0: { label: "Forming", variant: "secondary" },
  1: { label: "Active", variant: "default" },
  2: { label: "Completed", variant: "success" },
};

export function CircleCard({ circle }: { circle: CircleData }) {
  const status = STATUS_LABELS[circle.status] ?? STATUS_LABELS[0];

  return (
    <Link href={`/circles/${circle.id.toString()}`}>
      <Card className="transition-colors hover:border-primary/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{circle.name}</CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {formatUSDC(circle.contributionAmount)} {getTokenSymbol(circle.tokenAddress)} x {circle.maxMembers.toString()} members
          </p>
          <p className="text-sm text-muted-foreground">
            {circle.status === 1
              ? `Cycle ${(circle.currentCycle + 1n).toString()}/${circle.totalCycles.toString()}`
              : `${circle.memberCount.toString()}/${circle.maxMembers.toString()} joined`}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
