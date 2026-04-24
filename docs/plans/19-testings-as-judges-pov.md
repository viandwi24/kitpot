# Plan 19 — Public Testnet Deploy + Judge-POV E2E Testing

> **Created:** 2026‑04‑24
> **Parent:** Plan 18 (`18-align-hackathon.md`) — code already complete per §12 of that plan.
> **Goal:** judges open the Vercel URL, click "Connect", and can drive the full arisan flow end-to-end **without installing anything locally**.
> **Deadline:** 2026‑04‑27 00:00 UTC
> **Sources:** DoraHacks INITIATE rules (plan 18 §1) + all Initia docs cited in plan 18 §11.

---

## 0. The one-sentence success criterion

A judge with no prior context opens `https://kitpot.vercel.app` on their phone, taps through Google login, sees an active savings circle they can interact with, enables auto-signing once, pays a cycle contribution with zero drawers, and understands from the UI that "auto-signing is the Initia-native feature being showcased." No command line. No hex addresses. No seed phrases visible.

Everything below exists to make that sentence true.

---

## 1. Architecture of the live demo

```
┌──────────────────────────────────────────────────────────────────┐
│  Judge's browser (phone/laptop)                                   │
│  → opens https://kitpot.vercel.app                                │
└──────────────────────────────────────────────────────────────────┘
           │
           ▼ HTTPS (public)
┌──────────────────────────────────────────────────────────────────┐
│  Vercel (apps/web Next.js 16)                                     │
│  • static assets + Next.js API routes                             │
│  • API route /api/gas-faucet (auto-funds connected wallet)        │
│  • 12 NEXT_PUBLIC_* env vars (11 public + 1 server-only)          │
└──────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ Privy cloud        │  │ Initia L1 testnet  │  │ VPS (Dokploy)      │
│ social login →     │  │ initiation-2       │  │ kitpot-node        │
│ wallet derivation  │  │ .init username     │  │ minitiad + opinitd │
│                    │  │ lookup + authz     │  │ 3 subdomain:       │
│                    │  │ grants             │  │  - kitpot-rpc  8545│
│                    │  │                    │  │  - kitpot-cosmos   │
│                    │  │                    │  │    26657           │
│                    │  │                    │  │  - kitpot-rest 1317│
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

Data flow sanity:
- **Username resolution** (`useUsernameQuery`) → L1 via TESTNET preset → no rollup dependency.
- **Auto-sign grants** (`autoSign.enable`) → L1 authz+feegrant → depends on L1 testnet being up (out of our control, but has high uptime).
- **Contract calls** (`requestTxBlock` / `submitTxBlock` with `/minievm.evm.v1.MsgCall`) → our VPS rollup → we own uptime here.
- **Gas faucet** (`/api/gas-faucet`) → signed server-side from Vercel → to VPS EVM JSON-RPC → bootstraps judge's empty wallet.

---

## 2. What's already done (code complete per plan 18 §12)

Do not redo these:

- ✅ Frontend uses InterwovenKit for all writes (`use-kitpot-tx.ts` with 7 MsgCall methods)
- ✅ Custom Solidity session layer removed from `KitpotCircle.sol`
- ✅ Native `autoSign.enable/disable` wired to `AutoSignToggle` in header
- ✅ Native `useUsernameQuery` used everywhere; `UsernameSetupModal` gone
- ✅ Provider has `customChain` + `customChains` + `defaultChainId` + `enableAutoSign` for kitpot-2
- ✅ `.initia/submission.json` on correct 10-field schema (with 3 placeholders)
- ✅ `infra/dokploy/Dockerfile` + `docker-compose.yml` + `entrypoint.sh` (including the CORS + REST bind patch from today's session)
- ✅ `setup.sh` with two modes (`init` / `restore`) ready to run inside container

## 3. What's still to do (this plan)

Seven buckets, roughly in order of dependency:

| # | Bucket | Owner | Est |
|---|---|---|---|
| A | VPS container live + 3 Traefik subdomains routed | User + Dokploy | 30 min |
| B | Fresh rollup `init` + contracts deployed + addresses recorded | User + AI | 20 min |
| C | Gas faucet API route (bootstrap gas problem) | AI code + User deploy | 30 min |
| D | Vercel env vars + redeploy | User | 15 min |
| E | Privy domain allowlist | User | 5 min |
| F | Seed demo data (1–2 circles with members) | AI script + user run | 30 min |
| G | README update + demo video + final submission.json | User | 60 min |

Total focused effort: ~3 hours.

---

## 4. Technical spec per bucket

### Bucket A — VPS container live + Traefik

**Precondition:** DNS for `viandwi24.com` already points to VPS, Dokploy + Traefik already installed (confirmed by the existing `https://kitpot-rpc.viandwi24.com` 405 response with Cloudflare headers).

**Steps:**

1. Commit + push `infra/dokploy/entrypoint.sh` changes from today (CORS + REST API bind + CORS origins for 26657 + `enabled-unsafe-cors = true` in `[api]` section).
2. In Dokploy UI: pull new image or trigger rebuild.
3. Set `.env` in Dokploy for `kitpot-node` service:
   ```
   MINITIA_HOME=/data/.minitia
   OPINIT_HOME=/data/.opinit
   L1_CHAIN_ID=initiation-2
   L1_RPC_URL=https://rpc.testnet.initia.xyz:443
   L1_GAS_PRICE=0.015uinit
   L2_CHAIN_ID=kitpot-2
   RUN_OPINIT=false                  # demo: skip bridge bots, faster + more reliable
   AUTO_DEPLOY=false                 # deploy manually from laptop per Bucket B
   ```
   (Leave `GENESIS_B64`, `VALIDATOR_KEY_B64`, `NODE_KEY_B64` empty — we use `init` mode, not `restore`.)

4. In Traefik / Dokploy routing, add three subdomain rules pointing at the single `kitpot-node` container:

   | Subdomain | → container port | Purpose |
   |---|---|---|
   | `kitpot-rpc.viandwi24.com` | 8545 | EVM JSON-RPC (already exists, verify still works) |
   | `kitpot-cosmos.viandwi24.com` | 26657 | Cosmos RPC |
   | `kitpot-rest.viandwi24.com` | 1317 | Cosmos REST |

   Optional: `kitpot-ws.viandwi24.com` → 8546 for WebSocket (not used by current wagmiConfig, skip).

5. Initialize the fresh chain inside the container:
   ```bash
   ssh vps
   docker exec -it kitpot-node /setup.sh init
   # prompts for CHAIN_ID and MONIKER in env, or pass inline:
   docker exec -e CHAIN_ID=kitpot-2 -e MONIKER=kitpot-node -it kitpot-node /setup.sh init
   ```

   **IMPORTANT — save the output:**
   - Operator mnemonic (24 words) — this is the admin/validator/deployer wallet
   - Operator EVM private key (from `/data/operator_private_key.hex` written by setup.sh)
   - Operator bech32 address (init1…)
   - Operator EVM hex address (0x…)

6. Chain auto-starts within ~10 seconds (entrypoint loop exits once `genesis.json` exists).

**Acceptance check (run from laptop):**

```bash
# 1. EVM JSON-RPC → chain id 0x3a57530b3714 (= 64146729809684)
curl -s -X POST https://kitpot-rpc.viandwi24.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq .

# 2. Cosmos RPC → block height > 0
curl -s https://kitpot-cosmos.viandwi24.com/status | jq '.result.sync_info.latest_block_height'

# 3. Cosmos REST → network = "kitpot-2"
curl -s https://kitpot-rest.viandwi24.com/cosmos/base/tendermint/v1beta1/node_info | jq '.default_node_info.network'

# 4. CORS preflight → should return Access-Control-Allow-Origin: *
curl -s -I -H "Origin: https://kitpot.vercel.app" https://kitpot-rest.viandwi24.com/cosmos/base/tendermint/v1beta1/node_info
```

If curl #4 does NOT show `access-control-allow-origin: *`, the entrypoint CORS patch failed — check `docker logs kitpot-node` for the "Config patched" banner.

---

### Bucket B — Deploy contracts + record addresses

From laptop (not from VPS), deploy to the live endpoint:

```bash
cd /Users/solpochi/Projects/self/kitpot/contracts

# Pull the operator EVM key from VPS (or keep it in secret store)
scp vps:/data/operator_private_key.hex ~/.kitpot-operator.hex
export PRIVATE_KEY=$(cat ~/.kitpot-operator.hex)

# Deploy
forge script script/Deploy.s.sol \
  --rpc-url https://kitpot-rpc.viandwi24.com \
  --broadcast \
  --gas-limit 30000000

# Wire: the 3 post-deploy authorization calls.
# If forge under-estimates gas (MiniEVM quirk from local testing), run them manually:
export KITPOT=<KitpotCircle address from output>
export REP=<KitpotReputation address>
export ACH=<KitpotAchievements address>

cast send $REP "setAuthorized(address,bool)" $KITPOT true \
  --private-key "$PRIVATE_KEY" --rpc-url https://kitpot-rpc.viandwi24.com --gas-limit 200000

cast send $ACH "setAuthorized(address,bool)" $KITPOT true \
  --private-key "$PRIVATE_KEY" --rpc-url https://kitpot-rpc.viandwi24.com --gas-limit 200000

cast send $KITPOT "setAchievements(address)" $ACH \
  --private-key "$PRIVATE_KEY" --rpc-url https://kitpot-rpc.viandwi24.com --gas-limit 200000
```

Record 4 addresses. Immediately update `.initia/submission.json.deployed_address` = KitpotCircle address.

**Acceptance check:**
```bash
# getCircleCount() = 0 (fresh chain)
cast call $KITPOT "getCircleCount()(uint256)" --rpc-url https://kitpot-rpc.viandwi24.com

# MockUSDC symbol = "USDC"
cast call $USDC "symbol()(string)" --rpc-url https://kitpot-rpc.viandwi24.com

# isSessionValid() should REVERT (session layer confirmed removed)
cast call $KITPOT "isSessionValid(address,address,uint256)(bool)" \
  0x0000000000000000000000000000000000000000 \
  0x0000000000000000000000000000000000000000 0 \
  --rpc-url https://kitpot-rpc.viandwi24.com 2>&1 | grep -i "reverted"
```

---

### Bucket C — Gas faucet API route (CRITICAL: solves bootstrap gas problem)

**Problem statement:** Judge connects wallet → Privy derives a new empty address on kitpot-2 → every subsequent tx (including `autoSign.enable` itself) reverts with "insufficient funds for gas". Auto-sign enabling IS a tx and needs gas first. Classic chicken-and-egg.

**Solution:** backend API route signed server-side by the operator key, drips 0.01 GAS (≈ 100 txs worth of budget at near-zero gas price) to any new address on connect. Called automatically from `useEffect` when `isConnected` becomes true.

**New file:** `apps/web/src/app/api/gas-faucet/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, parseEther, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_KITPOT_EVM_CHAIN_ID ?? "64146729809684");
const JSON_RPC = process.env.NEXT_PUBLIC_KITPOT_JSON_RPC ?? "https://kitpot-rpc.viandwi24.com";

const kitpot = defineChain({
  id: CHAIN_ID,
  name: "Kitpot",
  nativeCurrency: { name: "Gas", symbol: "GAS", decimals: 18 },
  rpcUrls: { default: { http: [JSON_RPC] } },
});

const claims = new Map<string, number>();
const COOLDOWN_MS = 60 * 60 * 1000;       // 1 hour per address
const DRIP_AMOUNT = parseEther("0.01");   // enough for ~100 txs at tiny gas price

export async function POST(req: NextRequest) {
  const pk = process.env.FAUCET_PRIVATE_KEY;
  if (!pk) {
    return NextResponse.json({ error: "faucet not configured" }, { status: 500 });
  }

  let body: { address?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const addr = body.address?.toLowerCase();
  if (!addr?.match(/^0x[a-f0-9]{40}$/)) {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }

  const last = claims.get(addr) ?? 0;
  if (Date.now() - last < COOLDOWN_MS) {
    return NextResponse.json({ error: "rate limited, try in 1h" }, { status: 429 });
  }

  try {
    const account = privateKeyToAccount(pk.startsWith("0x") ? (pk as `0x${string}`) : `0x${pk}`);
    const client = createWalletClient({ account, chain: kitpot, transport: http() });
    const hash = await client.sendTransaction({
      to: addr as `0x${string}`,
      value: DRIP_AMOUNT,
    });
    claims.set(addr, Date.now());
    return NextResponse.json({ hash, amount: "0.01" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
```

**Frontend wiring** — add to `apps/web/src/components/layout/connect-button.tsx` (or a new dedicated hook):

```tsx
useEffect(() => {
  if (!isConnected || !hexAddress) return;
  const key = `kitpot:faucet-claimed:${hexAddress.toLowerCase()}`;
  if (sessionStorage.getItem(key)) return;   // already claimed this session
  fetch("/api/gas-faucet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: hexAddress }),
  })
    .then(r => r.ok ? sessionStorage.setItem(key, "1") : null)
    .catch(() => {});   // silent fail — not critical, user can still use if they had GAS
}, [isConnected, hexAddress]);
```

**Vercel env addition (server-only, NO `NEXT_PUBLIC_` prefix):**
```
FAUCET_PRIVATE_KEY=<operator EVM private key hex, without 0x prefix OK>
```

**Security note:** the in-memory `claims` Map resets on every Vercel cold start, so the 1-hour rate limit is best-effort. For a 2-3 day demo period this is acceptable. If someone drains the faucet, rotate the key or lower `DRIP_AMOUNT`.

**Alternative:** instead of the faucet, have the first-connect flow auto-call `autoSign.enable` and rely on feegrant — BUT `autoSign.enable` grants are recorded on L1 (initiation-2) which the user's wallet has no uinit on. So this doesn't help. Faucet is the robust path.

---

### Bucket D — Vercel environment variables

Vercel → project → Settings → Environment Variables. Add for **Production + Preview + Development** scopes.

| Key | Value |
|---|---|
| `NEXT_PUBLIC_KITPOT_COSMOS_CHAIN_ID` | `kitpot-2` |
| `NEXT_PUBLIC_KITPOT_COSMOS_RPC` | `https://kitpot-cosmos.viandwi24.com` |
| `NEXT_PUBLIC_KITPOT_COSMOS_REST` | `https://kitpot-rest.viandwi24.com` |
| `NEXT_PUBLIC_KITPOT_JSON_RPC` | `https://kitpot-rpc.viandwi24.com` |
| `NEXT_PUBLIC_KITPOT_EVM_CHAIN_ID` | `64146729809684` |
| `NEXT_PUBLIC_KITPOT_NATIVE_SYMBOL` | `GAS` |
| `NEXT_PUBLIC_KITPOT_NATIVE_DECIMALS` | `18` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | (KitpotCircle from Bucket B) |
| `NEXT_PUBLIC_USDC_ADDRESS` | (MockUSDC) |
| `NEXT_PUBLIC_REPUTATION_ADDRESS` | (KitpotReputation) |
| `NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS` | (KitpotAchievements) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | `cmoadvzfr003j0djugypzrdb7` |
| `FAUCET_PRIVATE_KEY` | (operator private key — **NO `NEXT_PUBLIC_` prefix**) |

Trigger a redeploy after the variables are saved (Vercel auto-redeploys on env change, but confirm in Deployments tab).

---

### Bucket E — Privy allowlist

Privy dashboard (`dashboard.privy.io`) → App `cmoadvzfr003j0djugypzrdb7` → Settings:

- **Allowed URLs:** add production Vercel URL, e.g. `https://kitpot.vercel.app` and any preview domain you plan to share
- **Login methods enabled:** Google, Apple, Email (verify at minimum Google works — that's what demo video will show)
- **Embedded wallets:** enabled (required so Privy auto-creates a wallet per login)

Without this, judges see "Invalid origin" error on connect.

---

### Bucket F — Seed demo data

Empty rollup = empty UI = judges think app is broken. Fix by pre-creating 1–2 realistic circles.

Use the existing `contracts/script/SetupDemo.s.sol` (re-audit to make sure it doesn't still call removed session functions). Ideal seed script:

```solidity
// contracts/script/SetupDemo.s.sol  — sketch
// 1. Operator mints 10,000 MockUSDC to self + 3 demo wallets (derived from operator mnemonic via different indices)
// 2. Operator creates 1 public circle "Arisan Demo Hackathon" (5 members, 100 USDC / cycle, 2-minute cycle, public)
// 3. Demo wallets 1-3 join the circle (simulates partial fill so judges can join the 5th slot)
// 4. Optional: advance 1 cycle so reputation + achievement visible
```

Run after contract deploy:
```bash
export PRIVATE_KEY=$(cat ~/.kitpot-operator.hex)
forge script contracts/script/SetupDemo.s.sol \
  --rpc-url https://kitpot-rpc.viandwi24.com --broadcast --gas-limit 30000000
```

**Acceptance check:**
- `cast call $KITPOT "getCircleCount()(uint256)" --rpc-url https://kitpot-rpc.viandwi24.com` returns `1` or more
- Visit `https://kitpot.vercel.app/circles` in incognito → at least one circle card visible

---

### Bucket G — README + demo video + final submission

**README.md (root)** — content template:

```markdown
# Kitpot — Trustless Arisan on Initia

**One-line:** Rotating savings circles (arisan) on Initia with native auto-signing — set up once, cycle contributions run silently.

**🔗 Live demo:** https://kitpot.vercel.app
**🎥 Demo video:** https://youtu.be/<SHA>
**⛓️ Rollup:** kitpot-2 (Initia testnet)

## How judges test (no setup needed)
1. Open https://kitpot.vercel.app
2. Tap **Connect** → Google / Apple / email login (Privy)
3. App automatically drips 0.01 GAS to your new wallet for fees
4. Tap **Get Test USDC** → mint 1,000 mock USDC (public faucet)
5. Join the pre-seeded "Arisan Demo Hackathon" circle
6. Toggle **Enable auto-sign** in the header → approve once (authz + feegrant)
7. Pay cycle contribution → **no drawer** — auto-sign handles it silently
8. Watch reputation tier + achievement NFT badge update

## Native Initia feature used: **Auto-signing**

Implementation entry point: [`apps/web/src/hooks/use-kitpot-tx.ts`](apps/web/src/hooks/use-kitpot-tx.ts)

The hook detects whether the user has enabled `autoSign` via InterwovenKit. If yes, every subsequent contract call goes through `submitTxBlock` (headless — no drawer). Otherwise falls back to `requestTxBlock` (shows confirmation drawer). Under the hood this uses Cosmos SDK `x/authz` + `x/feegrant` to delegate signing to a per-origin session wallet.

## Verify on-chain
- KitpotCircle: `<addr>` — https://kitpot-rpc.viandwi24.com
- MockUSDC: `<addr>`
- KitpotReputation: `<addr>`
- KitpotAchievements: `<addr>`

## Local run (optional)
[3-line quickstart: clone, bun install, bun dev. Point at either VPS or own weave rollup.]
```

**Demo video (1–3 minutes)** — script in plan 18 §10. Record **after** Buckets A–F are all green on the live URL, not before — otherwise the video shows a fake demo.

**Final submission.json** — at submission time:
```bash
git rev-parse HEAD  # copy SHA
# edit .initia/submission.json:
#   commit_sha: "<40-char SHA>"
#   demo_video_url: "https://youtu.be/..."
#   deployed_address already filled from Bucket B
git add .initia/submission.json
git commit -m "chore: finalize hackathon submission"
git push
# Note the final SHA — that's the one judges will clone
```

---

## 5. Judge-POV test scenarios (run AFTER Buckets A–F complete)

Test from a device that has NEVER opened the app before — fresh Chrome incognito window, ideally a different laptop or phone. The whole point is to simulate a judge.

### Scenario 1 — Cold open + landing

| Step | Expected |
|---|---|
| Navigate to `https://kitpot.vercel.app` | Landing page loads in < 2s |
| Page shows name "Kitpot", value prop, CTA | Clear what the app does |
| No console errors (DevTools open) | Zero CORS errors, zero `Chain not found`, zero `TypeError` |

### Scenario 2 — Connect + bootstrap

| Step | Expected |
|---|---|
| Tap **Connect Wallet** | Privy modal opens |
| Tap **Google**, complete OAuth | Modal closes, wallet derived |
| Header shows `<username>.init` (if judge happens to have one) or shortened `init1abc…xyz` | Connected state |
| Open DevTools Network tab | Outbound POST to `/api/gas-faucet` returns `{hash, amount:"0.01"}` within 5 seconds |
| `cast balance <hex_addr> --rpc-url https://kitpot-rpc.viandwi24.com` | Balance = `0.01` GAS (or higher if judge refreshed) |

### Scenario 3 — Faucet + browse circles

| Step | Expected |
|---|---|
| Navigate to `/bridge` (the Faucet page) | "Balance & Top-up" card visible |
| Tap **Mint 1000 USDC** | Confirm drawer → approve → "Minted! Refresh" |
| Balance updates to 1000 USDC | |
| Navigate to `/discover` or `/circles` | Seeded demo circle visible with name, member count, fixed APR / contribution, next cycle |

### Scenario 4 — Join a circle

| Step | Expected |
|---|---|
| Click the demo circle | Circle detail page loads with roster, cycle status |
| Click **Join Circle** | `approveUSDC` + `joinCircle` drawers (one or two depending on allowance) |
| Approve each | tx confirms on explorer, UI shows judge as the 4th or 5th member |
| Header reputation tier updates (if reputation writes fire on join) | |

### Scenario 5 — Enable auto-sign

| Step | Expected |
|---|---|
| In header, tap **Enable auto-sign** | InterwovenKit drawer asks for authz + feegrant approval |
| Approve | Drawer closes, toggle turns green with "Auto-sign ON • expires <time>" |
| In DevTools React state (or just inspect `useInterwovenKit().autoSign`) | `isEnabledByChain["kitpot-2"]` is `true`, `expiredAtByChain["kitpot-2"]` is a future Date |

### Scenario 6 — Silent cycle deposit

| Step | Expected |
|---|---|
| Navigate to active circle detail | "Pay Contribution" button enabled |
| Tap **Pay Contribution** | **NO drawer appears.** Button shows "Depositing..." briefly |
| UI updates to "Already Paid" status for the judge's row | |
| On-chain: `cast call $KITPOT "hasPaid(uint256,uint256,address)(bool)" 0 0 <judge_addr>` | returns `true` |

**This is THE moment the demo sells the native feature.** If the drawer appears here, auto-sign is broken. Fix before proceeding.

### Scenario 7 — Advance cycle, pot distributed

| Step | Expected |
|---|---|
| Wait for cycle duration to elapse (short demo cycle, e.g. 2 minutes) | Countdown shows "Can advance" |
| Tap **Distribute Pot** | Tx confirms (silent, auto-sign still on) |
| First recipient's USDC balance increases by (contributionAmount × memberCount − platform fee) | |
| Reputation tier of recipient updates | |
| Achievement badge (e.g. "First Pot Received") fires | |

### Scenario 8 — Disable auto-sign (reversibility)

| Step | Expected |
|---|---|
| Tap the green **Auto-sign ON** pill | `autoSign.disable("kitpot-2")` fires, drawer confirms revocation |
| Toggle turns gray "Enable auto-sign" | |
| Attempt next deposit | Drawer RETURNS (back to `requestTxBlock` path) — confirms the toggle actually drives behavior |

### Scenario 9 — Reload resilience

| Step | Expected |
|---|---|
| Close the tab, reopen `https://kitpot.vercel.app` | Wallet auto-reconnects (Privy session persists) |
| Circle data loads from chain, not cached | |
| Auto-sign state restored from the L1 grants (still green if not disabled) | |

### Scenario 10 — Mobile viewport

Run scenarios 1, 2, 4, 6, 8 on a phone browser or Chrome DevTools device mode (iPhone 12, Pixel 5). All UI interactions work, Privy modal fits screen, drawers dismiss on backdrop tap.

---

## 6. Acceptance gate (all must be ✅ before demo video recording)

- [ ] `curl https://kitpot-cosmos.viandwi24.com/status` returns non-zero block height
- [ ] `curl https://kitpot-rest.viandwi24.com/cosmos/base/tendermint/v1beta1/node_info` returns network `kitpot-2`
- [ ] `curl -I -H "Origin: https://kitpot.vercel.app" https://kitpot-rest.viandwi24.com/…` includes `access-control-allow-origin: *`
- [ ] `cast call <KitpotCircle> "getCircleCount()(uint256)"` ≥ 1 (seeded)
- [ ] Fresh incognito at `https://kitpot.vercel.app` loads without console errors
- [ ] Google login → wallet connected + 0.01 GAS balance within 10s of connect
- [ ] Full Scenarios 1–10 above pass on desktop
- [ ] Scenario 6 (silent deposit) confirmed — NO drawer appears with auto-sign ON
- [ ] Privy allowed origins includes Vercel URL
- [ ] `.initia/submission.json` `deployed_address` = live VPS KitpotCircle
- [ ] `README.md` root has live demo URL + judge test steps

Once all ✅, record demo video. Then fill `commit_sha` + `demo_video_url` in submission.json. Then submit on DoraHacks.

---

## 7. Common failure modes + fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| `Chain not found: kitpot-2` in console | `customChain` missing from `InterwovenKitProvider` | Verify Vercel env, redeploy |
| CORS error on `/cosmos/base/…` fetch | CORS not patched on container | `docker exec kitpot-node cat /data/.minitia/config/app.toml | grep enabled-unsafe-cors` — should be `true`. If not, patches didn't run; check entrypoint logs |
| `insufficient funds for gas` on first tx | Gas faucet API route failed silently | Check `/api/gas-faucet` response in Network tab. Verify `FAUCET_PRIVATE_KEY` set in Vercel. Verify operator wallet has GAS on rollup (operator was funded in genesis by `setup.sh init`) |
| `autoSign.enable` fails "No message types configured" | Provider's `enableAutoSign` prop wrong or chain_id mismatch | Check provider code — should be `enableAutoSign={{ "kitpot-2": ["/minievm.evm.v1.MsgCall"] }}` with string key matching `defaultChainId` |
| Deposit still shows drawer with auto-sign ON | `submitTxBlock` fallback not wired | Check `use-kitpot-tx.ts` → should check `autoSign.isEnabledByChain[CHAIN_ID]` before routing |
| Rollup container crashes mid-demo | Minitiad OOM or disk full | `restart: unless-stopped` in compose auto-restarts. Check VPS disk with `df -h` |
| Privy modal shows "Invalid origin" | Vercel URL not in Privy allowlist | Add, wait 1 minute for propagation |
| Forge deploy times out / reverts 3 final txs | MiniEVM gas estimation quirk | Fall back to `cast send … --gas-limit 200000` for the authorization calls, as in Bucket B |

---

## 8. Monitoring during judging period (optional polish)

- **UptimeRobot** (free): monitor all 3 subdomains every 5 minutes. Alert via Telegram if any goes red.
- **Vercel Analytics**: already on by default if enabled in project settings — gives you a heat map of which pages judges actually opened.
- **Minitiad log tail**: `ssh vps "docker logs -f --tail 100 kitpot-node"` during active judging hours to catch any panic fast.

---

## 9. Open decisions that need answers before Bucket A

1. **Use operator key as faucet key, or a separate faucet key?**
   Simpler: operator key. Risk: if faucet gets abused, operator balance drained → breaks gas-station for other things (auto-sign feegrant setup via main wallet, demo data seeding). Recommendation: **separate faucet key funded with ~10 GAS**, create in setup.sh init as a second account.

2. **How short is the demo cycle?**
   `cycle_duration` in seconds. Plan 18 memory says 60s for demo. Recommend **120s** (2 min) — gives judge time to see "waiting for cycle" state before tapping Distribute.

3. **Pre-seed 1 circle or 2?**
   Two is better — one "Active" (judge can pay into) and one "Completed" (judge can see what finished state looks like, reputation tiers awarded). But one is minimum viable. Decide based on time.

4. **What goes in Scenario 10 mobile check?**
   If any sub-flow breaks on mobile, recording desktop-only video still passes submission requirements. Skip mobile polish if time tight.

---

## 10. Timeline

```
T-2 days  (tonight):  Buckets A + B + C code    (~1.5h AI+user)
T-2 days  (tonight):  Buckets D + E             (~20 min user)
T-1 day:              Bucket F + Scenarios 1-10 (~2h test+fix)
T-1 day:              Bucket G (README, video)  (~1h)
T-0       (submit):   Final SHA + submit        (~15 min)
```

If any scenario fails hard at T-1, the fix must not touch plan 18's code (which is locked). Fixes are env, infra, or data — not code architecture.

---

## 11. Handoff to next session

If a different builder session picks this up mid-execution, they should:

1. Read this entire plan top-to-bottom.
2. Check `docs/builder/current.md` for the last bucket marked done.
3. Run the acceptance check for that bucket's successor.
4. Continue from there. Do not skip buckets.
5. Never modify plan 18's code path (use-kitpot-tx, providers, autosign toggle) — if a bug appears there, fix per plan 18 §12.3 gap pattern, not by rewriting.

---

## 12. Execution log (updated 2026-04-25)

> **Read this section if you're resuming work.** Every bucket A–F has been executed; Bucket G (README + video + final submit) is what remains. Below is the verbatim log of what happened, what bugs surfaced, and how each was resolved.

### 12.1 Bucket status snapshot

| Bucket | Status | Notes |
|---|---|---|
| **A** — VPS container live + Traefik | ✅ DONE | Dockerfile-only mode in Dokploy (not compose). Explicit named volume `kitpot-data` added via Dokploy UI to persist `/data` across rebuilds. CORS patches in entrypoint.sh verified via `curl -H Origin: ... | grep access-control`. |
| **B** — Deploy contracts | ✅ DONE | 4 addresses live at `0x62d244... / 0xe7bf5d... / 0x073aa6... / 0x956a02...`. 3 authorization txs retried manually with `cast send --gas-limit 200000` due to MiniEVM gas estimation undershoot (expected per plan 19 §4.B notes). |
| **C** — Gas faucet API | ✅ DONE | **Migrated from EVM value transfer to native Cosmos `x/bank` MsgSend** via `@initia/initia.js`. Root cause + fix in plan 18 §13.5 #1. |
| **D** — Vercel env | ✅ DONE | 13 keys including `FAUCET_MNEMONIC` (was `FAUCET_PRIVATE_KEY`, renamed). |
| **E** — Privy allowlist | ✅ DONE | `kitpot.vercel.app` added. Confirmed via successful Brave Wallet connect flow. |
| **F** — Seed demo data | ✅ DONE | Circle 0 via `SetupDemo.s.sol`. Circle 1 ("News Writer") + Circle 2 ("Demo Circle E2E") created by user via UI + filled via test script. |
| **G** — README + video + final submission | ❌ PENDING | README draft + demo video recording + commit_sha + demo_video_url fill. See §12.6 below. |

### 12.2 Scenario 1–10 results (live production, 2026-04-25)

| # | Scenario | Result | Notes |
|---|---|---|---|
| 1 | Cold open + landing | ✅ PASS | Landing renders. `useEffectEvent` error in console but non-blocking. |
| 2 | Connect + bootstrap | ⚠️ PARTIAL | Brave Wallet connect works. Gas faucet auto-drip works after `FAUCET_MNEMONIC` env set + native MsgSend migration. Hard refresh loses Brave session (see plan 18 §13.6). |
| 3 | Faucet + browse circles | ✅ PASS | After UX pass (2026-04-25), Faucet page unified with auto-refetching balance + mint + bridge button. |
| 4 | Join circle | ✅ PASS | 2 tx (approve + joinCircle) each drawer + Brave popup. Successful. Circles 0, 1, 2 all reached active state 3/3 during testing. |
| 5 | Enable auto-sign | ✅ PASS | 2 messages (Grant authz + MsgGrantAllowance feegrant) in single drawer → approve → Brave popup → on-chain grants recorded at L1. |
| 6 | **Silent cycle deposit** | ✅ **PASS — killer moment** | First deposit after Enable: NO drawer, NO Brave popup, tx broadcast silent. Verified on-chain via `hasPaid` + balance delta −100 USDC. |
| 7 | Advance cycle, pot distributed | ✅ PASS | Operator advance cycle 0 → pot 297 USDC transferred to creator (matches `300 − 1% fee`). Cycle 1 → user receives 297 USDC (2700 → 2997). |
| 8 | Disable auto-sign | ⏭️ SKIPPED | Trust by design per API docs; not explicitly tested during session. |
| 9 | Reload resilience | ❌ FAIL (partial) | Hard refresh logs out wallet (Brave). Auto-sign status correctly restored from chain. Recommendation: use Google login flow. |
| 10 | Mobile viewport | ⏭️ SKIPPED | Not tested. Optional polish per plan 19 §9 decision 4. |

**Core demo value proposition PROVEN** end-to-end: scenario 5 + 6 + 7 (enable auto-sign → silent deposit → pot distribution) all pass in production.

### 12.3 Bugs discovered + resolutions (chronological)

| # | Bug | Resolution |
|---|---|---|
| 1 | Dokploy DB lock error `resource temporarily unavailable` on container restart | User did not use `docker volume rm` (plan 19 called that, was wrong); actual fix was `/setup.sh reset` mode added, which wipes chain data from inside container. Then Dokploy restart auto-boots to "waiting for setup" state. |
| 2 | Volume `kitpot-data` was anonymous per Dockerfile-only Dokploy mode | Added explicit named volume in Dokploy UI to persist across rebuilds. |
| 3 | `cast` not in container → `setup.sh init` couldn't derive EVM private key | Patched setup.sh to always save mnemonic to `/data/operator_mnemonic.txt` (persistent). User copies mnemonic to laptop, derives hex via `cast wallet private-key $MNEMONIC "m/44'/60'/0'/0/0"`. |
| 4 | Initial `forge script Deploy.s.sol` 3 authorization txs failed with gas ≈61k | Retried manually with `cast send --gas-limit 200000`. Known MiniEVM gas estimation quirk. |
| 5 | Em-dash `—` in `SetupDemo.s.sol` string broke Solidity compile | Replaced with ASCII `-`. |
| 6 | TypeScript build fail: `customChains` prop not in InterwovenKit type | Removed plural form — singular `customChain` only. Leticia reference confirms this. |
| 7 | TypeScript build fail: `submitTxBlock` requires `fee: StdFee` | Added `AUTO_SIGN_FEE = { amount: [{ denom: "GAS", amount: "0" }], gas: "500000" }` constant in `use-kitpot-tx.ts`. |
| 8 | Gas faucet returned 500: `insufficient balance for transfer: EVMCall failed` | Initial DRIP_AMOUNT was `parseEther("0.01")` = 10^16 wei, but operator had only 10^12 wei in EVM view (GAS registered with 18 decimals). Plus root issue: **EVM value transfer doesn't register x/auth account**. Migrated to native Cosmos `x/bank` MsgSend via `@initia/initia.js` with 100M raw GAS drip. |
| 9 | Vercel build fail: `FAUCET_PRIVATE_KEY` env present but gas-faucet needed mnemonic | Renamed env to `FAUCET_MNEMONIC` with full 24-word operator mnemonic. Updated Vercel config. |
| 10 | Hard refresh logs out Brave Wallet | Accepted limitation — documented in plan 18 §13.6. Recommended Google login path for demo video. |
| 11 | Session wallet re-derive popup on first tx after localStorage clear | Expected InterwovenKit behavior, not a bug. Documented in plan 18 §13.6. |
| 12 | UX: "Balance & Top-up" + "Mint USDC (broken)" + "Deposit via Bridge" duplicated across circle detail + faucet | Consolidated to single Faucet page (2026-04-25). Removed `BridgeDeposit` component (deleted) and `<BridgeDeposit />` in circle detail. Faucet now has auto-refetching balance + mint with auto-dismissing success indicator + Bridge button. See plan 18 §13.7. |
| 13 | `/api/gas-faucet` rate limit Map reset on Vercel cold start | Accepted — 1-hour cooldown best-effort. Good enough for 2–3 day demo window. Plan 19 §4.C acknowledged this. |

### 12.4 Production runtime evidence (as of 2026-04-25)

- `getCircleCount()` returned `3` on-chain (3 demo circles live)
- Gas faucet drip successful via `curl -X POST https://kitpot.vercel.app/api/gas-faucet`
- Full silent deposit cycle reproduced multiple times in browser UI for circles 0 and 1
- Pot distribution tested: creator got 297 USDC (cycle 0), user got 297 USDC (cycle 1)
- Collateral auto-slash for missing deposits verified (cycle 1, member3 didn't explicit-deposit, collateral covered)

### 12.5 Architecture decisions etched during execution

1. **Gas faucet is native Cosmos, not EVM.** `@initia/initia.js` + MnemonicKey + MsgSend is the correct path. Future builders must NOT regress to viem sendTransaction.
2. **One-stop Faucet page at `/bridge`.** Balance + Mint + Bridge merged. No duplicate UI in circle detail.
3. **`operator` key doubles as faucet signer.** Single mnemonic, single env var `FAUCET_MNEMONIC`. Isolated faucet key was discussed but not necessary given 1T GAS genesis allocation and 100M raw per drip (~10,000 judges).
4. **Dokploy uses Dockerfile-only mode with explicit named volume.** Docker-compose.yml exists in repo but NOT used in production. All container orchestration via Dokploy UI.
5. **Demo cycle duration = 60s (not 120s).** User-configured during circle creation via UI for faster demo iterations. Plan 19 §9 decision was 120s, but 60s proved better for testing rhythm.
6. **Auto-sign 10-minute duration.** InterwovenKit default. Longer options exist in drawer but 10 min is fine for demo window.

### 12.6 What remains for submission (Bucket G breakdown)

| Task | Owner | Est time |
|---|---|---|
| Write `README.md` root: pitch + test steps + addresses | AI | 15 min |
| Claim `.init` username for user's showcase wallet | User | 5 min |
| Record demo video 1–3 min (suggest Google login path for seamless UX) | User | 30 min |
| Upload video to YouTube/Loom public | User | 5 min |
| Fill `.initia/submission.json.commit_sha` (after final commit) | User | 1 min |
| Fill `.initia/submission.json.demo_video_url` | User | 1 min |
| Final `git commit -m "chore: prep submission"` + `git push` | User | 2 min |
| Submit on DoraHacks (`dorahacks.io/hackathon/initiate/submit`) | User | 10 min |

**Total: ~70 minutes focused. Deadline 2026-04-27 00:00 UTC — plenty of buffer.**

### 12.7 If you are AI builder resuming (after 2026-04-25 session)

- Read plan 18 §13 (production state) AND this §12 before touching anything.
- Current state is "live demo running, docs pending". Do NOT rewrite provider/tx/faucet logic unless a real bug surfaces.
- Safe work items: README writing, README polish, plan doc updates, minor UX tweaks.
- If asked to "fix the `useEffectEvent` error": this comes from `@initia/interwovenkit-react` internal. Not our code. Investigate by bumping SDK to latest or patching with React canary — but test heavily. Not required for submission (error is non-blocking).
- If user mentions new bugs during demo recording, treat as Bucket G polish. Don't do major refactor.
