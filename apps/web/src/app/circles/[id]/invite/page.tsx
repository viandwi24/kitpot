"use client";

import { use } from "react";
import { useCircle } from "@/hooks/use-circles";
import { InviteForm } from "@/components/circle/invite-form";

export default function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const circleId = BigInt(id);
  const { data: circle } = useCircle(circleId);

  if (!circle) {
    return <p className="py-8 text-center text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <InviteForm
        circleId={id}
        circleName={circle.name}
        currentMembers={Number(circle.memberCount)}
        maxMembers={Number(circle.maxMembers)}
      />
    </div>
  );
}
