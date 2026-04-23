import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

export const RPC = "http://localhost:8545";

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
  return createPublicClient({ chain: foundry, transport: http(RPC) });
}

export function getWalletClient(accountIndex: number) {
  return createWalletClient({
    account: getAccount(accountIndex),
    chain: foundry,
    transport: http(RPC),
  });
}

export function loadDeployed(): {
  MockUSDC: `0x${string}`;
  KitpotReputation: `0x${string}`;
  KitpotAchievements: `0x${string}`;
  KitpotCircle: `0x${string}`;
} {
  try {
    return require("./.deployed.json");
  } catch {
    throw new Error("No .deployed.json found. Run deploy.ts first.");
  }
}
