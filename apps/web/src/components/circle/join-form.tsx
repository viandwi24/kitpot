"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useJoinCircle } from "@/hooks/use-create-circle";
import { formatUSDC } from "@/lib/utils";
import type { CircleData } from "@/hooks/use-circles";

interface JoinFormProps {
  circleId: bigint;
  circle: CircleData;
}

export function JoinForm({ circleId, circle }: JoinFormProps) {
  const router = useRouter();
  const { joinCircle, isPending, isConfirming, isSuccess, error } = useJoinCircle();
  const [initUsername, setInitUsername] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    joinCircle(circleId, initUsername);
  }

  if (isSuccess) {
    router.push(`/circles/${circleId.toString()}`);
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Join Circle</CardTitle>
        <CardDescription>{circle.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-1 text-sm">
          <p>{formatUSDC(circle.contributionAmount)} USDC / cycle</p>
          <p>{circle.maxMembers.toString()} members</p>
          <p>{circle.memberCount.toString()}/{circle.maxMembers.toString()} joined</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">.init Username</Label>
            <Input
              id="username"
              placeholder="yourname.init"
              value={initUsername}
              onChange={(e) => setInitUsername(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              Error: {error.message.slice(0, 100)}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending || isConfirming}>
            {isPending
              ? "Waiting for approval..."
              : isConfirming
              ? "Confirming..."
              : "Join Circle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
