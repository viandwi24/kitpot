import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

export const RPC = "http://localhost:8545";

// Anvil default accounts
export const ACCOUNTS = [
  { name: "Creator", key: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const },
  { name: "Alice",   key: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as const },
  { name: "Bob",     key: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" as const },
  { name: "Charlie", key: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6" as const },
  { name: "Dave",    key: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a" as const },
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
