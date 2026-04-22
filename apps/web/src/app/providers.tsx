"use client";

import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { CHAIN_CONFIG } from "@/lib/contracts";

// Define the kitpot-1 rollup chain
const kitpotChain = defineChain({
  id: CHAIN_CONFIG.chainId,
  name: "Kitpot",
  nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
  rpcUrls: {
    default: { http: [CHAIN_CONFIG.rpcUrl] },
  },
});

const wagmiConfig = createConfig({
  chains: [kitpotChain],
  transports: {
    [kitpotChain.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

// NOTE: InterwovenKitProvider and PrivyProvider are commented out until
// packages are installed in Plan 10. Uncomment and wrap children when ready.
//
// import { InterwovenKitProvider } from "@initia/interwovenkit-react";
// import { PrivyProvider } from "@privy-io/react-auth";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* TODO: Wrap with PrivyProvider + InterwovenKitProvider after install */}
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
