import { parseUnits, formatUnits } from "viem";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { MOCK_USDC_ABI } from "../../apps/web/src/lib/abi/MockUSDC";

const deployed = require("./.deployed.json");
const USDC = deployed.MockUSDC as `0x${string}`;
const USER = "0x333821126889C22821F355dE3b384534b9b8ACb6" as `0x${string}`;

const creator = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
const pub = createPublicClient({ chain: foundry, transport: http("http://localhost:8545") });
const wc = createWalletClient({ account: creator, chain: foundry, transport: http("http://localhost:8545") });

const hash = await wc.writeContract({ address: USDC, abi: MOCK_USDC_ABI, functionName: "mint", args: [USER, parseUnits("5000", 6)] });
await pub.waitForTransactionReceipt({ hash });
const bal = await pub.readContract({ address: USDC, abi: MOCK_USDC_ABI, functionName: "balanceOf", args: [USER] }) as bigint;
console.log(`✅ Minted 5000 USDC → ${USER}`);
console.log(`   Balance: ${formatUnits(bal, 6)} USDC`);
