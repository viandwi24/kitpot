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
                {/* Trust only the real Initia L1 username registry — never
                    pass member.initUsername as a fallback because it is a
                    self-claimed string the user typed at join time and may
                    not actually be a registered .init name. */}
                <InitUsername
                  address={member.addr}
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
