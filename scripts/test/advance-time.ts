import { getPublicClient, RPC } from "./config";

const seconds = parseInt(process.argv.find(a => a.startsWith("--seconds="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--seconds") + 1] ?? "60");

async function main() {
  // Anvil supports evm_increaseTime and evm_mine
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [seconds],
      id: 1,
    }),
  });
  await response.json();

  // Mine a block to apply the time change
  const mineResponse = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [],
      id: 2,
    }),
  });
  await mineResponse.json();

  const client = getPublicClient();
  const block = await client.getBlock();
  console.log(`Advanced ${seconds}s. Block timestamp: ${block.timestamp} (${new Date(Number(block.timestamp) * 1000).toISOString()})`);
}

main().catch(console.error);
