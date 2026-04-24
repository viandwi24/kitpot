"use client";

import { use } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { useCircle, useCircleMembers } from "@/hooks/use-circles";
import { CircleHeader } from "@/components/circle/circle-header";
import { CurrentCycle } from "@/components/circle/current-cycle";
import { PaymentStatus } from "@/components/circle/payment-status";
import { TurnOrder } from "@/components/circle/turn-order";
import { CircleHistory } from "@/components/circle/circle-history";
import { InviteForm } from "@/components/circle/invite-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function CircleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const circleId = BigInt(id);
  const { address } = useAccount();
  const { data: circle, isLoading: circleLoading, isError } = useCircle(circleId);
  const { data: members } = useCircleMembers(circleId);

  if (circleLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !circle) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-4xl">🔍</p>
        <h2 className="text-xl font-semibold">Circle not found</h2>
        <p className="text-muted-foreground">This circle doesn't exist or may have been removed.</p>
        <Button asChild>
          <Link href="/circles">Back to My Circles</Link>
        </Button>
      </div>
    );
  }

  const memberList = [...(members ?? [])];
  const isForming = circle.status === 0;
  const isActive = circle.status === 1;
  const isCompleted = circle.status === 2;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <CircleHeader circle={circle} />

      {isForming && (
        <>
          <InviteForm
            circleId={id}
            circleName={circle.name}
            currentMembers={Number(circle.memberCount)}
            maxMembers={Number(circle.maxMembers)}
          />
          <div className="text-center text-sm text-muted-foreground">
            Waiting for {(circle.maxMembers - circle.memberCount).toString()} more members to start...
          </div>
        </>
      )}

      {isActive && (
        <>
          <CurrentCycle circle={circle} members={memberList} circleId={circleId} userAddress={address} />
          <PaymentStatus circleId={circleId} members={memberList} />
          <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 text-sm text-muted-foreground">
            Enable <strong>auto-sign</strong> in the header to pay cycle deposits without manual confirmation.
            InterwovenKit handles session keys natively via Cosmos authz + feegrant.
            <br />
            Need more USDC? Visit the <Link href="/bridge" className="underline text-foreground">Faucet</Link>.
          </div>
        </>
      )}

      <TurnOrder circle={circle} members={memberList} />
      <CircleHistory circle={circle} members={memberList} />

      {isCompleted && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="font-medium text-primary">Circle completed! All members have received their pot.</p>
        </div>
      )}

      <div className="text-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/circles">Back to My Circles</Link>
        </Button>
      </div>
    </div>
  );
}
