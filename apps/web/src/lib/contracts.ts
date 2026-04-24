import { getNetworkConfig } from "./network";

const network = getNetworkConfig();

export const CONTRACTS = network.contracts;

export const CHAIN_CONFIG = {
  jsonRpc: network.jsonRpc,
  evmChainId: network.evmChainId,
  cosmosChainId: network.cosmosChainId,
} as const;

export const USDC_DECIMALS = 6;
