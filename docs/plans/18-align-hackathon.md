# Plan 18 — Align Kitpot to INITIATE Hackathon Requirements

> **Status:** Code complete — ready for R1–R7 (runtime tasks). All phases done, all gaps resolved.
> **Created:** 2026‑04‑24 (replaces earlier drafts)
> **Last audit:** 2026‑04‑24 — all gaps (G1–G3) resolved, zero `useWriteContract` remaining
> **Submission deadline:** 2026‑04‑27 00:00 UTC (extended from 2026‑04‑15); display on DoraHacks: `2026/04/26 07:00`
> **Scope:** audit + restructure — frontend, contracts, submission files — to meet DoraHacks INITIATE eligibility + maximize the official scoring rubric.
> **Primary source:** <https://dorahacks.io/hackathon/initiate/detail> (scraped 2026‑04‑24 via Chrome MCP)
> **Secondary sources:** `docs.initia.xyz` pages, `.claude/skills/initia-appchain-dev`, `refs/ltcia/` (Leticia reference)

> **⚠️ STATUS (start here if you're a new session):** Phases 0–6 executed 2026‑04‑24. 8 hallucinations H1–H8 purged successfully (grep audit clean). **3 code gaps + 4 runtime tasks remain** before the project is submission-ready. Jump to **§12 Post-execution audit** for the exact list of what's left and priority order.

---

## 0. Source priority (strict — do not deviate)

| Rank | Source | What it governs |
|---|---|---|
| **1** | DoraHacks hackathon detail (scraped verbatim in §1) | Eligibility, scoring rubric, required deliverables. **This is the acceptance gate.** |
| **2** | `docs.initia.xyz/hackathon/submission-requirements.md` | Exact `.initia/submission.json` schema and file-path conventions |
| **3** | `docs.initia.xyz/interwovenkit/**` + `docs.initia.xyz/hackathon/examples/evm-bank.md` | Native API shapes (autoSign, useUsernameQuery, MsgCall, customChain) |
| **4** | `.claude/skills/initia-appchain-dev` | Operational detail (ports, setup commands, gotchas) — may lag docs |
| **5** | `refs/ltcia/` (Leticia) | Sanity check ("a real project shipped this pattern"). Use only when ranks 1–4 are silent. |
| **6** | `refs/ltcia/.initia/submission.json` | Accepted-submission shape reference (leading-slash paths) |

**Rule:** if sources disagree, higher rank wins. Write code per docs, flag discrepancies in `docs/builder/decisions.md`.

**Golden rules for every builder session:**

1. **Never re-implement a feature Initia provides natively.** Session keys, username resolution, fee grants, and bridge UI are all in InterwovenKit / Cosmos SDK modules. If you're writing Solidity/REST/custom hooks to do something that's already in the kit, STOP.
2. **Never bypass InterwovenKit for txns.** `window.ethereum`, `wagmi.writeContract`, raw `createWalletClient` — all wrong on a MiniEVM rollup. Only `requestTxBlock` / `submitTxBlock` with `/minievm.evm.v1.MsgCall` wrap EVM calldata correctly.
3. **`kitpot-2` is a Cosmos chain ID (string)**. `64146729809684` is the EVM chain ID. Don't conflate them.
4. **Cosmos RPC + REST are mandatory for tx submission**, not just EVM JSON-RPC. The VPS today exposes only `https://kitpot-rpc.viandwi24.com` (JSON-RPC). That is read-only. To actually submit tx, we need 26657 + 1317 (local rollup via `weave rollup start -d`, OR VPS reverse-proxy the Cosmos ports).

---

## 1. DoraHacks INITIATE — official rules (verbatim from scraped page)

Page: <https://dorahacks.io/hackathon/initiate/detail>. Scraped 2026‑04‑24.

### 1.1 Timeline

| Event | Time |
|---|---|
| Submission opens | 2026-03-16 11:00 UTC |
| Original deadline | 2026-04-15 22:00 UTC |
| **Extended deadline** | **2026-04-27 00:00 UTC** (banner: "2026/04/26 07:00" in presumed WIB display) |
| Prize pool | **USD 25,000 equivalent** |
| Event | Virtual, 50 BUIDLs / 533 hackers as of scrape |

### 1.2 Tracks (with prize weights)

| Track | Weight | Description (verbatim) |
|---|---|---|
| **DeFi** | **3** | "Revenue-first financial apps, trading, yield, payments, wallets, liquidity, primitives. Builders deserve sustainable revenue streams, not just usage graphs." |
| **Gaming & Consumer** | **2** | "Games, social apps, digital identity, entertainment, community platforms. Anything that puts real humans in front of real interfaces." |
| **AI & Tooling** | **1** | "AI agents, AI infra, AI-powered consumer apps, AI x onchain experiments." |

### 1.3 Eligibility & Requirements (verbatim)

- "Projects must be original and built during the hackathon period"
- "The submission must be deployed as its own Initia appchain / rollup. Required evidence: A valid rollup chain ID or a txn link, or a deployment link."
- "The project must use **InterwovenKit** (@initia/interwovenkit-react) for wallet connection and/or transaction handling. This requirement exists to ensure the app is actually integrated into the Initia UX stack."
- "The project must implement at least one Initia-native feature: **Auto-signing / Session UX, Interwoven Bridge, Initia Usernames (.init)**"
- Required files: `.initia/submission.json`, `README.md`, demo video (1–3 minutes)

### 1.4 Scoring rubric (verbatim, with weights)

| Criterion | Weight | Verbatim question |
|---|---|---|
| Originality & Track Fit | **20%** | "Is the idea fresh and clearly defined within its chosen track? Does it bring something meaningfully distinct to the space, with a clear point of view on the problem it's trying to solve?" |
| **Technical Execution & Initia Integration** | **30%** | "Is the appchain correctly deployed (locally or on testnet), core logic implemented well, and **Initia-native functionality integrated in a meaningful way**?" |
| Product Value & UX | **20%** | "Is the product understandable, functional, and improved by the Initia experience?" |
| Working Demo & Completeness | **20%** | "Does the submission run end-to-end, and is the demo/README sufficient for judges to verify it quickly?" |
| Market Understanding | **10%** | "Is the target user clearly defined and the go-to-market credible? Does the team demonstrate awareness of the competitive landscape and a clear sense of where their product fits?" |

### 1.5 Submission form fields (required on DoraHacks — not in submission.json)

1. A valid rollup chain ID or txn link, or deployment link — **required**
2. `.initia/submission.json` contents — **required**
3. `README.md` summary — **required**
4. Demo video link (1–3 minutes) — **required**

### 1.6 Track decision for Kitpot

Per `docs/idea/idea.md`, chosen track is **Gaming & Consumer** because:
- Heavy gamification (achievements, XP, streaks, reputation tiers, soulbound NFTs)
- Social savings angle ("real humans, real interfaces")
- `idea.md` calls out this track explicitly

DeFi has 3x weight, but arisan-as-DeFi framing weakens originality vs arisan-as-consumer-social. **Keep Gaming & Consumer.** Flag in `decisions.md` if strategy changes.

---

## 2. `.initia/submission.json` schema (from `docs.initia.xyz/hackathon/submission-requirements.md`)

| Field | Type | Our value |
|---|---|---|
| `project_name` | string | `"Kitpot"` |
| `repo_url` | public GitHub URL | `"https://github.com/viandwi24/kitpot"` |
| `commit_sha` | 40-char hex | fill at submission time |
| `rollup_chain_id` | Cosmos chain ID string | `"kitpot-2"` |
| `deployed_address` | primary contract hex | `"0xecb3a0F9381FDA494C3891337103260503411621"` (KitpotCircle) |
| `vm` | enum | `"evm"` |
| `native_feature` | enum | `"auto-signing"` (primary); secondary mentions `initia-usernames` in README |
| `core_logic_path` | repo-relative (leading slash to match Leticia) | `"/contracts/src/KitpotCircle.sol"` |
| `native_feature_frontend_path` | repo-relative (leading slash) | `"/apps/web/src/hooks/use-kitpot-tx.ts"` (to be created) |
| `demo_video_url` | Loom/YouTube 1–3 min | fill after recording |

---

## 3. Codebase audit — 8 confirmed hallucinations / misalignments

Audit performed 2026‑04‑24 by reading every file under `apps/web/src/**`, `contracts/src/**`, and `.initia/**`. Each entry below cites the exact file(s) and the specific lines that violate the hackathon requirement.

### H1 (CRITICAL) — Custom Solidity session-key contract duplicates native autosign

**Files:** `contracts/src/KitpotCircle.sol` lines 69–74 (`Session` struct), 92 (`sessions` mapping), 123–125 (session events), 457–534 (`authorizeSession` / `revokeSession` / `depositOnBehalf` / `batchDeposit` / `isSessionValid`).

**What it does:** A full homegrown session-key layer in Solidity. Members call `authorizeSession(operator, ...)` to permit batched deposits from an operator.

**Why it's wrong:** Initia's native `auto-signing` (hackathon's only qualifying "native feature" for this mechanic) is implemented at the Cosmos SDK layer via `x/authz` + `x/feegrant`. InterwovenKit exposes it as `autoSign.enable(chainId)` — one drawer tap, the kit derives a per-origin session wallet, records grants on L1. No Solidity needed.

**Impact on scoring:**
- Technical Execution & Initia Integration (30%) — **major loss**. Judges see custom session code and conclude we didn't use the native stack.
- Originality (20%) — **loss**. This pattern is a tired ERC-4337-ish reinvention; the originality of Kitpot is the arisan social angle, not the session layer.

**Fix:** Rip out. Delete the `Session` struct, the `sessions` mapping, all four session functions, all three session events. `deposit(circleId)` stays — each member, once they've enabled autoSign in the wallet, submits `deposit` directly via `submitTxBlock`, and InterwovenKit signs silently with the session wallet.

### H2 — Frontend hook + UI built on top of H1

**Files:** `apps/web/src/hooks/use-auto-signing.ts` (whole file), `apps/web/src/components/circle/auto-signing-setup.tsx` (whole file), `apps/web/src/components/circle/batch-deposit-trigger.tsx` (whole file).

**What it does:** Reads `sessions(user, operator)` / `isSessionValid()`, calls `authorizeSession()` / `revokeSession()`, and exposes a "Trigger Auto-Payments" button that calls `batchDeposit()`.

**Fix:** Delete all three files. Replace with:
- `apps/web/src/components/layout/auto-sign-toggle.tsx` — single toggle calling `useInterwovenKit().autoSign.enable("kitpot-2")` / `disable("kitpot-2")`.
- No "trigger batch" component. Each member's deposit goes out silently via their own session wallet when our scheduler or UI triggers their `submitTxBlock`.

### H3 — Custom REST client for `.init` usernames duplicates `useUsernameQuery`

**Files:** `apps/web/src/lib/initia/username.ts` (uses `/indexer/pair/v1/usernames` — not a standard path), `apps/web/src/hooks/use-init-username.ts`, `apps/web/src/components/username/init-username.tsx`.

**What it does:** Manually fetches `https://rest.testnet.initia.xyz/indexer/pair/v1/usernames?address=…` and caches in a Map.

**Why it's wrong:** `useUsernameQuery(address)` in `@initia/interwovenkit-react` does this natively, via the TESTNET preset on `InterwovenKitProvider`. It returns `string | null` with the `.init` suffix already appended and uses React Query caching.

**Fix:** Delete all three files. Replace every callsite with:
- `const { username } = useInterwovenKit()` for the connected user's own handle.
- `const { data: otherUsername } = useUsernameQuery(otherAddress)` for any other wallet, **called inside a child row component** (not inside `.map()` of a parent).

### H4 (SEVERE) — `UsernameSetupModal` prompts users to INVENT a `.init` username

**File:** `apps/web/src/components/layout/username-setup-modal.tsx` lines 53–57.

**Verbatim UI text:**
> "What's your Initia handle? This shows up in circles instead of your address. You can set it once and forget it. **Don't have one? Just type anything — e.g. yourname.init**"

**Why it's wrong:** `.init` usernames are registered on Initia L1 via a Move-level name service. Letting users type anything, then storing it in `localStorage` as `kitpot:username`, is a **fake credential display** — it has zero relation to the on-chain name registry. If a judge sees this modal, it actively hurts the Native Feature score because it looks like we're faking the feature.

**Fix:** Delete the modal entirely. If no `.init` exists for a wallet, just show `init1ab...1234` truncated — no modal, no fake.

### H5 — Create-circle + deposit + join hooks bypass InterwovenKit

**Files:** `apps/web/src/hooks/use-create-circle.ts` (entire file), `apps/web/src/components/circle/deposit-button.tsx` (entire file), `apps/web/src/components/circle/join-form.tsx` (via `use-create-circle`).

**What they do:** Build a `createWalletClient({ transport: custom(window.ethereum) })`, then call `writeContract` directly.

**Why it's wrong:**
1. **Violates the "must use InterwovenKit for transaction handling" eligibility line** in §1.3. Using it only for the wallet pill and bypassing it at submit time is precisely what that rule was written to prevent.
2. `window.ethereum` on a MiniEVM rollup is unreliable — the `initiaPrivyWalletConnector` does not route through `window.ethereum`.
3. Auto-signing can NEVER apply to these calls because the kit never sees them.

**Fix:** Single hook `apps/web/src/hooks/use-kitpot-tx.ts` that:
- Uses `encodeFunctionData` from viem to build EVM calldata.
- Wraps every call as `{ typeUrl: "/minievm.evm.v1.MsgCall", value: { sender: initiaAddress.toLowerCase(), contractAddr, input, value: "0", accessList: [], authList: [] } }`.
- Routes via `requestTxBlock` (default) or `submitTxBlock` (if `autoSign.isEnabledByChain["kitpot-2"]` is true).

### H6 — `InterwovenKitProvider` missing custom-chain config

**File:** `apps/web/src/app/providers.tsx`.

**Current:** `<InterwovenKitProvider {...TESTNET} theme="dark">` — nothing else.

**Why it's wrong:** Without `customChain`, `customChains`, and `defaultChainId`, the kit has no knowledge of kitpot-2. `requestTxBlock({ chainId: "kitpot-2" })` will fail with "Chain not found". Without `enableAutoSign`, `autoSign.enable("kitpot-2")` will fail with "No message types configured".

**Fix:** See §5 Phase 1 for the exact provider code.

### H7 — `.env.local` "local" network points at Anvil, not Initia

**File:** `apps/web/.env.local` lines 1–7.

**Current:**
```
NEXT_PUBLIC_KITPOT_RPC_URL=http://localhost:8545
NEXT_PUBLIC_KITPOT_CHAIN_ID=31337
```

**Why it's wrong:** `31337` is Anvil (Foundry's test node). Anvil speaks EVM JSON-RPC only — no Cosmos RPC, no REST, no MsgCall routing. The `minitiad` binary (MiniEVM rollup binary) is what hosts a real Initia rollup locally. Under the current config, even a perfectly-fixed frontend cannot send a tx locally.

**Fix:** Start `weave rollup start -d` (launch config already exists at `~/.minitia/artifacts/config.json` showing chain_id `kitpot-2`, denom `GAS`). Redeploy contracts there. Update env:
```
NEXT_PUBLIC_KITPOT_COSMOS_CHAIN_ID=kitpot-2
NEXT_PUBLIC_KITPOT_COSMOS_RPC=http://localhost:26657
NEXT_PUBLIC_KITPOT_COSMOS_REST=http://localhost:1317
NEXT_PUBLIC_KITPOT_JSON_RPC=http://localhost:8545
NEXT_PUBLIC_KITPOT_EVM_CHAIN_ID=64146729809684
NEXT_PUBLIC_KITPOT_NATIVE_SYMBOL=GAS
NEXT_PUBLIC_KITPOT_NATIVE_DECIMALS=18
```

### H8 — `.initia/submission.json` uses old schema

**File:** `.initia/submission.json` (current content).

Missing: `project_name`, `repo_url`, `commit_sha`, `vm`, `native_feature`, `core_logic_path`, `native_feature_frontend_path`. Has `contracts` and `demo_url` fields that are not in the required schema.

**Fix:** Overwrite per §2 template.

### Lesser issues (not hallucinations, just cleanup)

- `apps/web/src/components/bridge/bridge-deposit.tsx` — already uses `openBridge()` correctly. Keep.
- `apps/web/src/app/bridge/page.tsx` — the docs in `docs/builder/memory.md` note this was repurposed as a Faucet. Verify title/copy still says "Faucet", not "Bridge".
- Gamification components (`gamification/*`, `achievements/*`, `reputation/*`) — unrelated to native-feature compliance. Keep as Originality-boosting Consumer UX.

---

## 4. Contract surface after H1 fix — keep vs drop

Keep in `KitpotCircle.sol`:
- Circle struct, Member struct (drop Session struct)
- `createCircle`, `joinCircle`, `_addMember`, `_depositCollateral`
- `deposit` (member calls themselves; autoSign makes this silent via InterwovenKit)
- `advanceCycle`, `_handleMissedPayment`, `claimCollateral`
- All view functions
- Admin: `setPlatformFee`, `setReputation`, `setAchievements`, `withdrawFees`, `pause`, `unpause`
- Late penalty + collateral logic (Originality boost)

Drop from `KitpotCircle.sol`:
- `Session` struct (lines 69–74)
- `sessions` mapping (line 92)
- Events: `SessionAuthorized`, `SessionRevoked`, `DepositOnBehalf` (lines 123–125)
- Functions: `authorizeSession`, `revokeSession`, `depositOnBehalf`, `batchDeposit`, `isSessionValid` (lines 457–539)

Since we had a storage layout with `sessions` mapping in the middle, the new deploy will produce a new address. That's fine — we redeploy once, update `.initia/submission.json::deployed_address`, done.

KitpotReputation.sol, KitpotAchievements.sol, MockUSDC.sol — untouched.

---

## 5. Implementation phases

### Phase 0 — Start local rollup

```bash
# Verify launch config
cat ~/.minitia/artifacts/config.json | jq '.l2_config'
# should show: { "chain_id": "kitpot-2", "denom": "GAS", ... }

# Start rollup in background
weave rollup start -d

# Verify blocks are producing
bash .claude/skills/initia-appchain-dev/scripts/verify-appchain.sh --gas-station
# expect latest_block_height > 0 and ports 26657/1317/8545 open
```

If `weave rollup start` fails, fall back to `minitiad start` per `runtime-discovery.md`.

### Phase 1 — Provider (fix H6)

`apps/web/src/app/providers.tsx`:

```tsx
"use client";
import { type ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";
import {
  InterwovenKitProvider, initiaPrivyWalletConnector, injectStyles, TESTNET,
} from "@initia/interwovenkit-react";
import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { getNetworkConfig } from "@/lib/network";

const net = getNetworkConfig();

const kitpotEvmChain = defineChain({
  id: net.evmChainId,
  name: "Kitpot",
  nativeCurrency: { name: "Gas", symbol: net.nativeSymbol, decimals: net.nativeDecimals },
  rpcUrls: { default: { http: [net.jsonRpc] } },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const KITPOT_CUSTOM_CHAIN: any = {
  chain_id: net.cosmosChainId,
  chain_name: "kitpot",
  pretty_name: "Kitpot",
  network_type: "testnet",
  bech32_prefix: "init",
  logo_URIs: {
    png: "https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.png",
    svg: "https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.svg",
  },
  apis: {
    rpc:      [{ address: net.cosmosRpc }],
    rest:     [{ address: net.cosmosRest }],
    indexer:  [{ address: net.cosmosRest }],   // reuse REST URL — matches Leticia, confirmed working
    "json-rpc": [{ address: net.jsonRpc }],
  },
  fees: {
    fee_tokens: [{
      denom: net.nativeSymbol,
      fixed_min_gas_price: 0, low_gas_price: 0, average_gas_price: 0, high_gas_price: 0,
    }],
  },
  staking: { staking_tokens: [{ denom: net.nativeSymbol }] },
  native_assets: [{ denom: net.nativeSymbol, name: "Gas", symbol: net.nativeSymbol, decimals: net.nativeDecimals }],
  metadata: { is_l1: false, minitia: { type: "minievm" } },
};

const wagmiConfig = createConfig({
  chains: [kitpotEvmChain],
  connectors: [initiaPrivyWalletConnector],
  transports: { [kitpotEvmChain.id]: http(net.jsonRpc) },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => { injectStyles(InterwovenKitStyles); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId={net.cosmosChainId}
          customChain={KITPOT_CUSTOM_CHAIN}
          customChains={[KITPOT_CUSTOM_CHAIN]}
          enableAutoSign={{ [net.cosmosChainId]: ["/minievm.evm.v1.MsgCall"] }}
          theme="dark"
          disableAnalytics
        >
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
```

Also update `apps/web/src/lib/network.ts` to expose `cosmosChainId`, `cosmosRpc`, `cosmosRest`, `jsonRpc`, `evmChainId`, `nativeSymbol`, `nativeDecimals`. Update `.env.local` per H7.

### Phase 2 — Drop custom sessions from Solidity (fix H1)

In `contracts/src/KitpotCircle.sol`:
- Delete `Session` struct (lines 69–74)
- Delete `mapping(address => mapping(address => Session)) public sessions;` (line 92)
- Delete events `SessionAuthorized`, `SessionRevoked`, `DepositOnBehalf` (lines 123–125)
- Delete the entire `AUTO-SIGNING SESSIONS` section (lines 453–539): `authorizeSession`, `revokeSession`, `depositOnBehalf`, `batchDeposit`, `isSessionValid`

Run `forge test -vv`. Remove tests referring to those functions. Deploy via `forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast`. Update contract address in `.env.local` and `.initia/submission.json`.

### Phase 3 — Build `use-kitpot-tx.ts` + replace all tx callsites (fix H5)

Create `apps/web/src/hooks/use-kitpot-tx.ts`:

```ts
"use client";
import { useState } from "react";
import { encodeFunctionData, maxUint256, type Abi } from "viem";
import { calculateFee, GasPrice } from "@cosmjs/stargate";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { KITPOT_ABI } from "@/lib/abi/KitpotCircle";
import { MOCK_USDC_ABI } from "@/lib/abi/MockUSDC";
import { CONTRACTS } from "@/lib/contracts";
import { getNetworkConfig } from "@/lib/network";

const net = getNetworkConfig();
const CHAIN_ID = net.cosmosChainId;
const GAS_PRICE = GasPrice.fromString(`0.015${net.nativeSymbol.toLowerCase()}`);

function msgCall(contractAddr: `0x${string}`, abi: Abi, functionName: string, args: readonly unknown[], sender: string) {
  return {
    typeUrl: "/minievm.evm.v1.MsgCall",
    value: {
      sender: sender.toLowerCase(),
      contractAddr,
      input: encodeFunctionData({ abi, functionName, args }),
      value: "0",
      accessList: [],
      authList: [],
    },
  };
}

export function useKitpotTx() {
  const { initiaAddress, requestTxBlock, submitTxBlock, estimateGas, autoSign } = useInterwovenKit();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function send(messages: ReturnType<typeof msgCall>[]) {
    if (!initiaAddress) throw new Error("Wallet not connected");
    setIsPending(true); setError(null);
    try {
      const isAuto = autoSign?.isEnabledByChain[CHAIN_ID] ?? false;
      if (isAuto) {
        const gas = await estimateGas({ messages, chainId: CHAIN_ID });
        const fee = calculateFee(Math.ceil(gas * 1.4), GAS_PRICE);
        return await submitTxBlock({ chainId: CHAIN_ID, messages, fee });
      }
      return await requestTxBlock({ chainId: CHAIN_ID, messages });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err); throw err;
    } finally { setIsPending(false); }
  }

  return {
    isPending, error,
    autoSignEnabled: autoSign?.isEnabledByChain[CHAIN_ID] ?? false,

    approveUSDC: (spender: `0x${string}`, amount = maxUint256) =>
      send([msgCall(CONTRACTS.mockUSDC, MOCK_USDC_ABI, "approve", [spender, amount], initiaAddress!)]),

    createCircle: (p: { name: string; description: string; contributionAmount: bigint; maxMembers: bigint; cycleDuration: bigint; gracePeriod: bigint; latePenaltyBps: bigint; isPublic: boolean; minimumTier: number; initUsername: string; }) =>
      send([msgCall(CONTRACTS.kitpotCircle, KITPOT_ABI, "createCircle",
        [p.name, p.description, CONTRACTS.mockUSDC, p.contributionAmount, p.maxMembers, p.cycleDuration, p.gracePeriod, p.latePenaltyBps, p.isPublic, p.minimumTier, p.initUsername],
        initiaAddress!)]),

    joinCircle: (circleId: bigint, initUsername: string) =>
      send([msgCall(CONTRACTS.kitpotCircle, KITPOT_ABI, "joinCircle", [circleId, initUsername], initiaAddress!)]),

    deposit: (circleId: bigint) =>
      send([msgCall(CONTRACTS.kitpotCircle, KITPOT_ABI, "deposit", [circleId], initiaAddress!)]),
  };
}
```

Update all callsites:
- `apps/web/src/components/circle/create-circle-form.tsx` → `useKitpotTx().createCircle(...)`
- `apps/web/src/components/circle/join-form.tsx` → `useKitpotTx().joinCircle(...)`
- `apps/web/src/components/circle/deposit-button.tsx` → `useKitpotTx().deposit(...)` + `approveUSDC` branch
- Delete `apps/web/src/hooks/use-create-circle.ts` (content absorbed into use-kitpot-tx)

### Phase 4 — Replace username layer (fix H3 + H4)

Delete files:
- `apps/web/src/lib/initia/username.ts`
- `apps/web/src/hooks/use-init-username.ts`
- `apps/web/src/components/username/init-username.tsx`
- `apps/web/src/components/layout/username-setup-modal.tsx`

Update every callsite to use InterwovenKit hooks directly:
- `apps/web/src/components/layout/connect-button.tsx` — already uses `useInterwovenKit().username`, remove any lingering `useInitUsername` import.
- `apps/web/src/components/circle/create-circle-form.tsx` — prefill `initUsername` from `useInterwovenKit().username ?? ""`.
- `apps/web/src/components/circle/join-form.tsx` — same.
- `apps/web/src/app/circles/[id]/page.tsx`, `apps/web/src/app/leaderboard/page.tsx`, `apps/web/src/app/u/[address]/page.tsx` — use `useUsernameQuery(address)` inside a `MemberRow` child component (never inside parent `.map()`).
- `apps/web/src/app/layout.tsx` — remove `<UsernameSetupModal />` if mounted there.

### Phase 5 — Drop H2 UI, add native AutoSignToggle

Delete:
- `apps/web/src/hooks/use-auto-signing.ts`
- `apps/web/src/components/circle/auto-signing-setup.tsx`
- `apps/web/src/components/circle/batch-deposit-trigger.tsx`

Create `apps/web/src/components/layout/auto-sign-toggle.tsx`:

```tsx
"use client";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { getNetworkConfig } from "@/lib/network";

const CHAIN_ID = getNetworkConfig().cosmosChainId;

export function AutoSignToggle() {
  const { autoSign, isConnected } = useInterwovenKit();
  if (!isConnected || !autoSign) return null;

  const enabled = autoSign.isEnabledByChain[CHAIN_ID] ?? false;
  const expiresAt = autoSign.expiredAtByChain[CHAIN_ID];

  async function toggle() {
    if (enabled) await autoSign.disable(CHAIN_ID);
    else         await autoSign.enable(CHAIN_ID);
  }

  return (
    <button
      type="button" onClick={toggle} disabled={autoSign.isLoading}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${enabled ? "border-emerald-500 text-emerald-400" : "border-border text-muted-foreground hover:text-foreground"}`}
      title={expiresAt ? `Expires ${expiresAt.toLocaleString()}` : undefined}
    >
      <span className={`size-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-muted"}`} />
      {enabled ? "Auto-sign ON" : "Enable auto-sign"}
    </button>
  );
}
```

Mount in `apps/web/src/components/layout/header.tsx` next to `ConnectButton`. Also embed a small explainer on circle detail page: "Enable auto-sign once; cycle deposits run silently for 24h."

### Phase 6 — Overwrite `.initia/submission.json` (fix H8)

```json
{
  "project_name": "Kitpot",
  "repo_url": "https://github.com/viandwi24/kitpot",
  "commit_sha": "<40-char SHA at submit time>",
  "rollup_chain_id": "kitpot-2",
  "deployed_address": "<KitpotCircle address after redeploy>",
  "vm": "evm",
  "native_feature": "auto-signing",
  "core_logic_path": "/contracts/src/KitpotCircle.sol",
  "native_feature_frontend_path": "/apps/web/src/hooks/use-kitpot-tx.ts",
  "demo_video_url": "https://youtu.be/<fill>"
}
```

Also update root `README.md` with: one-sentence pitch, 1–2 screenshots, demo URL, how-to-run-locally (weave rollup start + bun dev), and the native feature we used.

---

## 6. Scoring rubric mapping — where each phase moves the needle

| Criterion (weight) | What we unlock | Phases |
|---|---|---|
| Originality & Track Fit (20%) | Native arisan angle, gamification retained, no "fake feature" modal | H4 (delete fake) + keep gamification |
| **Technical Execution & Initia Integration (30%)** | Real `autoSign` via authz+feegrant, real `useUsernameQuery`, real MsgCall, real customChain | **H1, H2, H3, H5, H6 — all of Phases 1–5** |
| Product Value & UX (20%) | Silent cycle deposits, real `.init` badges, invite-by-username works | Phase 3–5 |
| Working Demo & Completeness (20%) | Local rollup running end-to-end, submission.json valid, README present, 1–3 min video | Phase 0 + 6 + video |
| Market Understanding (10%) | Kept from `docs/idea/idea.md` market analysis | — |

Target score: **80+ / 100**. The 30% criterion is where this plan pays the biggest dividend — we're replacing a pattern that actively *loses* points with one that explicitly satisfies "Initia-native functionality integrated in a meaningful way".

---

## 7. Verification checklist (every item must be green before submitting)

Environment:
- [ ] `weave rollup start -d` succeeded; `curl http://localhost:26657/status` returns node_info
- [ ] Contracts redeployed post-H1; `forge test -vv` passes; addresses updated in env + submission.json

Provider:
- [ ] No "Chain not found" in browser console on app load
- [ ] `useInterwovenKit()` returns both `initiaAddress` and `hexAddress` when connected
- [ ] `useInterwovenKit().username` returns `.init` value for a wallet that owns one, `null` for others

Transactions:
- [ ] `createCircle` from UI shows InterwovenKit drawer → confirm → tx hash returned
- [ ] `joinCircle` works end-to-end
- [ ] `approve` + `deposit` work end-to-end
- [ ] `minitiad query tx <hash>` on each of the above returns `code: 0`

Native feature:
- [ ] `autoSign.enable("kitpot-2")` drawer opens; user confirms authz + feegrant; `isEnabledByChain["kitpot-2"]` flips to `true`
- [ ] With auto-sign ON, `deposit(circleId)` goes through **with zero drawer** and returns a DeliverTxResponse
- [ ] `autoSign.disable("kitpot-2")` revokes and flips to `false`

Hallucinations purged:
- [ ] `grep -r "authorizeSession\|revokeSession\|isSessionValid\|batchDeposit\|depositOnBehalf" contracts/src apps/web/src` returns ZERO matches
- [ ] `grep -r "useInitUsername\|getUsername\|resolveUsername\|lib/initia/username" apps/web/src` returns ZERO matches
- [ ] `grep -r "UsernameSetupModal\|kitpot:username" apps/web/src` returns ZERO matches
- [ ] `grep -r "window.ethereum\|createWalletClient\|custom(eth)" apps/web/src` returns ZERO matches
- [ ] `grep -r "useWriteContract" apps/web/src` returns only the minting utility in `use-bridge.ts` (mock USDC faucet), if at all

Submission artifacts:
- [ ] `.initia/submission.json` matches §2 schema exactly
- [ ] `commit_sha` points to HEAD that contains all the above
- [ ] `core_logic_path` and `native_feature_frontend_path` both exist at that SHA (`git cat-file -e HEAD:<path>`)
- [ ] Demo video uploaded to YouTube / Loom, link public, duration 60–180 s
- [ ] Root `README.md` exists, explains Kitpot in plain English, shows run steps

---

## 8. Files touched by this plan

### Deleted (hallucination removal)
- `apps/web/src/hooks/use-auto-signing.ts`
- `apps/web/src/components/circle/auto-signing-setup.tsx`
- `apps/web/src/components/circle/batch-deposit-trigger.tsx`
- `apps/web/src/hooks/use-init-username.ts`
- `apps/web/src/lib/initia/username.ts`
- `apps/web/src/components/username/init-username.tsx`
- `apps/web/src/components/layout/username-setup-modal.tsx`
- `apps/web/src/hooks/use-create-circle.ts`

### Created
- `apps/web/src/hooks/use-kitpot-tx.ts`
- `apps/web/src/components/layout/auto-sign-toggle.tsx`

### Modified
- `apps/web/src/app/providers.tsx`
- `apps/web/src/lib/network.ts`
- `apps/web/.env.local`, `apps/web/.env.example`
- `apps/web/src/components/circle/create-circle-form.tsx`
- `apps/web/src/components/circle/join-form.tsx`
- `apps/web/src/components/circle/deposit-button.tsx`
- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/components/layout/connect-button.tsx`
- `apps/web/src/app/layout.tsx` (remove UsernameSetupModal mount)
- `apps/web/src/app/circles/[id]/page.tsx`
- `apps/web/src/app/leaderboard/page.tsx`
- `apps/web/src/app/u/[address]/page.tsx`
- `contracts/src/KitpotCircle.sol` (remove session layer)
- `contracts/test/KitpotCircle.t.sol` (remove session tests)
- `.initia/submission.json`
- `README.md` (root)

### Untouched
- `contracts/src/KitpotReputation.sol`, `contracts/src/KitpotAchievements.sol`, `contracts/src/MockUSDC.sol`
- `apps/web/src/components/bridge/bridge-deposit.tsx` (already calls `openBridge` correctly)
- Gamification / achievements / reputation UI (supports Originality score)

---

## 9. Open questions for `docs/builder/decisions.md`

1. **Gas denom confirmation.** Launch config says `"denom": "GAS"`. Some minievm chains also register `umin`. Run `minitiad query bank total --node http://localhost:26657` after `weave rollup start` to confirm, then adjust `GasPrice.fromString` accordingly.
2. **VPS Cosmos endpoints.** If we want the Vercel deploy to work (not just local), reverse-proxy `viandwi24.com:26657` and `:1317` under subdomains, OR keep the demo strictly local and record locally.
3. **Track final call.** Plan says Gaming & Consumer per `idea.md`. DeFi has 3x weight — if we want to re-pitch as a DeFi primitive, note it and rewrite README angle.
4. **Demo video recording slot.** Allocate 2 hours for a single-take recording day-of-submission. Script in §10.

---

## 10. Demo video script (60–180s window)

0:00–0:15 — "300 million people run arisan every month, off-chain. Here's Kitpot: arisan on Initia with native auto-signing."
0:15–0:30 — Connect wallet. Header shows `pochita.init` resolved via `useUsernameQuery`. Create a circle in the UI (drawer confirms).
0:30–0:50 — Invite + join flow. Members show as `.init` handles.
0:50–1:10 — Toggle **Enable auto-sign**. Drawer asks for authz + feegrant → confirm. Show expiration badge.
1:10–1:40 — Pay cycle contribution. **No drawer**. Tx lands, explorer block. Say out loud: "This is InterwovenKit's native auto-signing — Cosmos authz + feegrant under the hood."
1:40–2:00 — Advance cycle, pot distribution, reputation tier update. Close with: "Kitpot — social savings primitive on Initia. Native features, no reinvention."

---

## 11. Citation audit (2026-04-24 sources)

| Claim | Source | Verified how |
|---|---|---|
| Scoring rubric + eligibility | <https://dorahacks.io/hackathon/initiate/detail> | Chrome MCP scrape — see §1 quote block |
| Extended deadline | Same page, banner + JSON `endTime: 1777161600000` | Chrome MCP scrape |
| Track descriptions + weights | Same page, `tracks[].description` + `weight` in page JSON | Chrome MCP scrape |
| `.initia/submission.json` schema | <https://docs.initia.xyz/hackathon/submission-requirements.md> | WebFetch 2026-04-24 |
| `useInterwovenKit` API | <https://docs.initia.xyz/interwovenkit/references/hooks/use-interwovenkit.md> | WebFetch 2026-04-24 |
| `autoSign` object shape | <https://docs.initia.xyz/interwovenkit/features/autosign/api-reference.md> | WebFetch 2026-04-24 |
| `enableAutoSign` prop format | <https://docs.initia.xyz/interwovenkit/features/autosign/configuration.md> | WebFetch 2026-04-24 |
| MsgCall canonical shape | <https://docs.initia.xyz/hackathon/examples/evm-bank.md> | WebFetch 2026-04-24 |
| `useUsernameQuery` | <https://docs.initia.xyz/interwovenkit/references/hooks/use-username-query.md> | WebFetch 2026-04-24 |
| Submission path leading-slash convention | `refs/ltcia/.initia/submission.json` | File read |
| Local port convention (26657/1317/8545) | `refs/ltcia/frontend/src/config/network.ts` + skill `frontend-interwovenkit.md` | File read |
| Local `kitpot-2` launch config | `~/.minitia/artifacts/config.json` | File read — shows chain_id "kitpot-2", denom "GAS" |
| BUIDL 40170 (CrediKye) **not on Initia** | <https://dorahacks.io/buidl/40170> | Chrome MCP scrape — field `techTree`/`otherInfrastructures: ["layer1:creditcoin"]`. So CrediKye is only an **idea reference** for ROSCA UX, not a tech reference. |

Every recommendation above traces to one of these rows. If a future session proposes something outside this table, treat it as hallucination until it's traced to a source.

---

## 12. Post-execution audit (2026-04-24)

This section records what's actually in the repo after phases 1–6 ran. If you are a new AI session picking this up, read this section FIRST — it's the shortest path to knowing what's left. Do not re-do work that's listed as ✅ DONE.

### 12.1 Phase status snapshot

| Phase | Task | Status |
|---|---|---|
| 0 | Start local rollup (`weave rollup start -d`) | ❌ NOT DONE (runtime task — see §12.4) |
| 1 | Provider rewrite (`providers.tsx`, `network.ts`, `contracts.ts`, `.env.example`) | ✅ DONE |
| 2 | Drop custom session layer from `KitpotCircle.sol` + tests + ABI | ✅ DONE (needs redeploy — see §12.4) |
| 3 | Create `use-kitpot-tx.ts`, rewire create/join/deposit callsites | ✅ DONE |
| 4 | Delete custom username stack, migrate to `useUsernameQuery` + `useInterwovenKit().username` | ✅ DONE |
| 5 | Delete custom auto-sign stack, add `AutoSignToggle`, mount in header | ✅ DONE |
| 6 | Overwrite `.initia/submission.json` + README.md | ✅ DONE (3 placeholders — see §12.4) |
| G1 | Migrate `advanceCycle` to `useKitpotTx` | ✅ RESOLVED |
| G2 | Migrate `claimDailyQuest` to `useKitpotTx` (user-triggered, no modifier) | ✅ RESOLVED |
| G3 | Migrate `MockUSDC.mint` faucet to `useKitpotTx` | ✅ RESOLVED |

### 12.2 Hallucination audit — grep evidence

Run these four commands; each must return ZERO matches inside source code (`docs/plans/*.md` hits are historical and acceptable):

```bash
grep -rn "authorizeSession\|revokeSession\|isSessionValid\|batchDeposit\|depositOnBehalf\|SessionAuthorized\|SessionRevoked" contracts/src apps/web/src
grep -rn "useInitUsername\|getUsername\|resolveUsername\|lib/initia/username\|UsernameSetupModal\|kitpot:username" apps/web/src
grep -rn "window\.ethereum\|createWalletClient\|custom(eth)" apps/web/src
grep -rn "from \"@/hooks/use-create-circle\"\|from \"@/hooks/use-auto-signing\"\|from \"@/hooks/use-init-username\"" apps/web/src
```

**Last run 2026-04-24:** all four return ZERO matches in source. ✅

### 12.3 Remaining code gaps (do these BEFORE submitting)

These are `wagmi.useWriteContract` callsites that still bypass InterwovenKit. Rule #2 in §0 says "Never bypass InterwovenKit for txns." The `useKitpotTx` hook already models the correct pattern — extend it.

| # | File | Line | Function called | Priority | Status |
|---|---|---|---|---|---|
| G1 | `apps/web/src/components/circle/advance-cycle-button.tsx` | 15 | `KitpotCircle.advanceCycle(circleId)` | **HIGH** | **RESOLVED** — migrated to `useKitpotTx().advanceCycle` |
| G2 | `apps/web/src/hooks/use-reputation.ts` | 60 | `KitpotReputation.claimDailyQuest()` (user-triggered, no modifier) | **MEDIUM** | **RESOLVED** — migrated to `useKitpotTx().claimDailyQuest` |
| G3 | `apps/web/src/hooks/use-bridge.ts` | 22 | `MockUSDC.mint(to, amount)` (testnet faucet) | **LOW** | **RESOLVED** — migrated to `useKitpotTx().mintTestUSDC` |

**How to fix G1 (concrete):**

1. Open `apps/web/src/hooks/use-kitpot-tx.ts`.
2. Add one method to the returned object (after `deposit`):

   ```ts
   advanceCycle: (circleId: bigint) =>
     send([
       msgCall(
         CONTRACTS.kitpotCircle,
         KITPOT_ABI as Abi,
         "advanceCycle",
         [circleId],
         initiaAddress!,
       ),
     ]),
   ```

3. Rewrite `apps/web/src/components/circle/advance-cycle-button.tsx` to use `useKitpotTx().advanceCycle(circleId)` instead of `wagmi.useWriteContract`. Same pattern as `deposit-button.tsx`.

**How to triage G2:**

Read `apps/web/src/hooks/use-reputation.ts` line 60 and identify the function name being called. Check `contracts/src/KitpotReputation.sol` for whether that function has `onlyOwner` or `onlyCircle` modifier:
- If `onlyOwner` / admin-gated → leave as-is; note in `decisions.md` ("admin tool, outside user flow").
- Otherwise → migrate to `useKitpotTx` with a matching `reputationCall` helper.

### 12.4 Runtime tasks (user-executed, outside AI session)

These cannot be done by the AI builder inside Docker — they need the host with `weave`, `forge`, and a wallet:

| # | Task | Command / Action | Produces |
|---|---|---|---|
| R1 | Start local rollup | `weave rollup start -d` then `bash .claude/skills/initia-appchain-dev/scripts/verify-appchain.sh --gas-station` | ports 26657/1317/8545 open |
| R2 | Confirm gas denom | `minitiad query bank total --node http://localhost:26657` | `GAS` or `umin` — log in `docs/builder/decisions.md`; update `GasPrice.fromString` in `use-kitpot-tx.ts` if not `gas` |
| R3 | Redeploy `KitpotCircle` (post-§Phase 2) | `forge script contracts/script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast` | new contract address |
| R4 | Update env + submission | Put new address in `apps/web/.env.local` (`NEXT_PUBLIC_CONTRACT_ADDRESS`) AND in `.initia/submission.json` (`deployed_address`) | env aligned |
| R5 | Smoke test end-to-end | `bun dev`, connect wallet, create circle, toggle auto-sign, deposit, advanceCycle (after G1 fix) | UI functional |
| R6 | Record demo video | 60–180s, script in plan §10; upload to YouTube or Loom public | `demo_video_url` |
| R7 | Final commit + fill submission | `git add -A && git commit`; `git rev-parse HEAD` → fill `commit_sha` and `demo_video_url` in `.initia/submission.json` | submission-ready |

### 12.5 Priority order to finish

1. **Fix G1** (migrate `advanceCycle` to `useKitpotTx`) — protects the 30% scoring criterion.
2. **Triage G2** (is it user-triggered? If yes, migrate. If no, note and skip).
3. **Optional: G3** (faucet mint — migrate if free time, otherwise leave TODO comment).
4. **Then R1 → R7** in order.

### 12.6 Submission-ready definition (the bar)

All of these must be true before hitting "Submit" on DoraHacks:

- [x] G1 resolved (advanceCycle via InterwovenKit)
- [x] G2 resolved (claimDailyQuest is user-triggered → migrated to useKitpotTx)
- [x] G3 resolved (MockUSDC.mint faucet → migrated to useKitpotTx)
- [ ] R1–R5 done (rollup running, contract deployed, smoke test green)
- [ ] R6 done (video uploaded, public URL in hand)
- [ ] `.initia/submission.json` has no `<fill-...>` placeholders
- [ ] `git cat-file -e HEAD:contracts/src/KitpotCircle.sol` succeeds at the submitted SHA
- [ ] `git cat-file -e HEAD:apps/web/src/hooks/use-kitpot-tx.ts` succeeds at the submitted SHA
- [ ] Root `README.md` includes: pitch + native feature explanation + run instructions + demo link
- [ ] DoraHacks form fields filled: rollup chain ID / txn link / deployment link + submission.json content + README + demo video URL

When all boxes ✅, the project meets the `§1 Eligibility & Requirements` verbatim. Submit.

---

## 13. Production state + technical decision log (updated 2026-04-25)

> **Start here if you are a new AI session.** This section records what's actually live, what decisions we made during execution, and discovered behaviors that aren't obvious from reading the plan alone. Every bullet here is grounded in an executed step, not a proposal.

### 13.1 Live production endpoints

| Layer | URL / Value | Status |
|---|---|---|
| Vercel frontend (production) | `https://kitpot.vercel.app` | ✅ live |
| Cosmos RPC (kitpot-2) | `https://kitpot-cosmos.viandwi24.com` | ✅ live, CORS open |
| Cosmos REST (kitpot-2) | `https://kitpot-rest.viandwi24.com` | ✅ live, CORS open |
| EVM JSON-RPC (kitpot-2) | `https://kitpot-rpc.viandwi24.com` | ✅ live |
| Rollup chain_id (Cosmos) | `kitpot-2` | current height >200 blocks |
| Rollup chain_id (EVM) | `64146729809684` (`0x3a57530b3714`) | |
| L1 reference | `initiation-2` via `TESTNET` preset | via rest.testnet.initia.xyz |

### 13.2 Deployed contract addresses (kitpot-2)

```
KitpotCircle:       0x62d244f304Bc7638D44f5e335DFaDF8c9DCef990
MockUSDC:           0xe7bf5d16190f4d7d4c1aE99250405702d2f0a442
KitpotReputation:   0x073aa6CFCF9E663cc24b9EB72B8E71E6d9ba072d
KitpotAchievements: 0x956a0285B10c8afAEaDef98A77b1da48642dd97A
Operator / deployer: 0xffecdeA299A1aa7Ad213731C6e6D8363a5A723D2
                     init1llkdag5e5x4845snwvwxumvrvwj6wg7jjlqadr
```

Seeded circles: 0 (Arisan Demo Hackathon), 1 (News Writer), 2 (Demo Circle E2E) — all active 3/3 members via on-chain E2E test.

### 13.3 Vercel env (13 keys)

All `NEXT_PUBLIC_KITPOT_*` + `NEXT_PUBLIC_CONTRACT_ADDRESS` + `NEXT_PUBLIC_USDC_ADDRESS` + `NEXT_PUBLIC_REPUTATION_ADDRESS` + `NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS` + `NEXT_PUBLIC_PRIVY_APP_ID` + `FAUCET_MNEMONIC` (server-only).

`FAUCET_MNEMONIC` = operator's 24-word mnemonic (same wallet as operator/deployer). Used server-side by `/api/gas-faucet` route for native Cosmos MsgSend.

### 13.4 Dependency versions pinned by execution

| Package | Version | Why |
|---|---|---|
| `@initia/interwovenkit-react` | `^2.8.0` | latest at testing time; works end-to-end |
| `@initia/initia.js` | `^1.1.0` | added for gas-faucet server-side native signing |
| `react` / `react-dom` | `19.2.5` | Next 15 peer |
| `wagmi` | `^2.0.0` | InterwovenKit transitive requirement |
| `viem` | `^2.0.0` | same |
| `next` | `^15.0.0` | app router + api route runtime |

### 13.5 Decisions made during execution (immutable log)

1. **Gas faucet uses native Cosmos MsgSend, NOT viem EVM value transfer.**
   - Root cause: EVM value transfer on MiniEVM only updates EVM ledger, does NOT register `x/auth` account entry for the receiver. InterwovenKit queries `/cosmos/auth/v1beta1/account_info/{addr}` before any tx; without auth entry, query returns 404 → all txs fail with "account does not exist".
   - Fix: `/api/gas-faucet/route.ts` now uses `@initia/initia.js` MnemonicKey + Wallet + MsgSend to create the auth entry AND credit balance in one shot.
   - Plan 19 §4.C was updated with this correct implementation.

2. **Drip amount is 100,000,000 raw GAS units** (`= 100 × 10^6` wei-equivalent in bank module).
   - Genesis gave operator ~1,000,000,000,000 raw GAS (1T). With 100M raw per drip, ~10,000 judges can be funded.
   - Gas price on rollup = 0, so tiny balance is enough for unlimited txs per user.
   - Earlier attempts with `parseEther("0.01")` = 10^16 wei failed because operator balance in EVM view is only 10^12 wei (`GAS` registered with 18 decimals on EVM side).

3. **`customChains` prop (plural) removed from InterwovenKitProvider.**
   - InterwovenKit v2.8.0 type definition does NOT accept `customChains` — only `customChain` (singular). Type check fails with that prop.
   - Leticia reference also uses only singular, no issues. Plan 18 §2.4 originally suggested both; execution proved singular is enough.

4. **`submitTxBlock` requires explicit `fee: StdFee`.**
   - The TxParams type (submit variants) differs from TxRequest (request variants). `fee` is mandatory.
   - Set to `{ amount: [{ denom: "GAS", amount: "0" }], gas: "500000" }` in `useKitpotTx.ts`. Any non-negative fee works since rollup gas price = 0.

5. **MiniEVM gas estimation undershoots for multi-step forge scripts.**
   - `forge script Deploy.s.sol --broadcast` succeeds for the 4 contract creations but fails the 3 authorization transactions with `status 0` and tight gas (≈61k).
   - Workaround: retry with explicit `--gas-limit 200000` per tx via `cast send`. Documented in plan 19 §4.B.

6. **Em-dash `—` breaks Solidity compiler.**
   - `contracts/script/SetupDemo.s.sol` initially had em-dash in `console.log` string → compilation failed with "Invalid character in string" error. Replaced with plain hyphen `-`.
   - Rule: Solidity string literals accept ASCII only unless prefixed with `unicode""`.

7. **Rollup deployment uses Dockerfile-only mode in Dokploy (not compose).**
   - `VOLUME ["/data"]` in Dockerfile creates anonymous volume per container — lost on redeploy. Added explicit named volume `kitpot-data` via Dokploy UI to persist chain state across rebuilds.
   - Plan 19 §4.A was drafted assuming docker-compose, but reality is Dockerfile-only; volume mounting was manually set in Dokploy.

8. **`/setup.sh reset` mode added to handle container state cleanup without SSH.**
   - Original setup.sh only had `init` + `restore`. Reset required volume-level wipe from host. Added `reset` mode that `rm -rf /data/.minitia /data/.opinit /data/operator_mnemonic.txt /data/operator_private_key.hex` with 3s confirmation delay.

9. **Mnemonic persists to `/data/operator_mnemonic.txt` (was only stdout before).**
   - First execution lost mnemonic because setup.sh init only printed to stdout (docker exec session terminal); user didn't have chance to save. Patched setup.sh to always write mnemonic to persistent file `/data/operator_mnemonic.txt` regardless of cast availability.

10. **`DEFAULT_SESSION_EXPIRY` for autoSign = 10 minutes.**
    - Drawer shows "for 10 minutes" by default. User must re-enable after expiry. Longer options in dropdown but default 10 min is InterwovenKit's safe default.

### 13.6 Discovered behaviors (not bugs, but good to know)

| Behavior | Explanation |
|---|---|
| `useEffectEvent` error persists in console | `@initia/interwovenkit-react` v2.8.0 uses a React hook that's canary-only. Stable React 19.2 doesn't expose it. Non-blocking — UI renders and flows work despite the error. |
| Wallet logout on hard refresh (`Cmd+Shift+R`) | Brave external wallet state not persisted by default wagmi config. Soft nav (Link click) preserves session. Mitigation: use Google login (Privy embedded wallet) for seamless reconnect. |
| Session wallet re-derive popup after localStorage clear | After Enable auto-sign, InterwovenKit caches derived session wallet in localStorage. If cache gone, first tx triggers a re-derivation prompt (Brave Wallet "Sign this message" popup). Subsequent txs silent. Expected per InterwovenKit design. |
| Auto-sign ON status survives refresh | Authz + feegrant grants stored on Initia L1 chain. Reconnect → InterwovenKit queries chain → recognizes active grants → UI shows Auto-sign ON immediately. No client-side cache required for this state. |
| `.init` username returns null for unclaimed wallets | `useInterwovenKit().username` + `useUsernameQuery(address)` hit L1 registry. If user hasn't claimed via Initia username portal, returns null. UI fallback: `truncateAddress(hexAddress)`. To show "pochita.init" in circles, user must register at the Initia username portal first. |

### 13.7 UX refinements applied (2026-04-25)

- **Circle detail page**: removed `<BridgeDeposit />` duplicate (balance + mint + bridge button). Now just a 1-line hint linking to `/bridge`.
- **Faucet page** (`/bridge`): unified 3 cards (Balance auto-polling · Mint with auto-refetch + auto-dismissing "+1000 USDC minted" toast · Bridge button via `openBridge()`).
- **Balance auto-poll**: `useTokenBalance` now refetches every 10s + on mint success. Eliminates "Refresh page" text that was UX dead-end.
- `bridge-deposit.tsx` component deleted (no longer imported anywhere).

### 13.8 What's blocking submission (priority order)

| Item | Blocker level | Fix |
|---|---|---|
| README.md root pitch + judge test steps + addresses | **BLOCKER** | Write using template from plan 19 §4.G |
| Demo video 1–3 min uploaded to YouTube/Loom | **BLOCKER** | Record per plan 19 §10 script. Recommend Google login flow for smooth UX. |
| `.initia/submission.json`.`commit_sha` | **BLOCKER** | `git rev-parse HEAD` at final commit time |
| `.initia/submission.json`.`demo_video_url` | **BLOCKER** | Set after upload |
| Commit + push UX fix (2026-04-25) | HIGH | `git add` + `git commit` + `git push` triggers Vercel rebuild |
| Claim `.init` username for showcase | MEDIUM | Optional polish — makes demo video cleaner if user shows `.init` badge |
| Fix wallet persistence (use Privy Google login path) | MEDIUM | Rewrite demo video with Google login to avoid reconnect friction |

### 13.9 Scoring rubric estimate (plan §1.4 weights)

After all §13.8 blockers resolved + demo video recorded:

| Criterion | Weight | Est. score |
|---|---|---|
| Originality & Track Fit | 20% | 18/20 |
| **Technical Execution & Initia Integration** | **30%** | **28/30** (native features proven end-to-end, zero hallucination) |
| Product Value & UX | 20% | 16–18/20 (after 2026-04-25 UX pass) |
| Working Demo & Completeness | 20% | 18–20/20 (after README + video) |
| Market Understanding | 10% | 9/10 |
| **Target total** | | **~90/100** |

Current pre-submission est: 85/100. README + video alone adds 5–7 points.

### 13.10 If you are an AI builder resuming this work

1. Read §13.1–§13.9 in full first. Do not re-execute anything unless you verify it hasn't been done.
2. Check `.initia/submission.json` for placeholder fields — those are the remaining blockers.
3. Do NOT modify:
   - Gas faucet API route logic (native Cosmos MsgSend is correct; any EVM value transfer variant will re-break auth account registration)
   - `customChain` config shape (singular, not plural)
   - `submitTxBlock` fee field (mandatory per SDK type)
   - DRIP_AMOUNT scale (raw bank units, not parseEther)
4. Safe to work on: README drafting, demo video script refinement, auxiliary UI polish, docs updates.
5. Never `docker volume rm` or `docker exec /setup.sh reset` on production VPS without user approval — chain state is live, re-init loses all circles + deposits.
