"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { CircleCard } from "@/components/circle/circle-card";
import { useCircleCount, useMyCircles, useCircle } from "@/hooks/use-circles";

function CircleCardLoader({ circleId }: { circleId: bigint }) {
  const { data: circle } = useCircle(circleId);
  if (!circle) return null;
  return <CircleCard circle={circle} />;
}

export default function MyCirclesPage() {
  const { address } = useAccount();
  const { data: totalCircles } = useCircleCount();
  const { myCircleIds, isLoading } = useMyCircles(
    address,
    totalCircles ? Number(totalCircles) : 0
  );

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold">Connect your wallet</h2>
        <p className="mt-2 text-muted-foreground">
          Connect to see your circles.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Circles</h1>
        <Button asChild>
          <Link href="/circles/new">+ New Circle</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : myCircleIds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No circles yet.</p>
          <Button asChild className="mt-4">
            <Link href="/circles/new">Create Your First Circle</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myCircleIds.map((id) => (
            <CircleCardLoader key={id.toString()} circleId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
