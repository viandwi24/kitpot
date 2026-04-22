"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InviteFormProps {
  circleId: string;
  circleName: string;
  currentMembers: number;
  maxMembers: number;
}

export function InviteForm({ circleId, circleName, currentMembers, maxMembers }: InviteFormProps) {
  const [copied, setCopied] = useState(false);

  const joinLink = typeof window !== "undefined"
    ? `${window.location.origin}/join/${circleId}`
    : `/join/${circleId}`;

  function handleCopy() {
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Members</CardTitle>
        <CardDescription>
          {circleName} — {currentMembers}/{maxMembers} members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Share this link with friends to join your circle:
          </p>
          <div className="flex gap-2">
            <Input value={joinLink} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
