"use client";

import { useCircleCount } from "@/hooks/use-circles";
import { usePublicCircles } from "@/hooks/use-discover";
import { DiscoverCard } from "@/components/circle/discover-card";

export default function DiscoverPage() {
  const { data: totalCircles } = useCircleCount();
  const { publicCircles, isLoading } = usePublicCircles(
    totalCircles ? Number(totalCircles) : 0
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Discover Circles</h1>
        <p className="mt-1 text-muted-foreground">
          Browse open circles and join one that fits your budget.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : publicCircles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No open circles available right now.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create one and make it public!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {publicCircles.map((circle) => (
            <DiscoverCard key={circle.id.toString()} circle={circle} />
          ))}
        </div>
      )}
    </div>
  );
}
