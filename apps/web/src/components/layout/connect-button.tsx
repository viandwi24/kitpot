"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectors, connect } = useConnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-primary" />
          {truncateAddress(address)}
        </div>
        <Button variant="ghost" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="default"
      onClick={() => {
        const connector = connectors[0];
        if (connector) connect({ connector });
      }}
    >
      Connect Wallet
    </Button>
  );
}
