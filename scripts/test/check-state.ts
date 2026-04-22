import { formatUnits } from "viem";
import { getPublicClient, getAccount, ACCOUNTS, loadDeployed } from "./config";
import { KITPOT_ABI } from "../../apps/web/src/lib/abi/KitpotCircle";
import { MOCK_USDC_ABI } from "../../apps/web/src/lib/abi/MockUSDC";
import { REPUTATION_ABI } from "../../apps/web/src/lib/abi/KitpotReputation";

const circleId = BigInt(process.argv.find(a => a.startsWith("--circle="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--circle") + 1] ?? "0");

const TIER_NAMES = ["Unranked", "Bronze", "Silver", "Gold", "Diamond"];
const STATUS_NAMES = ["Forming", "Active", "Completed"];

async function main() {
  const deployed = loadDeployed();
  const client = getPublicClient();
  const kitpot = deployed.KitpotCircle as `0x${string}`;
  const usdc = deployed.MockUSDC as `0x${string}`;
  const reputation = deployed.KitpotReputation as `0x${string}`;

  // Read circle
  const circle = await client.readContract({
    address: kitpot, abi: KITPOT_ABI, functionName: "getCircle", args: [circleId],
  }) as any;

  const members = await client.readContract({
    address: kitpot, abi: KITPOT_ABI, functionName: "getMembers", args: [circleId],
  }) as any[];

  console.log(`=== Circle ${circleId}: ${circle.name} ===`);
  console.log(`Status: ${STATUS_NAMES[circle.status]}`);
  console.log(`Members: ${circle.memberCount}/${circle.maxMembers}`);
  console.log(`Cycles: ${circle.currentCycle}/${circle.totalCycles}`);
  console.log(`Contribution: ${formatUnits(circle.contributionAmount, 6)} USDC`);
  console.log(`Cycle Duration: ${circle.cycleDuration}s`);
  console.log();

  // Payment status per cycle
  console.log("=== Payments ===");
  for (const member of members) {
    const name = member.initUsername || member.addr.slice(0, 10);
    let line = `${name.padEnd(15)}`;
    for (let c = 0; c < Number(circle.currentCycle); c++) {
      const paid = await client.readContract({
        address: kitpot, abi: KITPOT_ABI, functionName: "hasPaid",
        args: [circleId, BigInt(c), member.addr],
      });
      line += ` Cycle ${c + 1}: ${paid ? "✓" : "✗"} `;
    }
    console.log(line);
  }
  console.log();

  // Collateral
  console.log("=== Collateral ===");
  for (const member of members) {
    const name = member.initUsername || member.addr.slice(0, 10);
    const collateral = await client.readContract({
      address: kitpot, abi: KITPOT_ABI, functionName: "getCollateral",
      args: [circleId, member.addr],
    }) as bigint;
    const claimable = circle.status === 2 && collateral > 0n;
    console.log(`${name.padEnd(15)} ${formatUnits(collateral, 6)} USDC${claimable ? " (claimable)" : ""}`);
  }
  console.log();

  // Reputation
  console.log("=== Reputation ===");
  for (const member of members) {
    const name = member.initUsername || member.addr.slice(0, 10);
    const rep = await client.readContract({
      address: reputation, abi: REPUTATION_ABI, functionName: "getReputation",
      args: [member.addr],
    }) as any;
    console.log(`${name.padEnd(15)} ${rep.totalCirclesCompleted} completed, ${rep.totalCyclesOnTime}/${Number(rep.totalCyclesOnTime) + Number(rep.totalCyclesMissed)} on-time, streak: ${rep.consecutiveOnTime}, tier: ${TIER_NAMES[rep.tier]}`);
  }
  console.log();

  // USDC balances
  console.log("=== USDC Balances ===");
  for (const member of members) {
    const name = member.initUsername || member.addr.slice(0, 10);
    const balance = await client.readContract({
      address: usdc, abi: MOCK_USDC_ABI, functionName: "balanceOf",
      args: [member.addr],
    }) as bigint;
    console.log(`${name.padEnd(15)} ${formatUnits(balance, 6)} USDC`);
  }

  const contractBalance = await client.readContract({
    address: usdc, abi: MOCK_USDC_ABI, functionName: "balanceOf",
    args: [kitpot],
  }) as bigint;
  console.log(`${"Contract".padEnd(15)} ${formatUnits(contractBalance, 6)} USDC`);

  // Platform fees
  const fees = await client.readContract({
    address: kitpot, abi: KITPOT_ABI, functionName: "accumulatedFees",
    args: [usdc],
  }) as bigint;
  console.log(`\nPlatform fees: ${formatUnits(fees, 6)} USDC`);
}

main().catch(console.error);
