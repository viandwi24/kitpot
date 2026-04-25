import { NextRequest, NextResponse } from "next/server";
import { MnemonicKey, Wallet, MsgSend, RESTClient, Fee, Coins, AccAddress } from "@initia/initia.js";
import { createWalletClient, http, encodeFunctionData, type Account } from "viem";
import { mnemonicToAccount } from "viem/accounts";

/**
 * Gas Faucet — native Initia Cosmos x/bank MsgSend + EVM stablecoin mints.
 *
 * After GAS drip succeeds, mints 5,000 USDC + 5,000 USDe to the receiver
 * so they can immediately create/join circles without visiting the faucet page.
 */

const REST_URL = process.env.NEXT_PUBLIC_KITPOT_COSMOS_REST ?? "https://kitpot-rest.viandwi24.com";
const CHAIN_ID = process.env.NEXT_PUBLIC_KITPOT_COSMOS_CHAIN_ID ?? "kitpot-2";
const NATIVE_SYMBOL = process.env.NEXT_PUBLIC_KITPOT_NATIVE_SYMBOL ?? "GAS";
const JSON_RPC_URL = process.env.NEXT_PUBLIC_KITPOT_JSON_RPC ?? "https://kitpot-rpc.viandwi24.com";
const EVM_CHAIN_ID = Number(process.env.NEXT_PUBLIC_KITPOT_EVM_CHAIN_ID ?? "64146729809684");

const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "0x") as `0x${string}`;
const USDE_ADDRESS = (process.env.NEXT_PUBLIC_USDE_ADDRESS ?? "0x") as `0x${string}`;

// 5,000 tokens with 6 decimals = 5_000_000_000
const MINT_AMOUNT = 5_000_000_000n;

const DRIP_AMOUNT_RAW = "100000000";
const COOLDOWN_MS = 60 * 60 * 1000;

const claims = new Map<string, number>();

// Minimal mint ABI
const MINT_ABI = [
  {
    type: "function" as const,
    name: "mint" as const,
    inputs: [
      { name: "to", type: "address" as const },
      { name: "amount", type: "uint256" as const },
    ],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
] as const;

// Cache the viem wallet client at module scope
let cachedViemClient: ReturnType<typeof createWalletClient> | null = null;
let cachedViemAccount: Account | null = null;

const KITPOT_CHAIN = {
  id: EVM_CHAIN_ID,
  name: "Kitpot Testnet",
  nativeCurrency: { name: "GAS", symbol: "GAS", decimals: 18 },
  rpcUrls: { default: { http: [JSON_RPC_URL] } },
} as const;

function getViemClient(mnemonic: string) {
  if (cachedViemClient && cachedViemAccount) {
    return { client: cachedViemClient, account: cachedViemAccount };
  }
  const account = mnemonicToAccount(mnemonic, { path: "m/44'/60'/0'/0/0" });
  const client = createWalletClient({
    account,
    chain: KITPOT_CHAIN,
    transport: http(JSON_RPC_URL),
  });
  cachedViemClient = client;
  cachedViemAccount = account;
  return { client, account };
}

function hexToBech32(hex: string): string | null {
  try {
    const clean = hex.toLowerCase().replace(/^0x/, "");
    if (!/^[a-f0-9]{40}$/.test(clean)) return null;
    return AccAddress.fromHex(clean);
  } catch {
    return null;
  }
}

function bech32ToHex(bech32: string): `0x${string}` | null {
  try {
    const hex = AccAddress.toHex(bech32);
    return `0x${hex}` as `0x${string}`;
  } catch {
    return null;
  }
}

async function mintToken(
  client: ReturnType<typeof createWalletClient>,
  account: Account,
  tokenAddress: `0x${string}`,
  receiverHex: `0x${string}`,
): Promise<{ tx: string; amount: string } | { error: string }> {
  try {
    if (tokenAddress === "0x") return { error: "token address not configured" };
    const hash = await client.writeContract({
      address: tokenAddress,
      abi: MINT_ABI,
      functionName: "mint",
      args: [receiverHex, MINT_AMOUNT],
      chain: KITPOT_CHAIN,
      account,
    });
    return { tx: hash, amount: MINT_AMOUNT.toString() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[gas-faucet] mint failed for ${tokenAddress}:`, message);
    return { error: message.slice(0, 200) };
  }
}

export async function POST(req: NextRequest) {
  const mnemonic = process.env.FAUCET_MNEMONIC;
  if (!mnemonic) {
    return NextResponse.json(
      { error: "faucet not configured (FAUCET_MNEMONIC missing)" },
      { status: 500 },
    );
  }

  let body: { address?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const inputAddr = body.address?.trim();
  if (!inputAddr) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  // Accept either hex (0x...) or bech32 (init1...)
  const receiverBech32 = inputAddr.startsWith("0x") ? hexToBech32(inputAddr) : inputAddr;
  if (!receiverBech32 || !receiverBech32.startsWith("init1")) {
    return NextResponse.json({ error: "invalid address format" }, { status: 400 });
  }

  const cooldownKey = receiverBech32.toLowerCase();
  const last = claims.get(cooldownKey) ?? 0;
  const elapsed = Date.now() - last;
  if (elapsed < COOLDOWN_MS) {
    return NextResponse.json(
      { error: "rate limited", retryAfterSec: Math.ceil((COOLDOWN_MS - elapsed) / 1000) },
      { status: 429 },
    );
  }

  try {
    const rest = new RESTClient(REST_URL, { chainId: CHAIN_ID, gasPrices: `0${NATIVE_SYMBOL}` });
    // coinType 60 = Ethereum / ethsecp256k1 (matches Initia's EVM derivation)
    const key = new MnemonicKey({ mnemonic, coinType: 60 });
    const wallet = new Wallet(rest, key);

    const senderBech32 = key.accAddress;
    const amount = Coins.fromString(`${DRIP_AMOUNT_RAW}${NATIVE_SYMBOL}`);
    const msg = new MsgSend(senderBech32, receiverBech32, amount);

    const signedTx = await wallet.createAndSignTx({
      msgs: [msg],
      fee: new Fee(200000, `0${NATIVE_SYMBOL}`),
    });
    const result = await rest.tx.broadcast(signedTx);

    claims.set(cooldownKey, Date.now());

    // Mint stablecoins (best-effort, never blocks GAS drip response)
    const receiverHex = inputAddr.startsWith("0x")
      ? (inputAddr as `0x${string}`)
      : bech32ToHex(receiverBech32);

    let stablecoinMints: Record<string, { tx: string; amount: string } | { error: string }> = {};
    if (receiverHex) {
      const { client, account } = getViemClient(mnemonic);
      const [usdcResult, usdeResult] = await Promise.all([
        mintToken(client, account, USDC_ADDRESS, receiverHex),
        mintToken(client, account, USDE_ADDRESS, receiverHex),
      ]);
      stablecoinMints = { usdc: usdcResult, usde: usdeResult };
    }

    return NextResponse.json({
      hash: result.txhash,
      sender: senderBech32,
      receiver: receiverBech32,
      amount: DRIP_AMOUNT_RAW,
      denom: NATIVE_SYMBOL,
      stablecoinMints,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
