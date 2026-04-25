import { getNetworkConfig } from "./network";

const network = getNetworkConfig();

export const CONTRACTS = network.contracts;

export const CHAIN_CONFIG = {
  jsonRpc: network.jsonRpc,
  evmChainId: network.evmChainId,
  cosmosChainId: network.cosmosChainId,
} as const;

export const USDC_DECIMALS = 6;
export const USDE_DECIMALS = 6;

/** Supported payment tokens for circles. Static tuple — add entries here for new tokens. */
export const PAYMENT_TOKENS = [
  { symbol: "USDC", address: CONTRACTS.mockUSDC, decimals: USDC_DECIMALS, name: "Mock USDC" },
  { symbol: "USDe", address: CONTRACTS.mockUSDe, decimals: USDE_DECIMALS, name: "Mock USDe" },
] as const;

export type PaymentToken = (typeof PAYMENT_TOKENS)[number];
