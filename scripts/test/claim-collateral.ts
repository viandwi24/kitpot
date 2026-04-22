import { getPublicClient, getWalletClient, ACCOUNTS, loadDeployed } from "./config";
import { KITPOT_ABI } from "../../apps/web/src/lib/abi/KitpotCircle";

const circleId = BigInt(process.argv.find(a => a.startsWith("--circle="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--circle") + 1] ?? "0");

async function main() {
  const deployed = loadDeployed();
  const publicClient = getPublicClient();
  const contractAddr = deployed.KitpotCircle as `0x${string}`;

  console.log(`=== Claiming collateral for Circle ${circleId} ===\n`);

  for (let i = 0; i < 3; i++) {
    const wallet = getWalletClient(i);
    try {
      const hash = await wallet.writeContract({
        address: contractAddr,
        abi: KITPOT_ABI,
        functionName: "claimCollateral",
        args: [circleId],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`${ACCOUNTS[i].name}: claimed ✓`);
    } catch (e: any) {
      const msg = e.shortMessage ?? e.message;
      console.log(`${ACCOUNTS[i].name}: skipped (${msg})`);
    }
  }
}

main().catch(console.error);
