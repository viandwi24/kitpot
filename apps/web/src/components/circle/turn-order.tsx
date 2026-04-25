"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSDC } from "@/lib/utils";
import { InitUsername } from "@/components/username/init-username";
import { getTokenSymbol, type CircleData, type MemberData } from "@/hooks/use-circles";

interface TurnOrderProps {
  circle: CircleData;
  members: MemberData[];
}

export function TurnOrder({ circle, members }: TurnOrderProps) {
  const totalPot = circle.contributionAmount * circle.maxMembers;
  const fee = totalPot / 100n;
  const payout = totalPot - fee;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Turn Order</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((member, i) => {
            const cycleIndex = BigInt(i);
            const isCompleted = cycleIndex < circle.currentCycle;
            const isCurrent = cycleIndex === circle.currentCycle && circle.status === 1;
            const isUpcoming = cycleIndex > circle.currentCycle;

            return (
              <div
                key={member.addr}
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                  isCurrent ? "bg-primary/10 border border-primary/20" : "bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Cycle {(cycleIndex + 1n).toString()}
                  </span>
                  {/* Trust only the real Initia L1 username registry — never
                      pass member.initUsername as a fallback because it is a
                      self-claimed string the user typed at join time and may
                      not actually be a registered .init name. */}
                  <InitUsername
                    address={member.addr}
                    className="text-sm font-medium"
                  />
                </div>
                <span className="text-xs">
                  {isCompleted && <span className="text-primary">Received {formatUSDC(payout)} {getTokenSymbol(circle.tokenAddress)}</span>}
                  {isCurrent && <span className="font-medium text-primary">Current</span>}
                  {isUpcoming && <span className="text-muted-foreground">Upcoming</span>}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
