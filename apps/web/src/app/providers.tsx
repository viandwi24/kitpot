"use client";

import "@/lib/react-polyfill";
import { type ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";
import {
  InterwovenKitProvider,
  initiaPrivyWalletConnector,
  injectStyles,
  TESTNET,
} from "@initia/interwovenkit-react";
import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { getNetworkConfig } from "@/lib/network";

const net = getNetworkConfig();

const kitpotEvmChain = defineChain({
  id: net.evmChainId,
  name: "Kitpot",
  nativeCurrency: { name: "Gas", symbol: net.nativeSymbol, decimals: net.nativeDecimals },
  rpcUrls: { default: { http: [net.jsonRpc] } },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const KITPOT_CUSTOM_CHAIN: any = {
  chain_id: net.cosmosChainId,
  chain_name: "kitpot",
  pretty_name: "Kitpot",
  network_type: "testnet",
  bech32_prefix: "init",
  logo_URIs: {
    png: "https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.png",
    svg: "https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.svg",
  },
  apis: {
    rpc: [{ address: net.cosmosRpc }],
    rest: [{ address: net.cosmosRest }],
    indexer: [{ address: net.cosmosRest }],
    "json-rpc": [{ address: net.jsonRpc }],
  },
  fees: {
    fee_tokens: [{
      denom: net.nativeSymbol,
      fixed_min_gas_price: 0, low_gas_price: 0, average_gas_price: 0, high_gas_price: 0,
    }],
  },
  staking: { staking_tokens: [{ denom: net.nativeSymbol }] },
  native_assets: [{ denom: net.nativeSymbol, name: "Gas", symbol: net.nativeSymbol, decimals: net.nativeDecimals }],
  metadata: { is_l1: false, minitia: { type: "minievm" } },
};

const wagmiConfig = createConfig({
  chains: [kitpotEvmChain],
  connectors: [initiaPrivyWalletConnector],
  transports: { [kitpotEvmChain.id]: http(net.jsonRpc) },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    injectStyles(InterwovenKitStyles);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId={net.cosmosChainId}
          customChain={KITPOT_CUSTOM_CHAIN}
          enableAutoSign={{ [net.cosmosChainId]: ["/minievm.evm.v1.MsgCall"] }}
          theme="dark"
          disableAnalytics
        >
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
