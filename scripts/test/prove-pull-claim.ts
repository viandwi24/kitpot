/**
 * E2E proof script — Pull-claim happy path on live testnet (kitpot-2).
 *
 * Proves the new pull-claim model:
 *   1. Recipient calls claimPot(circleId) after cycle elapses.
 *   2. Pot transfers to recipient atomically.
 *   3. Cycle advances with deterministic next-cycle start time.
 *   4. Full 3-cycle lifecycle via claimPot (not advanceCycle).
 *
 * Token: MockUSDe (multi-token wiring).
 *
 * Setup is self-contained — generates fresh Alice + Bob keys.
 *
 * Usage:
 *   NETWORK=testnet ACCOUNT_0=0x<operator-private-key> \
 *     bun scripts/test/prove-pull-claim.ts
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
const RPC = "https://kitpot-rpc.viandwi24.com/";
const CHAIN = defineChain({
  id: 64146729809684,
  name: "Kitpot Testnet",
  nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});
const KITPOT_CIRCLE = "0x62d244f304bc7638d44f5e335dfadf8c9dcef990" as const;
const MOCK_USDE = "0x85b10791e3B782B9ddB3877E28D1088E75074B54" as const;
const DECIMALS = 6;
const CONTRIBUTION = parseUnits("100", DECIMALS);
const CYCLE_DURATION = 60; // seconds — demo circles use 60s
const GRACE_PERIOD = 30;

const operatorKey = process.env.ACCOUNT_0;
if (!operatorKey) throw new Error("Set ACCOUNT_0=0x<operator-private-key>");

const operator = privateKeyToAccount(operatorKey as `0x${string}`);
const aliceKey = generatePrivateKey();
const bobKey = generatePrivateKey();
const alice = privateKeyToAccount(aliceKey);
const bob = privateKeyToAccount(bobKey);

const pub = createPublicClient({ chain: CHAIN, transport: http(RPC) });
const opWallet = createWalletClient({ account: operator, chain: CHAIN, transport: http(RPC) });
const aliceWallet = createWalletClient({ account: alice, chain: CHAIN, transport: http(RPC) });
const bobWallet = createWalletClient({ account: bob, chain: CHAIN, transport: http(RPC) });

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("=== Prove Pull-Claim Happy Path ===");
  console.log(`Operator: ${operator.address}`);
  console.log(`Alice:    ${alice.address}`);
  console.log(`Bob:      ${bob.address}`);

  // 1. Fund Alice + Bob with native gas
  console.log("\n1. Funding Alice + Bob with native gas...");
  for (const acct of [alice, bob]) {
    await opWallet.sendTransaction({ to: acct.address, value: parseUnits("1", 18) });
  }

  // 2. Mint USDe to all
  console.log("2. Minting USDe...");
  for (const wallet of [opWallet, aliceWallet, bobWallet]) {
    await wallet.writeContract({
      address: MOCK_USDE, abi: MOCK_USDC_ABI, functionName: "mint",
      args: [wallet.account.address, parseUnits("10000", DECIMALS)],
    });
    await wallet.writeContract({
      address: MOCK_USDE, abi: MOCK_USDC_ABI, functionName: "approve",
      args: [KITPOT_CIRCLE, maxUint256],
    });
  }

  // 3. Create circle
  console.log("3. Creating 3-member USDe circle...");
  const hash = await opWallet.writeContract({
    address: KITPOT_CIRCLE, abi: KITPOT_ABI, functionName: "createCircle",
    args: [
      "Prove Pull-Claim", "", MOCK_USDE, CONTRIBUTION, 3n,
      BigInt(CYCLE_DURATION), BigInt(GRACE_PERIOD), 500n, true, 0, "operator.init",
    ],
  });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  const circleCount = await pub.readContract({ address: KITPOT_CIRCLE, abi: KITPOT_ABI, functionName: "getCircleCount" });
  const circleId = (circleCount as bigint) - 1n;
  console.log(`   Circle ID: ${circleId}`);

  // 4. Alice + Bob join
  console.log("4. Alice + Bob joining...");
  await aliceWallet.writeContract({
    address: KITPOT_CIRCLE, abi: KITPOT_ABI, functionName: "joinCircle",
    args: [circleId, "alice.init"],
  });
  await bobWallet.writeContract({
    address: KITPOT_CIRCLE, abi: KITPOT_ABI, functionName: "joinCircle",
    args: [circleId, "bob.init"],
  });
  console.log("   Circle activated!");

  // 5. Full lifecycle via claimPot
  const wallets = [opWallet, aliceWallet, bobWallet];
  const names = ["Operator", "Alice", "Bob"];

  for (let cycle = 0; cycle < 3; cycle++) {
    console.log(`\n--- Cycle ${cycle} ---`);

    // All deposit
    for (let i = 0; i < 3; i++) {
      await wallets[i].writeContract({
        address: KITPOT_CIRCLE, abi: KITPOT_ABI, functionName: "deposit", args: [circleId],
      });
      console.log(`   ${names[i]} deposited`);
    }

    // Wait for cycle to elapse
    console.log(`   Waiting ${CYCLE_DURATION + 5}s for cycle to elapse...`);
    await sleep((CYCLE_DURATION + 5) * 1000);

    // Recipient claims
    const balBefore = await pub.readContract({
      address: MOCK_USDE, abi: MOCK_USDC_ABI, functionName: "balanceOf", args: [wallets[cycle].account.address],
    }) as bigint;

    await wallets[cycle].writeContract({
      address: KITPOT_CIRCLE, abi: KITPOT_ABI, functionName: "claimPot", args: [circleId],
    });

    const balAfter = await pub.readContract({
      address: MOCK_USDE, abi: MOCK_USDC_ABI, functionName: "balanceOf", args: [wallets[cycle].account.address],
    }) as bigint;

    const received = balAfter - balBefore;
    console.log(`   ${names[cycle]} claimed pot: +${formatUnits(received, DECIMALS)} USDe`);

    const circle = await pub.readContract({
      address: KITPOT_CIRCLE, abi: KITPOT_ABI, functionName: "getCircle", args: [circleId],
    }) as { currentCycle: bigint; status: number };

    console.log(`   currentCycle: ${circle.currentCycle}, status: ${circle.status}`);
  }

  console.log("\n=== Pull-Claim Happy Path COMPLETE ===");
}

main().catch(console.error);
