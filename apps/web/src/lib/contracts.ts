export const CONTRACTS = {
  kitpotCircle: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x") as `0x${string}`,
  mockUSDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "0x") as `0x${string}`,
  reputation: (process.env.NEXT_PUBLIC_REPUTATION_ADDRESS ?? "0x") as `0x${string}`,
  achievements: (process.env.NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS ?? "0x") as `0x${string}`,
} as const;

export const CHAIN_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_KITPOT_RPC_URL ?? "http://localhost:8545",
  chainId: Number(process.env.NEXT_PUBLIC_KITPOT_CHAIN_ID ?? "1"),
} as const;

export const USDC_DECIMALS = 6;
