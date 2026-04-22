"use client";

import { use } from "react";
import { useCircle } from "@/hooks/use-circles";
import { JoinForm } from "@/components/circle/join-form";

export default function JoinCirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const circleId = BigInt(id);
  const { data: circle } = useCircle(circleId);

  if (!circle) {
    return <p className="py-8 text-center text-muted-foreground">Loading circle...</p>;
  }

  if (circle.status !== 0) {
    return (
      <div className="py-8 text-center">
        <h2 className="text-xl font-semibold">Circle is full</h2>
        <p className="mt-2 text-muted-foreground">
          This circle is already active and not accepting new members.
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <JoinForm circleId={circleId} circle={circle} />
    </div>
  );
}
