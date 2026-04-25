export interface NetworkConfig {
  cosmosChainId: string;
  cosmosRpc: string;
  cosmosRest: string;
  jsonRpc: string;
  evmChainId: number;
  nativeSymbol: string;
  nativeDecimals: number;
  contracts: {
    kitpotCircle: `0x${string}`;
    mockUSDC: `0x${string}`;
    mockUSDe: `0x${string}`;
    reputation: `0x${string}`;
    achievements: `0x${string}`;
  };
}

/** EIP-3085 params for wallet_addEthereumChain — built from env vars. */
export const KITPOT_EVM_CHAIN_PARAMS = {
  chainId: `0x${Number(process.env.NEXT_PUBLIC_KITPOT_EVM_CHAIN_ID ?? "64146729809684").toString(16)}`,
  chainName: "Kitpot Testnet",
  nativeCurrency: { name: "GAS", symbol: "GAS", decimals: 18 },
  rpcUrls: [process.env.NEXT_PUBLIC_KITPOT_JSON_RPC ?? ""],
  blockExplorerUrls: [] as string[],
} as const;

export function getNetworkConfig(): NetworkConfig {
  return {
    cosmosChainId: process.env.NEXT_PUBLIC_KITPOT_COSMOS_CHAIN_ID ?? "kitpot-2",
    cosmosRpc: process.env.NEXT_PUBLIC_KITPOT_COSMOS_RPC ?? "http://localhost:26657",
    cosmosRest: process.env.NEXT_PUBLIC_KITPOT_COSMOS_REST ?? "http://localhost:1317",
    jsonRpc: process.env.NEXT_PUBLIC_KITPOT_JSON_RPC ?? "http://localhost:8545",
    evmChainId: Number(process.env.NEXT_PUBLIC_KITPOT_EVM_CHAIN_ID ?? "64146729809684"),
    nativeSymbol: process.env.NEXT_PUBLIC_KITPOT_NATIVE_SYMBOL ?? "GAS",
    nativeDecimals: Number(process.env.NEXT_PUBLIC_KITPOT_NATIVE_DECIMALS ?? "18"),
    contracts: {
      kitpotCircle: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x") as `0x${string}`,
      mockUSDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "0x") as `0x${string}`,
      mockUSDe: (process.env.NEXT_PUBLIC_USDE_ADDRESS ?? "0x") as `0x${string}`,
      reputation: (process.env.NEXT_PUBLIC_REPUTATION_ADDRESS ?? "0x") as `0x${string}`,
      achievements: (process.env.NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS ?? "0x") as `0x${string}`,
    },
  };
}
