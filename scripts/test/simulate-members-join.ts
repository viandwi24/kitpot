/**
 * Simulate Alice + Bob joining an existing circle.
 *
 * Use case: you created a circle from the UI (e.g. /circles/new) and now need
 * 2 more members to fill it so it reaches Active status. This script:
 *   1. Generates fresh Alice + Bob keypairs (logs them)
 *   2. Funds each with native GAS from operator
 *   3. Mints them USDC + USDe (5000 each)
 *   4. Approves KitpotCircle for unlimited spend
 *   5. Each calls joinCircle(circleId, username)
 *
 * Usage:
 *   NETWORK=testnet \
 *     ACCOUNT_0=0x<operator-key> \
 *     bun scripts/test/simulate-members-join.ts --circle=0
 */

import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseUnits,
  parseEther,
  maxUint256,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { KITPOT_ABI } from "../../apps/web/src/lib/abi/KitpotCircle";
import { MOCK_USDC_ABI } from "../../apps/web/src/lib/abi/MockUSDC";
import { loadDeployed } from "./config";

const RPC = "https://kitpot-rpc.viandwi24.com/";
const CHAIN = defineChain({
  id: 64146729809684,
  name: "Kitpot Testnet",
  nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

const circleId = BigInt(
  process.argv.find((a) => a.startsWith("--circle="))?.split("=")[1] ?? "0",
);

const operatorKey = process.env.ACCOUNT_0;
if (!operatorKey) throw new Error("Set ACCOUNT_0=0x<operator-private-key>");

const deployed = loadDeployed();
const operator = privateKeyToAccount(operatorKey as `0x${string}`);
const pub = createPublicClient({ chain: CHAIN, transport: http(RPC) });
const wOp = createWalletClient({ account: operator, chain: CHAIN, transport: http(RPC) });

async function send(label: string, hash: `0x${string}`) {
  const r = await pub.waitForTransactionReceipt({ hash });
  console.log(`  ✓ ${label} (block ${r.blockNumber}, gas ${r.gasUsed})`);
  return r;
}

async function main() {
  console.log(`\n=== Simulating Alice + Bob joining Circle #${circleId} ===\n`);
  console.log(`Operator: ${operator.address}`);

  const aliceKey = generatePrivateKey();
  const bobKey = generatePrivateKey();
  const alice = privateKeyToAccount(aliceKey);
  const bob = privateKeyToAccount(bobKey);

  console.log(`Alice:    ${alice.address} (key: ${aliceKey})`);
  console.log(`Bob:      ${bob.address} (key: ${bobKey})\n`);

  const wAlice = createWalletClient({ account: alice, chain: CHAIN, transport: http(RPC) });
  const wBob = createWalletClient({ account: bob, chain: CHAIN, transport: http(RPC) });

  // Step 1: fund native GAS
  console.log("[1/4] Funding Alice + Bob with native GAS…");
  for (const [name, addr] of [["Alice", alice.address], ["Bob", bob.address]] as const) {
    const tx = await wOp.sendTransaction({ to: addr, value: parseEther("0.0000001") });
    await send(`fund ${name}`, tx);
  }

  // Step 2: mint USDC to each (operator has mint permission since MockUSDC.mint is permissionless)
  console.log("\n[2/4] Minting 1000 USDC to each (collateral + first cycle)…");
  for (const [name, addr] of [["Alice", alice.address], ["Bob", bob.address]] as const) {
    const tx = await wOp.writeContract({
      address: deployed.MockUSDC,
      abi: MOCK_USDC_ABI,
      functionName: "mint",
      args: [addr, parseUnits("1000", 6)],
    });
    await send(`mint to ${name}`, tx);
  }

  // Step 3: each member approves KitpotCircle for USDC
  console.log("\n[3/4] Approving KitpotCircle for unlimited USDC spend…");
  for (const [name, wal] of [["Alice", wAlice], ["Bob", wBob]] as const) {
    const tx = await wal.writeContract({
      address: deployed.MockUSDC,
      abi: MOCK_USDC_ABI,
      functionName: "approve",
      args: [deployed.KitpotCircle, maxUint256],
    });
    await send(`approve from ${name}`, tx);
  }

  // Step 4: each calls joinCircle
  // Pass truncated wallet address as initUsername — NOT a fake "alice.init"
  // string. The contract only requires `bytes(initUsername).length > 0`; the
  // actual .init resolution happens via Initia L1 registry (useUsernameQuery)
  // in the UI, so passing fake `.init` strings here would mislead viewers.
  console.log(`\n[4/4] Joining circle #${circleId}…`);
  for (const [name, wal, addr] of [
    ["Alice", wAlice, alice.address],
    ["Bob", wBob, bob.address],
  ] as const) {
    const displayName = `${addr.slice(0, 6)}…${addr.slice(-4)}`;
    const tx = await wal.writeContract({
      address: deployed.KitpotCircle,
      abi: KITPOT_ABI,
      functionName: "joinCircle",
      args: [circleId, displayName],
    });
    await send(`${name} joins as "${displayName}"`, tx);
  }

  console.log("\n✅ Done. Circle should now be Active (3/3 members).");
  console.log(`   View: https://kitpot.vercel.app/circles/${circleId}\n`);
}

main().catch((e) => {
  console.error("\n❌ Failed:", e?.message ?? e);
  process.exit(1);
});
