/**
 * E2E proof script — Substitute claim (dormant recipient) on live testnet.
 *
 * Proves the permissionless keeper safety net:
 *   1. Cycle elapses + DORMANT_GRACE (7 days on mainnet, but circle uses 60s
 *      cycle so on testnet this fires fast).
 *   2. Non-recipient calls substituteClaim.
 *   3. Pot goes to the actual recipient (NOT the caller).
 *   4. Caller receives 0.1% keeper reward.
 *
 * NOTE: This script requires DORMANT_GRACE to be 7 days (604800s). With a 60s
 * cycle duration, the total wait is ~604860s. For a realistic test, you'd
 * either need to run this script and wait 7 days, or deploy with a shorter
 * DORMANT_GRACE for testing. Alternatively, use forge test (which can warp time).
 *
 * For the hackathon demo, this script documents the flow but the actual proof
 * is in the forge tests (SubstituteClaim.t.sol) which use vm.warp.
 *
 * Usage (local anvil with fast-forward):
 *   NETWORK=local ACCOUNT_0=0x<key> ACCOUNT_1=0x<key> ACCOUNT_2=0x<key> \
 *     bun scripts/test/prove-substitute-claim.ts
 */

import {
  createPublicClient,
  createWalletClient,
  defineChain,
  formatUnits,
  http,
  parseUnits,
  maxUint256,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { KITPOT_ABI } from "../../apps/web/src/lib/abi/KitpotCircle";
import { MOCK_USDC_ABI } from "../../apps/web/src/lib/abi/MockUSDC";

// ── Config ──────────────────────────────────────────────────────────────────
const RPC = process.env.RPC_URL ?? "http://localhost:8545";
const CHAIN = defineChain({
  id: 31337, // anvil default
  name: "Anvil",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

const operatorKey = process.env.ACCOUNT_0;
if (!operatorKey) throw new Error("Set ACCOUNT_0=0x<operator-private-key>");

const operator = privateKeyToAccount(operatorKey as `0x${string}`);
const aliceKey = process.env.ACCOUNT_1 ? (process.env.ACCOUNT_1 as `0x${string}`) : generatePrivateKey();
const bobKey = process.env.ACCOUNT_2 ? (process.env.ACCOUNT_2 as `0x${string}`) : generatePrivateKey();
const alice = privateKeyToAccount(aliceKey);
const bob = privateKeyToAccount(bobKey);

const pub = createPublicClient({ chain: CHAIN, transport: http(RPC) });
const opWallet = createWalletClient({ account: operator, chain: CHAIN, transport: http(RPC) });
const aliceWallet = createWalletClient({ account: alice, chain: CHAIN, transport: http(RPC) });
const bobWallet = createWalletClient({ account: bob, chain: CHAIN, transport: http(RPC) });

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("=== Prove Substitute Claim ===");
  console.log("NOTE: This script is designed for local Anvil with time manipulation.");
  console.log("For testnet proof, see forge tests in contracts/test/SubstituteClaim.t.sol\n");

  console.log(`Operator (recipient cycle 0): ${operator.address}`);
  console.log(`Alice: ${alice.address}`);
  console.log(`Bob (keeper): ${bob.address}`);

  // This script assumes local Anvil deployment.
  // On a real testnet with DORMANT_GRACE = 7 days, you'd need to wait 7+ days.
  // Use forge tests with vm.warp for instant verification.

  console.log("\nSubstitute claim flow:");
  console.log("1. All 3 members deposit for cycle 0");
  console.log("2. Wait cycleDuration + DORMANT_GRACE + 1");
  console.log("3. Bob (not recipient) calls substituteClaim(circleId)");
  console.log("4. Assert: Operator receives pot, Bob receives 0.1% keeper reward");
  console.log("\nThis flow is proven in forge test: SubstituteClaim.t.sol");
  console.log("Run: cd contracts && forge test -vv --match-contract SubstituteClaimTest");

  console.log("\n=== Substitute Claim Script Complete (see forge tests for proof) ===");
}

main().catch(console.error);
