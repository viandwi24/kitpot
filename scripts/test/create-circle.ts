import { parseUnits } from "viem";
import { getPublicClient, getWalletClient, getAccount, loadDeployed } from "./config";
import { KITPOT_ABI } from "../../apps/web/src/lib/abi/KitpotCircle";

// Args: --account 0 --name "Alumni Savings" --contribution 100 --members 3 --duration 60
const args = process.argv.slice(2);
const get = (flag: string, def: string) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};

async function main() {
  const deployed = loadDeployed();
  const publicClient = getPublicClient();
  const accountIdx = parseInt(get("--account", "0"));
  const name = get("--name", "Alumni Savings");
  const description = get("--description", "Monthly savings for demo");
  const contribution = get("--contribution", "100");
  const members = get("--members", "3");
  const duration = get("--duration", "60");   // seconds
  const gracePeriod = get("--grace", "30");   // seconds
  const isPublic = get("--public", "true") === "true";
  const minimumTier = parseInt(get("--tier", "0"));

  const wallet = getWalletClient(accountIdx);
  const account = getAccount(accountIdx);

  console.log(`=== Creating Circle ===`);
  console.log(`Creator: ${account.address}`);
  console.log(`Name: ${name}, ${members} members, ${contribution} USDC/cycle, ${duration}s cycles\n`);

  const hash = await wallet.writeContract({
    address: deployed.KitpotCircle as `0x${string}`,
    abi: KITPOT_ABI,
    functionName: "createCircle",
    args: [
      name,
      description,
      deployed.MockUSDC as `0x${string}`,
      parseUnits(contribution, 6),
      BigInt(members),
      BigInt(duration),
      BigInt(gracePeriod),
      500n,        // 5% late penalty in bps
      isPublic,
      minimumTier,
    ],
  });

  console.log(`Tx: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Confirmed in block ${receipt.blockNumber}`);

  // Get the circle ID from logs or just read state
  console.log(`\nCircle created! Check /circles/0 in the UI.`);
}

main().catch(console.error);
