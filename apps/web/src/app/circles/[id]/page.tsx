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
import { AutoSigningSetup } from "@/components/circle/auto-signing-setup";
import { BatchDepositTrigger } from "@/components/circle/batch-deposit-trigger";
import { BridgeDeposit } from "@/components/bridge/bridge-deposit";

export default function CircleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const circleId = BigInt(id);
  const { address } = useAccount();
  const { data: circle, isLoading: circleLoading } = useCircle(circleId);
  const { data: members } = useCircleMembers(circleId);

  if (circleLoading || !circle) {
    return <p className="py-8 text-center text-muted-foreground">Loading...</p>;
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
          <AutoSigningSetup circleId={circleId} circle={circle} />
          <BatchDepositTrigger circleId={circleId} />
          <BridgeDeposit />
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
