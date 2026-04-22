import { parseUnits } from "viem";
import { getPublicClient, getWalletClient, getAccount, ACCOUNTS, loadDeployed } from "./config";
import { MOCK_USDC_ABI } from "../../apps/web/src/lib/abi/MockUSDC";

const accountIdx = parseInt(process.argv.find(a => a.startsWith("--account="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--account") + 1] ?? "0");
const amount = process.argv.find(a => a.startsWith("--amount="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--amount") + 1] ?? "10000";

async function main() {
  const deployed = loadDeployed();
  const publicClient = getPublicClient();
  const wallet = getWalletClient(0); // anyone can mint
  const account = getAccount(accountIdx);

  const parsedAmount = parseUnits(amount, 6);

  const hash = await wallet.writeContract({
    address: deployed.MockUSDC as `0x${string}`,
    abi: MOCK_USDC_ABI,
    functionName: "mint",
    args: [account.address, parsedAmount],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Minted ${amount} USDC to ${ACCOUNTS[accountIdx].name} (${account.address})`);
}

main().catch(console.error);
