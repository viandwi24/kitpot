import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";

const key = process.env.ACCOUNT_0;
if (!key) throw new Error("ACCOUNT_0 env var not set");
const funder = privateKeyToAccount(key as `0x${string}`);
const target = "0x333821126889C22821F355dE3b384534b9b8ACb6" as const;

const walletClient = createWalletClient({
  account: funder,
  chain: anvil,
  transport: http("http://localhost:8545"),
});

const publicClient = createPublicClient({
  chain: anvil,
  transport: http("http://localhost:8545"),
});

const before = await publicClient.getBalance({ address: target });
console.log("Before:", before.toString(), "wei");

const hash = await walletClient.sendTransaction({
  to: target,
  value: parseEther("10"),
});
console.log("TX hash:", hash);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log("Status:", receipt.status);

const after = await publicClient.getBalance({ address: target });
console.log("After:", (Number(after) / 1e18).toFixed(4), "ETH");
