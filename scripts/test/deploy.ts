import { getPublicClient, getWalletClient, getAccount, RPC } from "./config";
import { writeFileSync } from "fs";
import { join } from "path";

// Import ABIs from the frontend (they're already written)
const MockUSDC_BYTECODE = "placeholder"; // Will use forge create instead

async function main() {
  console.log("=== Deploying Kitpot Contracts to Anvil ===\n");

  const { execSync } = await import("child_process");
  const contractsDir = join(import.meta.dir, "../../contracts");

  const deployerKey = process.env.PRIVATE_KEY;
  if (!deployerKey) throw new Error("PRIVATE_KEY env var not set. Run: export PRIVATE_KEY=<your-anvil-key>");

  // Deploy via forge script
  console.log("Running forge deploy script...\n");

  const output = execSync(
    `forge script script/Deploy.s.sol --rpc-url ${RPC} --broadcast --private-key ${deployerKey} -v`,
    { cwd: contractsDir, encoding: "utf-8", env: { ...process.env, PRIVATE_KEY: deployerKey } }
  );

  console.log(output);

  // Parse addresses from broadcast
  const broadcastDir = join(contractsDir, "broadcast/Deploy.s.sol/31337/run-latest.json");
  const broadcast = JSON.parse(require("fs").readFileSync(broadcastDir, "utf-8"));

  const addresses: Record<string, string> = {};
  const contractNames = ["MockUSDC", "KitpotReputation", "KitpotAchievements", "KitpotCircle"];

  for (const tx of broadcast.transactions) {
    if (tx.transactionType === "CREATE" && tx.contractName) {
      addresses[tx.contractName] = tx.contractAddress;
      console.log(`${tx.contractName}: ${tx.contractAddress}`);
    }
  }

  // Save to .deployed.json
  const deployedPath = join(import.meta.dir, ".deployed.json");
  writeFileSync(deployedPath, JSON.stringify(addresses, null, 2));
  console.log(`\nSaved to ${deployedPath}`);

  // Print .env.local snippet
  console.log("\n=== Copy to apps/web/.env.local ===");
  console.log(`NEXT_PUBLIC_KITPOT_RPC_URL=${RPC}`);
  console.log(`NEXT_PUBLIC_KITPOT_CHAIN_ID=31337`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${addresses.KitpotCircle}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${addresses.MockUSDC}`);
  console.log(`NEXT_PUBLIC_REPUTATION_ADDRESS=${addresses.KitpotReputation}`);
  console.log(`NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS=${addresses.KitpotAchievements}`);
}

main().catch(console.error);
