"use client";

import { useEffect, useState } from "react";

interface XPToastData {
  id: number;
  amount: number;
  reason: string;
}

let toastId = 0;

// Global toast queue — call this from anywhere
const listeners = new Set<(toast: XPToastData) => void>();

export function showXPToast(amount: number, reason: string) {
  const toast: XPToastData = { id: ++toastId, amount, reason };
  listeners.forEach((fn) => fn(toast));
}

export function XPToastContainer() {
  const [toasts, setToasts] = useState<XPToastData[]>([]);

  useEffect(() => {
    const handler = (toast: XPToastData) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-in slide-in-from-right fade-in rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
        >
          +{t.amount} XP · {t.reason}
        </div>
      ))}
    </div>
  );
}
