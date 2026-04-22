import { getPublicClient, getWalletClient, loadDeployed } from "./config";
import { KITPOT_ABI } from "../../apps/web/src/lib/abi/KitpotCircle";

const circleId = BigInt(process.argv.find(a => a.startsWith("--circle="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--circle") + 1] ?? "0");

async function main() {
  const deployed = loadDeployed();
  const publicClient = getPublicClient();
  const wallet = getWalletClient(0); // anyone can call advanceCycle
  const contractAddr = deployed.KitpotCircle as `0x${string}`;

  console.log(`Advancing cycle for Circle ${circleId}...`);

  const hash = await wallet.writeContract({
    address: contractAddr,
    abi: KITPOT_ABI,
    functionName: "advanceCycle",
    args: [circleId],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Cycle advanced. Tx: ${receipt.transactionHash}`);
  console.log(`Gas used: ${receipt.gasUsed}`);
}

main().catch(console.error);
