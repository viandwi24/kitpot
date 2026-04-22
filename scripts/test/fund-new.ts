import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import { readFileSync } from "fs";
import { join } from "path";

const deployed = JSON.parse(readFileSync(join(import.meta.dir, ".deployed.json"), "utf-8"));
const usdcAddr = deployed.MockUSDC as `0x${string}`;

const MOCK_USDC_ABI = [
  { type: "function", name: "mint", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

const deployer = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
const target = "0x333821126889C22821F355dE3b384534b9b8ACb6" as const;

const wallet = createWalletClient({ account: deployer, chain: anvil, transport: http("http://localhost:8545") });
const pub = createPublicClient({ chain: anvil, transport: http("http://localhost:8545") });

const hash = await wallet.writeContract({ address: usdcAddr, abi: MOCK_USDC_ABI, functionName: "mint", args: [target, parseUnits("5000", 6)] });
await pub.waitForTransactionReceipt({ hash });

const bal = await pub.readContract({ address: usdcAddr, abi: MOCK_USDC_ABI, functionName: "balanceOf", args: [target] });
console.log("User USDC balance:", Number(bal) / 1e6, "USDC on new contract");
