import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, parseEther, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Gas Faucet — solves the bootstrap gas problem for judges.
 *
 * A freshly-connected Privy wallet has zero balance on the kitpot-2 rollup.
 * Every user-facing action (approveUSDC, joinCircle, deposit, autoSign.enable)
 * is a transaction that requires gas. Without this endpoint, the first tap
 * on any button would fail with "insufficient funds for gas".
 *
 * This route is called automatically from the frontend when a wallet connects
 * (via use-gas-faucet hook). It sends 0.01 GAS from the faucet wallet to the
 * requested address — enough for ~100 txs at the rollup's near-zero gas price.
 *
 * Security model:
 * - FAUCET_PRIVATE_KEY is server-only (no NEXT_PUBLIC_ prefix)
 * - In-memory cooldown Map rate-limits by address to 1 claim per hour
 *   (resets on cold start — acceptable for 2-3 day demo window)
 * - Address is validated as hex before any signing happens
 *
 * See plan 19 §4 Bucket C for the full spec.
 */

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_KITPOT_EVM_CHAIN_ID ?? "64146729809684");
const JSON_RPC = process.env.NEXT_PUBLIC_KITPOT_JSON_RPC ?? "https://kitpot-rpc.viandwi24.com";
const NATIVE_SYMBOL = process.env.NEXT_PUBLIC_KITPOT_NATIVE_SYMBOL ?? "GAS";
const NATIVE_DECIMALS = Number(process.env.NEXT_PUBLIC_KITPOT_NATIVE_DECIMALS ?? "18");

const DRIP_AMOUNT = parseEther("0.01");
const COOLDOWN_MS = 60 * 60 * 1000;

const kitpotChain = defineChain({
  id: CHAIN_ID,
  name: "Kitpot",
  nativeCurrency: { name: "Gas", symbol: NATIVE_SYMBOL, decimals: NATIVE_DECIMALS },
  rpcUrls: { default: { http: [JSON_RPC] } },
});

const claims = new Map<string, number>();

function normalizeKey(pk: string): `0x${string}` {
  const trimmed = pk.trim();
  return (trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`) as `0x${string}`;
}

export async function POST(req: NextRequest) {
  const pk = process.env.FAUCET_PRIVATE_KEY;
  if (!pk) {
    return NextResponse.json(
      { error: "faucet not configured (FAUCET_PRIVATE_KEY missing)" },
      { status: 500 },
    );
  }

  let body: { address?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const addr = body.address?.toLowerCase();
  if (!addr?.match(/^0x[a-f0-9]{40}$/)) {
    return NextResponse.json({ error: "invalid evm address" }, { status: 400 });
  }

  const last = claims.get(addr) ?? 0;
  const elapsed = Date.now() - last;
  if (elapsed < COOLDOWN_MS) {
    const retrySec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    return NextResponse.json(
      { error: "rate limited", retryAfterSec: retrySec },
      { status: 429 },
    );
  }

  try {
    const account = privateKeyToAccount(normalizeKey(pk));
    const client = createWalletClient({
      account,
      chain: kitpotChain,
      transport: http(),
    });

    const hash = await client.sendTransaction({
      to: addr as `0x${string}`,
      value: DRIP_AMOUNT,
    });

    claims.set(addr, Date.now());

    return NextResponse.json({
      hash,
      amount: "0.01",
      symbol: NATIVE_SYMBOL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
