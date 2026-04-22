/**
 * E2E test helper for simulating other circle members.
 *
 * Usage:
 *   bun scripts/test/e2e-others.ts setup   --circle=<id>   # Alice+Bob join circle
 *   bun scripts/test/e2e-others.ts pay     --circle=<id>   # Alice+Bob pay contributions
 *   bun scripts/test/e2e-others.ts advance --circle=<id>   # Advance time + trigger cycle
 *   bun scripts/test/e2e-others.ts state   --circle=<id>   # Print circle state
 */

import { parseUnits, formatUnits, maxUint256 } from "viem";
import { getPublicClient, getWalletClient, ACCOUNTS, loadDeployed } from "./config";
import { KITPOT_ABI } from "../../apps/web/src/lib/abi/KitpotCircle";
import { MOCK_USDC_ABI } from "../../apps/web/src/lib/abi/MockUSDC";

const cmd = process.argv[2] ?? "state";
const circleId = BigInt(
  process.argv.find((a) => a.startsWith("--circle="))?.split("=")[1] ?? "0"
);

// Alice = index 1, Bob = index 2
const OTHER_ACCOUNTS = [1, 2] as const;

async function mintAndApprove(accountIdx: number, usdcAddr: `0x${string}`, circleAddr: `0x${string}`) {
  const pub = getPublicClient();
  const creator = getWalletClient(0);
  const wallet = getWalletClient(accountIdx);
  const name = ACCOUNTS[accountIdx].name;

  // mint 10_000 USDC
  const mintHash = await creator.writeContract({
    address: usdcAddr,
    abi: MOCK_USDC_ABI,
    functionName: "mint",
    args: [wallet.account.address, parseUnits("10000", 6)],
  });
  await pub.waitForTransactionReceipt({ hash: mintHash });

  // max approve circle contract
  const approveHash = await wallet.writeContract({
    address: usdcAddr,
    abi: MOCK_USDC_ABI,
    functionName: "approve",
    args: [circleAddr, maxUint256],
  });
  await pub.waitForTransactionReceipt({ hash: approveHash });
  console.log(`  ${name}: minted 10k USDC + approved circle contract ✓`);
}

async function setup() {
  const deployed = loadDeployed();
  const usdcAddr = deployed.MockUSDC as `0x${string}`;
  const circleAddr = deployed.KitpotCircle as `0x${string}`;
  const pub = getPublicClient();

  console.log(`\n=== SETUP: Alice & Bob joining Circle #${circleId} ===\n`);

  for (const idx of OTHER_ACCOUNTS) {
    await mintAndApprove(idx, usdcAddr, circleAddr);

    const wallet = getWalletClient(idx);
    const name = ACCOUNTS[idx].name;
    const username = `${name.toLowerCase()}.init`;

    const hash = await wallet.writeContract({
      address: circleAddr,
      abi: KITPOT_ABI,
      functionName: "joinCircle",
      args: [circleId, username],
    });
    const receipt = await pub.waitForTransactionReceipt({ hash });
    console.log(`  ${name}: joined as "${username}" — tx ${receipt.transactionHash.slice(0, 18)}...`);
  }

  console.log("\n✅ Both members joined. Circle should auto-start once you (the creator) have also deposited collateral.\n");
  await printState();
}

async function pay() {
  const deployed = loadDeployed();
  const circleAddr = deployed.KitpotCircle as `0x${string}`;
  const pub = getPublicClient();

  console.log(`\n=== PAY: Alice & Bob contributing to Circle #${circleId} ===\n`);

  for (const idx of OTHER_ACCOUNTS) {
    const wallet = getWalletClient(idx);
    const name = ACCOUNTS[idx].name;

    try {
      const hash = await wallet.writeContract({
        address: circleAddr,
        abi: KITPOT_ABI,
        functionName: "deposit",
        args: [circleId],
      });
      const receipt = await pub.waitForTransactionReceipt({ hash });
      console.log(`  ${name}: paid contribution ✓ tx ${receipt.transactionHash.slice(0, 18)}...`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  ${name}: skipped (${msg.split("(")[0].trim()})`);
    }
  }

  console.log("");
  await printState();
}

async function advance() {
  const deployed = loadDeployed();
  const circleAddr = deployed.KitpotCircle as `0x${string}`;
  const pub = getPublicClient();
  const creator = getWalletClient(0);

  console.log(`\n=== ADVANCE: Advancing time and processing cycle #${circleId} ===\n`);

  // advance time by 120s (past 60s demo cycle)
  await fetch("http://localhost:8545", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "evm_increaseTime", params: [120], id: 1 }),
  });
  await fetch("http://localhost:8545", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "evm_mine", params: [], id: 2 }),
  });
  console.log("  ⏱  Time advanced 120s + mined block");

  try {
    const hash = await creator.writeContract({
      address: circleAddr,
      abi: KITPOT_ABI,
      functionName: "advanceCycle",
      args: [circleId],
    });
    const receipt = await pub.waitForTransactionReceipt({ hash });
    console.log(`  advanceCycle ✓ tx ${receipt.transactionHash.slice(0, 18)}...`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  advanceCycle: ${msg.split("(")[0].trim()}`);
  }

  console.log("");
  await printState();
}

async function printState() {
  const deployed = loadDeployed();
  const circleAddr = deployed.KitpotCircle as `0x${string}`;
  const usdcAddr = deployed.MockUSDC as `0x${string}`;
  const pub = getPublicClient();

  const circle = await pub.readContract({
    address: circleAddr,
    abi: KITPOT_ABI,
    functionName: "getCircle",
    args: [circleId],
  }) as any;

  const statusMap: Record<number, string> = { 0: "Pending", 1: "Active", 2: "Completed", 3: "Cancelled" };

  console.log(`--- Circle #${circleId} State ---`);
  console.log(`  Name:         ${circle.name}`);
  console.log(`  Status:       ${statusMap[circle.status] ?? circle.status}`);
  console.log(`  Members:      ${circle.memberCount}/${circle.maxMembers}`);
  console.log(`  Current Cycle:${circle.currentCycle}/${circle.maxMembers}`);
  console.log(`  Contribution: ${formatUnits(circle.contributionAmount, 6)} USDC`);

  // balances
  const contractBalance = await pub.readContract({
    address: usdcAddr,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: [circleAddr],
  }) as bigint;
  console.log(`  Contract USDC: ${formatUnits(contractBalance, 6)}`);

  // Alice & Bob balances
  for (const idx of OTHER_ACCOUNTS) {
    const wallet = getWalletClient(idx);
    const bal = await pub.readContract({
      address: usdcAddr,
      abi: MOCK_USDC_ABI,
      functionName: "balanceOf",
      args: [wallet.account.address],
    }) as bigint;
    console.log(`  ${ACCOUNTS[idx].name} USDC: ${formatUnits(bal, 6)}`);
  }
  console.log("---");
}

async function main() {
  switch (cmd) {
    case "setup":   await setup();   break;
    case "pay":     await pay();     break;
    case "advance": await advance(); break;
    case "state":   await printState(); break;
    default:
      console.log("Unknown command. Use: setup | pay | advance | state");
  }
}

main().catch(console.error);
