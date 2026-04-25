/**
 * E2E proof script — runs against live testnet (`kitpot-2`).
 *
 * Proves two flows the user explicitly asked about:
 *   1. Pot auto-distribution: when it's your turn, advanceCycle pushes pot
 *      directly to your wallet. No manual "withdraw" step needed.
 *   2. Late penalty: deposit past grace period → 5% of contribution deducted
 *      from collateral, captured by accumulatedFees.
 *
 * Token: MockUSDe (proves the new multi-token wiring also works end-to-end).
 *
 * Setup is self-contained — generates fresh Alice + Bob keys, funds them with
 * native gas from operator, mints USDe, approves circle. No pre-existing
 * ACCOUNT_1/ACCOUNT_2 env vars required (operator only).
 *
 * Usage:
 *   NETWORK=testnet ACCOUNT_0=0x<operator-private-key> \
 *     bun scripts/test/prove-pot-and-late.ts
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
const CONTRIBUTION = parseUnits("100", DECIMALS); // 100 USDe per cycle
const POT_TOTAL = CONTRIBUTION * 3n; // 3 members * 100 = 300
const FEE_BPS = 100n; // 1% platform fee per advanceCycle
const POT_PAYOUT = POT_TOTAL - (POT_TOTAL * FEE_BPS) / 10000n; // 297 USDe
const LATE_PENALTY_BPS = 500n; // 5% per missed cycle
const PENALTY_PER_LATE = (CONTRIBUTION * LATE_PENALTY_BPS) / 10000n; // 5 USDe

const operatorKey = process.env.ACCOUNT_0;
if (!operatorKey) throw new Error("Set ACCOUNT_0=0x<operator-private-key>");

const operator = privateKeyToAccount(operatorKey as `0x${string}`);
const aliceKey = generatePrivateKey();
const bobKey = generatePrivateKey();
const alice = privateKeyToAccount(aliceKey);
const bob = privateKeyToAccount(bobKey);

const pub = createPublicClient({ chain: CHAIN, transport: http(RPC) });
const w = (key: `0x${string}`) =>
  createWalletClient({ account: privateKeyToAccount(key), chain: CHAIN, transport: http(RPC) });
const wOp = w(operatorKey as `0x${string}`);
const wAlice = w(aliceKey);
const wBob = w(bobKey);

// ── Helpers ─────────────────────────────────────────────────────────────────
async function sleep(seconds: number, label: string) {
  process.stdout.write(`  ⏳  ${label} (${seconds}s)`);
  for (let i = 0; i < seconds; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    process.stdout.write(".");
  }
  process.stdout.write("\n");
}

async function balanceOf(addr: `0x${string}`): Promise<bigint> {
  return (await pub.readContract({
    address: MOCK_USDE,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: [addr],
  })) as bigint;
}

async function collateralBalance(circleId: bigint, member: `0x${string}`): Promise<bigint> {
  return (await pub.readContract({
    address: KITPOT_CIRCLE,
    abi: KITPOT_ABI,
    functionName: "collateralBalance",
    args: [circleId, member],
  })) as bigint;
}

async function send(label: string, hash: `0x${string}`) {
  const r = await pub.waitForTransactionReceipt({ hash });
  console.log(`  ✓ ${label} (block ${r.blockNumber}, gas ${r.gasUsed})`);
  return r;
}

function fmt(n: bigint): string {
  return formatUnits(n, DECIMALS) + " USDe";
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n========================================");
  console.log("  E2E PROOF — Pot Distribution + Late Penalty");
  console.log("  Live testnet kitpot-2 — token: MockUSDe");
  console.log("========================================\n");

  console.log("Operator: ", operator.address);
  console.log("Alice:    ", alice.address, "(fresh)");
  console.log("Bob:      ", bob.address, "(fresh)");
  console.log("");

  // ── Phase 1: Fund Alice + Bob with native GAS ────────────────────────────
  // Rollup gas_price = 0, so any non-zero balance is enough to send tx.
  // Auto-faucet drip is 1e8 raw units; we send 2e8 to be safe.
  const FUND_AMOUNT = 200_000_000n;
  console.log("[1/6] Funding Alice + Bob with native GAS (2e8 raw each)…");
  for (const [name, addr] of [["Alice", alice.address], ["Bob", bob.address]] as const) {
    const tx = await wOp.sendTransaction({
      to: addr,
      value: FUND_AMOUNT,
    });
    await send(`fund ${name}`, tx);
  }

  // ── Phase 2: Mint MockUSDe to Operator + Alice + Bob ─────────────────────
  console.log("\n[2/6] Minting 1000 MockUSDe to each member…");
  for (const [name, addr] of [
    ["Operator", operator.address],
    ["Alice", alice.address],
    ["Bob", bob.address],
  ] as const) {
    const tx = await wOp.writeContract({
      address: MOCK_USDE,
      abi: MOCK_USDC_ABI,
      functionName: "mint",
      args: [addr, parseUnits("1000", DECIMALS)],
    });
    await send(`mint to ${name}`, tx);
  }

  // ── Phase 3: Approve KitpotCircle for unlimited USDe spend ───────────────
  console.log("\n[3/6] Approving KitpotCircle for unlimited USDe…");
  for (const [name, wal] of [["Operator", wOp], ["Alice", wAlice], ["Bob", wBob]] as const) {
    const tx = await wal.writeContract({
      address: MOCK_USDE,
      abi: MOCK_USDC_ABI,
      functionName: "approve",
      args: [KITPOT_CIRCLE, maxUint256],
    });
    await send(`approve from ${name}`, tx);
  }

  // ── Phase 4: Operator creates USDe circle ────────────────────────────────
  console.log("\n[4/6] Creating USDe circle (3 members, 60s cycle, 30s grace, 5% late)…");

  const createTx = await wOp.writeContract({
    address: KITPOT_CIRCLE,
    abi: KITPOT_ABI,
    functionName: "createCircle",
    args: [
      "Proof Demo USDe Circle",
      "E2E proof of pot distribution + late penalty on USDe",
      MOCK_USDE,
      CONTRIBUTION,
      3n, // maxMembers
      60n, // cycleDuration
      30n, // gracePeriod
      LATE_PENALTY_BPS,
      true, // isPublic
      0, // minimumTier
      "operator.init",
    ],
  });
  const createReceipt = await send("createCircle (operator joins as member 0)", createTx);

  // First event from KITPOT_CIRCLE has circleId as the first indexed topic.
  const log = createReceipt.logs.find(
    (l) => l.address.toLowerCase() === KITPOT_CIRCLE.toLowerCase() && l.topics[1],
  );
  if (!log) throw new Error("Could not parse circleId from createCircle logs");
  const circleId = BigInt(log.topics[1]!);
  console.log(`  → Circle ID = ${circleId}`);

  // Alice joins → member 1
  const aliceJoinTx = await wAlice.writeContract({
    address: KITPOT_CIRCLE,
    abi: KITPOT_ABI,
    functionName: "joinCircle",
    args: [circleId, "alice.init"],
  });
  await send("Alice joins", aliceJoinTx);

  // Bob joins → member 2 (this triggers Active state since maxMembers reached)
  const bobJoinTx = await wBob.writeContract({
    address: KITPOT_CIRCLE,
    abi: KITPOT_ABI,
    functionName: "joinCircle",
    args: [circleId, "bob.init"],
  });
  await send("Bob joins (circle becomes Active)", bobJoinTx);

  // Snapshot starting balances after all collateral was paid by joining
  const opStart = await balanceOf(operator.address);
  const aliceStart = await balanceOf(alice.address);
  const bobStart = await balanceOf(bob.address);
  console.log(`  Balances after join (each paid ${fmt(CONTRIBUTION)} collateral):`);
  console.log(`    Operator: ${fmt(opStart)}`);
  console.log(`    Alice:    ${fmt(aliceStart)}`);
  console.log(`    Bob:      ${fmt(bobStart)}`);

  // ── Phase 5: PROOF A — Pot auto-distribution (cycle 0 happy path) ────────
  console.log("\n[5/6] PROOF A — Pot auto-distribution");
  console.log("  Cycle 0 — recipient = Operator (member 0)");
  console.log("  All 3 deposit on time, then advance, expect Operator gets pot.\n");

  for (const [name, wal] of [["Operator", wOp], ["Alice", wAlice], ["Bob", wBob]] as const) {
    const tx = await wal.writeContract({
      address: KITPOT_CIRCLE,
      abi: KITPOT_ABI,
      functionName: "deposit",
      args: [circleId],
    });
    await send(`${name} deposits cycle 0`, tx);
  }

  const opAfterDeposit = await balanceOf(operator.address);
  console.log(`  Operator balance after own deposit: ${fmt(opAfterDeposit)} (should = ${fmt(opStart - CONTRIBUTION)})`);

  // Wait for cycle to elapse (60s + buffer)
  await sleep(65, "Waiting 60s cycle duration");

  const advTx = await wOp.writeContract({
    address: KITPOT_CIRCLE,
    abi: KITPOT_ABI,
    functionName: "advanceCycle",
    args: [circleId],
  });
  await send("advanceCycle 0 (distributes pot to Operator)", advTx);

  const opPostPot = await balanceOf(operator.address);
  const opGain = opPostPot - opAfterDeposit;
  console.log(`\n  RESULT — Operator balance gain: ${fmt(opGain)}`);
  console.log(`  EXPECTED pot payout: ${fmt(POT_PAYOUT)} (totalPot ${fmt(POT_TOTAL)} − 1% fee)`);
  console.log(`  ${opGain === POT_PAYOUT ? "✅ PROOF A PASSED" : "❌ PROOF A FAILED — gain mismatch"}`);

  // ── Phase 6: PROOF B — Late penalty (cycle 1) ────────────────────────────
  console.log("\n[6/6] PROOF B — Late penalty");
  console.log("  Cycle 1 starts now. Wait past 30s grace, then deposit late → expect 5% from collateral.\n");

  // Capture collateral before
  const opCol0 = await collateralBalance(circleId, operator.address);
  const aliceCol0 = await collateralBalance(circleId, alice.address);
  const bobCol0 = await collateralBalance(circleId, bob.address);
  console.log(`  Collateral before late deposit:`);
  console.log(`    Operator: ${fmt(opCol0)}`);
  console.log(`    Alice:    ${fmt(aliceCol0)}`);
  console.log(`    Bob:      ${fmt(bobCol0)}`);

  await sleep(35, "Waiting past 30s grace period");

  console.log("\n  All 3 deposit (now late) — expect 5% collateral penalty each:");
  for (const [name, wal] of [["Operator", wOp], ["Alice", wAlice], ["Bob", wBob]] as const) {
    const tx = await wal.writeContract({
      address: KITPOT_CIRCLE,
      abi: KITPOT_ABI,
      functionName: "deposit",
      args: [circleId],
    });
    await send(`${name} deposits LATE`, tx);
  }

  const opCol1 = await collateralBalance(circleId, operator.address);
  const aliceCol1 = await collateralBalance(circleId, alice.address);
  const bobCol1 = await collateralBalance(circleId, bob.address);

  console.log(`\n  Collateral after late deposit:`);
  console.log(`    Operator: ${fmt(opCol1)}  (Δ ${fmt(opCol0 - opCol1)})`);
  console.log(`    Alice:    ${fmt(aliceCol1)}  (Δ ${fmt(aliceCol0 - aliceCol1)})`);
  console.log(`    Bob:      ${fmt(bobCol1)}  (Δ ${fmt(bobCol0 - bobCol1)})`);
  console.log(`  EXPECTED penalty per member: ${fmt(PENALTY_PER_LATE)}`);

  const opPenalty = opCol0 - opCol1;
  const alicePenalty = aliceCol0 - aliceCol1;
  const bobPenalty = bobCol0 - bobCol1;
  const allMatch =
    opPenalty === PENALTY_PER_LATE &&
    alicePenalty === PENALTY_PER_LATE &&
    bobPenalty === PENALTY_PER_LATE;

  console.log(`\n  ${allMatch ? "✅ PROOF B PASSED" : "❌ PROOF B FAILED — penalty mismatch"}`);

  // ── Wrap-up ──────────────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log("  Summary");
  console.log("========================================");
  console.log(`  Circle ID: ${circleId}`);
  console.log(`  PROOF A — pot auto-distribution: ${opGain === POT_PAYOUT ? "PASS" : "FAIL"}`);
  console.log(`  PROOF B — late penalty applied:  ${allMatch ? "PASS" : "FAIL"}`);
  console.log(`\n  View on UI: https://kitpot.vercel.app/circles/${circleId}`);
  console.log("");
}

main().catch((e) => {
  console.error("\n❌ Script failed:", e?.message ?? e);
  process.exit(1);
});
