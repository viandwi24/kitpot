import { getPublicClient, getWalletClient, ACCOUNTS, loadDeployed } from "./config";
import { KITPOT_ABI } from "../../apps/web/src/lib/abi/KitpotCircle";

const circleId = BigInt(process.argv.find(a => a.startsWith("--circle="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--circle") + 1] ?? "0");

async function main() {
  const deployed = loadDeployed();
  const publicClient = getPublicClient();
  const contractAddr = deployed.KitpotCircle as `0x${string}`;

  console.log(`=== Depositing for all members in Circle ${circleId} ===\n`);

  for (let i = 0; i < 3; i++) {
    const wallet = getWalletClient(i);

    try {
      const hash = await wallet.writeContract({
        address: contractAddr,
        abi: KITPOT_ABI,
        functionName: "deposit",
        args: [circleId],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`${ACCOUNTS[i].name}: deposited ✓`);
    } catch (e: any) {
      const msg = e.message?.includes("Already paid") ? "already paid" : e.shortMessage ?? e.message;
      console.log(`${ACCOUNTS[i].name}: skipped (${msg})`);
    }
  }
}

main().catch(console.error);
