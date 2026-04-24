"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCyclePaymentStatus } from "@/hooks/use-circle-dashboard";
import { InitUsername } from "@/components/username/init-username";
import type { MemberData } from "@/hooks/use-circles";

interface PaymentStatusProps {
  circleId: bigint;
  members: MemberData[];
}

export function PaymentStatus({ circleId, members }: PaymentStatusProps) {
  const { data } = useCyclePaymentStatus(circleId);

  const paidStatuses = data ? data[1] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((member, i) => {
            const paid = paidStatuses[i] ?? false;
            return (
              <div key={member.addr} className="flex items-center justify-between rounded-xl bg-secondary px-4 py-2.5">
                <InitUsername
                  address={member.addr}
                  fallback={member.initUsername || undefined}
                  className="text-sm font-medium"
                />
                <span className={`text-sm ${paid ? "text-primary" : "text-muted-foreground"}`}>
                  {paid ? "Paid" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
