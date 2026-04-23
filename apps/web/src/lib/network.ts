export type NetworkKey = "local" | "testnet";

export interface LocalConfig {
  rpcUrl: string;
  chainId: number;
  kitpotCircle: `0x${string}`;
  mockUSDC: `0x${string}`;
  reputation: `0x${string}`;
  achievements: `0x${string}`;
}

const LOCAL_CONFIG_KEY = "kitpot_local_config";
const STORAGE_KEY = "kitpot_network";

export function getLocalConfig(): LocalConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalConfig(config: LocalConfig): void {
  localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
}

export function getDefaultLocalConfig(): LocalConfig {
  return {
    rpcUrl: process.env.NEXT_PUBLIC_KITPOT_RPC_URL ?? "http://localhost:8545",
    chainId: Number(process.env.NEXT_PUBLIC_KITPOT_CHAIN_ID ?? "31337"),
    kitpotCircle: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x") as `0x${string}`,
    mockUSDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "0x") as `0x${string}`,
    reputation: (process.env.NEXT_PUBLIC_REPUTATION_ADDRESS ?? "0x") as `0x${string}`,
    achievements: (process.env.NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS ?? "0x") as `0x${string}`,
  };
}

export const NETWORKS = {
  local: {
    label: "Local",
    get rpcUrl() { return getLocalConfig()?.rpcUrl ?? process.env.NEXT_PUBLIC_KITPOT_RPC_URL ?? "http://localhost:8545"; },
    get chainId() { return getLocalConfig()?.chainId ?? Number(process.env.NEXT_PUBLIC_KITPOT_CHAIN_ID ?? "31337"); },
    get contracts() {
      const saved = getLocalConfig();
      return {
        kitpotCircle: (saved?.kitpotCircle ?? process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x") as `0x${string}`,
        mockUSDC: (saved?.mockUSDC ?? process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "0x") as `0x${string}`,
        reputation: (saved?.reputation ?? process.env.NEXT_PUBLIC_REPUTATION_ADDRESS ?? "0x") as `0x${string}`,
        achievements: (saved?.achievements ?? process.env.NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS ?? "0x") as `0x${string}`,
      };
    },
  },
  testnet: {
    label: "Testnet",
    rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL ?? "http://localhost:8545",
    chainId: Number(process.env.NEXT_PUBLIC_TESTNET_CHAIN_ID ?? "31337"),
    contracts: {
      kitpotCircle: (process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS ?? "0x") as `0x${string}`,
      mockUSDC: (process.env.NEXT_PUBLIC_TESTNET_USDC_ADDRESS ?? "0x") as `0x${string}`,
      reputation: (process.env.NEXT_PUBLIC_TESTNET_REPUTATION_ADDRESS ?? "0x") as `0x${string}`,
      achievements: (process.env.NEXT_PUBLIC_TESTNET_ACHIEVEMENTS_ADDRESS ?? "0x") as `0x${string}`,
    },
  },
} as const;

const ENV_DEFAULT = process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "local" ? "local" : "testnet";

export function getSelectedNetwork(): NetworkKey {
  if (typeof window === "undefined") return ENV_DEFAULT;
  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored === "local" || stored === "testnet") ? stored : ENV_DEFAULT;
}

export function setSelectedNetwork(key: NetworkKey): void {
  localStorage.setItem(STORAGE_KEY, key);
  window.location.reload();
}

export function getNetworkConfig() {
  const key = getSelectedNetwork();
  const net = NETWORKS[key];
  return {
    rpcUrl: net.rpcUrl,
    chainId: net.chainId,
    contracts: net.contracts,
  };
}
