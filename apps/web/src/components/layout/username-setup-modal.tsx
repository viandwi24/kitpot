"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const KEY = "kitpot:username";

export function UsernameSetupModal() {
  const { isConnected } = useAccount();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (isConnected && localStorage.getItem(KEY) === null) {
      setOpen(true);
    }
  }, [isConnected]);

  const dismiss = useCallback(() => {
    localStorage.setItem(KEY, "");
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, dismiss]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    localStorage.setItem(KEY, trimmed);
    window.dispatchEvent(new Event("storage"));
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold">What's your Initia handle?</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          This shows up in circles instead of your address. You can set it once and forget it.
          Don't have one? Just type anything — e.g. <span className="font-mono text-foreground/70">yourname.init</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-username">Username</Label>
            <Input
              id="modal-username"
              placeholder="yourname.init"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {value.trim() ? "Save" : "Skip for now"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
