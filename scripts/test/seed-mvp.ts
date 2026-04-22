import { parseUnits } from "viem";
import { getPublicClient, getWalletClient, getAccount, ACCOUNTS, loadDeployed } from "./config";
import { MOCK_USDC_ABI } from "../../apps/web/src/lib/abi/MockUSDC";
import { KITPOT_ABI } from "../../apps/web/src/lib/abi/KitpotCircle";

async function main() {
  const deployed = loadDeployed();
  const publicClient = getPublicClient();

  console.log("=== Seeding MVP Test Data ===\n");

  // Mint 10,000 USDC to each of the first 3 accounts
  for (let i = 0; i < 3; i++) {
    const wallet = getWalletClient(i);
    const account = getAccount(i);
    const amount = parseUnits("10000", 6);

    const hash = await wallet.writeContract({
      address: deployed.MockUSDC as `0x${string}`,
      abi: MOCK_USDC_ABI,
      functionName: "mint",
      args: [account.address, amount],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    console.log(`Minted 10,000 USDC to ${ACCOUNTS[i].name} (${account.address})`);
  }

  // Approve KitpotCircle to spend USDC for each account
  for (let i = 0; i < 3; i++) {
    const wallet = getWalletClient(i);
    const maxApproval = parseUnits("1000000", 6); // 1M USDC

    const hash = await wallet.writeContract({
      address: deployed.MockUSDC as `0x${string}`,
      abi: MOCK_USDC_ABI,
      functionName: "approve",
      args: [deployed.KitpotCircle as `0x${string}`, maxApproval],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    console.log(`Approved KitpotCircle for ${ACCOUNTS[i].name}`);
  }

  console.log("\n=== Seed Complete ===");
  console.log("3 accounts ready with 10,000 USDC each, approvals set.");
  console.log("No circles created yet — do that via UI or scripts.");
}

main().catch(console.error);
