import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

// Set NETWORK=testnet to run against VPS rollup, otherwise uses local Anvil.
const NETWORK = process.env.NETWORK ?? "local";

const TESTNET_RPC = process.env.TESTNET_RPC_URL ?? "https://kitpot-rpc.viandwi24.com/";
const LOCAL_RPC = "http://localhost:8545";

export const RPC = NETWORK === "testnet" ? TESTNET_RPC : LOCAL_RPC;

const kitpotTestnet = defineChain({
  id: 64146729809684,
  name: "Kitpot Testnet",
  nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
  rpcUrls: { default: { http: [TESTNET_RPC] } },
});

export const CHAIN = NETWORK === "testnet" ? kitpotTestnet : foundry;

// Test account keys — loaded from environment variables.
// Set these before running test scripts:
//   export ACCOUNT_0=<key>  (Creator / deployer)
//   export ACCOUNT_1=<key>  (Alice)
//   export ACCOUNT_2=<key>  (Bob)
//   export ACCOUNT_3=<key>  (Charlie)
//   export ACCOUNT_4=<key>  (Dave)
// For local Anvil: copy keys from `anvil` startup output.
function requireEnv(name: string): `0x${string}` {
  const val = process.env[name];
  if (!val) throw new Error(`${name} env var not set. See scripts/test/config.ts for setup instructions.`);
  return val as `0x${string}`;
}

export const ACCOUNTS = [
  { name: "Creator", key: requireEnv("ACCOUNT_0") },
  { name: "Alice",   key: requireEnv("ACCOUNT_1") },
  { name: "Bob",     key: requireEnv("ACCOUNT_2") },
  { name: "Charlie", key: requireEnv("ACCOUNT_3") },
  { name: "Dave",    key: requireEnv("ACCOUNT_4") },
] as const;

export function getAccount(index: number) {
  const acc = ACCOUNTS[index];
  if (!acc) throw new Error(`Account #${index} not found`);
  return privateKeyToAccount(acc.key);
}

export function getPublicClient() {
  return createPublicClient({ chain: CHAIN, transport: http(RPC) });
}

export function getWalletClient(accountIndex: number) {
  return createWalletClient({
    account: getAccount(accountIndex),
    chain: CHAIN,
    transport: http(RPC),
  });
}

export function loadDeployed(): {
  MockUSDC: `0x${string}`;
  KitpotReputation: `0x${string}`;
  KitpotAchievements: `0x${string}`;
  KitpotCircle: `0x${string}`;
} {
  if (NETWORK === "testnet") {
    return {
      MockUSDC:           "0xE6353667eb88884374e89b98Cc69daee59752309",
      KitpotReputation:   "0xE2216861FBa926b09D5bFA96C2AACe34F6a7CC46",
      KitpotAchievements: "0xc0f72f9fD514E86Ab19a77993E1f35f94D19A5Fc",
      KitpotCircle:       "0x18c83c7b9f2AFBb22bB42d1BB58aaA6332D590Da",
    };
  }
  try {
    return require("./.deployed.json");
  } catch {
    throw new Error("No .deployed.json found. Run deploy.ts first.");
  }
}
