import { getNetworkConfig } from "./network";

const network = getNetworkConfig();

export const CONTRACTS = network.contracts;

export const CHAIN_CONFIG = {
  rpcUrl: network.rpcUrl,
  chainId: network.chainId,
} as const;

export const USDC_DECIMALS = 6;
