"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";
import { useInitUsername } from "@/hooks/use-init-username";

export function ConnectButton() {
  const { username: kitUsername, isConnected, openConnect, openWallet } = useInterwovenKit();
  const { address: evmAddress } = useAccount();
  // Fallback: query Initia REST directly with EVM address
  const { name: resolvedUsername } = useInitUsername(isConnected ? evmAddress : undefined);

  const displayName = kitUsername || resolvedUsername;

  if (isConnected && evmAddress) {
    return (
      <button
        onClick={openWallet}
        className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/80 transition-colors"
      >
        <div className="h-2 w-2 rounded-full bg-primary" />
        {displayName ? `${displayName}.init` : truncateAddress(evmAddress)}
      </button>
    );
  }

  return (
    <Button size="default" onClick={openConnect}>
      Connect Wallet
    </Button>
  );
}
