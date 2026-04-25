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
  MockUSDe: `0x${string}`;
  KitpotReputation: `0x${string}`;
  KitpotAchievements: `0x${string}`;
  KitpotCircle: `0x${string}`;
} {
  if (NETWORK === "testnet") {
    // Plan 22 redeploy 2026-04-25 — pull-claim model + permissionless keeper.
    // Old contracts at 0x62d244f3... orphaned (push-based advanceCycle).
    return {
      MockUSDC:           "0xa157C9fB56A2929D30d5EBe9442Ab669D5943Df1",
      MockUSDe:           "0x25a9e7ff5949c25cd28715340dfde84035ff7b3d",
      KitpotReputation:   "0x24b0D1B543dCC017e662Cb2F70E67C3895506d82",
      KitpotAchievements: "0x97E36B91ccea9d6dBFB606fD822286f58978eDaB",
      KitpotCircle:       "0x7526CE9959756Fb5fc5e4431999A2660eEd8cD86",
    };
  }
  try {
    return require("./.deployed.json");
  } catch {
    throw new Error("No .deployed.json found. Run deploy.ts first.");
  }
}
