import { getPublicClient, getWalletClient, ACCOUNTS, loadDeployed } from "./config";
import { KITPOT_ABI } from "../../apps/web/src/lib/abi/KitpotCircle";

const circleId = BigInt(process.argv.find(a => a.startsWith("--circle="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--circle") + 1] ?? "0");
const accountIdx = parseInt(process.argv.find(a => a.startsWith("--account="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--account") + 1] ?? "1");
const username = process.argv.find(a => a.startsWith("--username="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--username") + 1] ?? `user${accountIdx}.init`;

async function main() {
  const deployed = loadDeployed();
  const publicClient = getPublicClient();
  const wallet = getWalletClient(accountIdx);
  const contractAddr = deployed.KitpotCircle as `0x${string}`;

  console.log(`${ACCOUNTS[accountIdx].name} joining Circle ${circleId} as "${username}"...`);

  const hash = await wallet.writeContract({
    address: contractAddr,
    abi: KITPOT_ABI,
    functionName: "joinCircle",
    args: [circleId, username],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Joined! Tx: ${receipt.transactionHash}`);
}

main().catch(console.error);
