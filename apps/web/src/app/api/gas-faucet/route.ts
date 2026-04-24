import { NextRequest, NextResponse } from "next/server";
import { MnemonicKey, Wallet, MsgSend, RESTClient, Fee, Coins, AccAddress } from "@initia/initia.js";

/**
 * Gas Faucet — native Initia Cosmos x/bank MsgSend.
 *
 * ROOT CAUSE of earlier version:
 *   The previous implementation used viem EVM transfer (`sendTransaction`).
 *   On MiniEVM, EVM value transfers update the EVM ledger but do NOT register
 *   a Cosmos x/auth account entry for the receiver. InterwovenKit queries
 *   `/cosmos/auth/v1beta1/account_info/{addr}` before any tx, and without an
 *   auth account entry the query returns 404 → user can never transact.
 *
 * PROPER FIX:
 *   Use @initia/initia.js (official Initia SDK, same lib InterwovenKit uses
 *   under the hood) to build a native Cosmos x/bank MsgSend tx. This creates
 *   the receiver's auth account AND credits their balance in one shot.
 *
 * Plan 18 §0 compliance: native stack, no hallucination.
 * Plan 19 §4 Bucket C: unchanged intent (bootstrap gas problem), improved impl.
 */

const REST_URL = process.env.NEXT_PUBLIC_KITPOT_COSMOS_REST ?? "https://kitpot-rest.viandwi24.com";
const CHAIN_ID = process.env.NEXT_PUBLIC_KITPOT_COSMOS_CHAIN_ID ?? "kitpot-2";
const NATIVE_SYMBOL = process.env.NEXT_PUBLIC_KITPOT_NATIVE_SYMBOL ?? "GAS";

// Operator has ~1T raw GAS from genesis. Drip 100,000,000 raw units per claim.
// With that, operator can fund ~10,000 users before refill. Gas price = 0 so
// receiver can transact immediately after registration.
const DRIP_AMOUNT_RAW = "100000000";
const COOLDOWN_MS = 60 * 60 * 1000;

const claims = new Map<string, number>();

function hexToBech32(hex: string): string | null {
  try {
    const clean = hex.toLowerCase().replace(/^0x/, "");
    if (!/^[a-f0-9]{40}$/.test(clean)) return null;
    return AccAddress.fromHex(clean);
  } catch {
    return null;
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

    return NextResponse.json({
      hash: result.txhash,
      sender: senderBech32,
      receiver: receiverBech32,
      amount: DRIP_AMOUNT_RAW,
      denom: NATIVE_SYMBOL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
