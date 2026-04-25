# Plan 21 — UX polish + auto-sign feegrant diagnostics

> **Created:** 2026‑04‑25 (late evening)
> **Parent:** Plan 20 (multi-token + bridge withdraw shipped)
> **Goal:** close 4 UX/correctness gaps surfaced during live judge-POV testing.
> **Deadline:** 2026‑04‑27 00:00 UTC (INITIATE submission).

---

## 1. Why this plan exists

E2E walkthrough at `https://kitpot.vercel.app` after plan 20 deploy surfaced four issues that judges will hit:

1. **Leaderboard double-prints address** when a user has no `.init` username (InitUsername fallback shows truncated address, then a hard-coded `<span>` below shows the same truncated address again).
2. **Dashboard hides USDe balance** — only MockUSDC is read, contradicting the multi-asset story we just shipped in plan 20.
3. **No chain detection / "Add Kitpot to wallet" CTA** for external wallets (Brave, MetaMask). Judges with wallet on Ethereum mainnet get confusing sign prompts.
4. **Privy Google login auto-sign fails with `fee-grant not found: not found`** — three 500s after the user signs the grant message; toggle stays in OFF state. Auto-sign is the headline Initia-native feature, so this must be diagnosed.

This plan covers code-level fixes for items 1–3 (low risk, ~30 min) and a structured **diagnostic protocol** for item 4 (we cannot blindly patch without first reproducing and inspecting on-chain state).

Out of scope: rewriting auto-sign, switching wallet libraries, modifying the Cosmos chain genesis. Out-of-scope items belong in a follow-up plan after diagnostics.

---

## 2. Item 1 — Identity display polish (leaderboard + profile + dashboard)

### Symptom
Anywhere we show a user identity, the truncated address gets printed twice when the user has no `.init` username:
```
0x3338…ACb6   [Bronze]    ← from <InitUsername fallback />
0x3338…ACb6                ← from a sibling truncateAddress(...) call
```

This bug appears in three places:

| File | Lines | Notes |
|---|---|---|
| `apps/web/src/app/leaderboard/page.tsx` | 135 + 138-140 | InitUsername then truncateAddress sub-line |
| `apps/web/src/app/u/[address]/page.tsx` | 68-70 + 163-165 | InitUsername in `<h1>`, then a centered truncateAddress at bottom |
| `apps/web/src/app/dashboard/page.tsx` | 200 | Shows truncateAddress(address) — could upgrade to InitUsername with truncated as muted fallback for self-view |

### Fix (3 files, ~25 lines total)

For **leaderboard** + **profile**: render the truncated-address sub-line ONLY when the address actually has a `.init` username (so the second slot acts as a reference, not a duplicate).

For **dashboard**: swap raw `truncateAddress(address)` for `<InitUsername address={address} />` in the hero header. Keep the truncated address as the muted fallback (which `<InitUsername>` already does internally), so for users with no `.init` registered the visual is identical to today, and for users with `.init` the dashboard hero now shows their name.

Cleanest pattern: extract reusable per-row child components that call `useUsernameQuery(addr)` and conditionally render the sub-line — mirror `payment-status.tsx` from plan 20.

### Acceptance
- **Leaderboard:** row with `.init` → bold name on top + truncated address muted below. Row without `.init` → single line truncated address.
- **Profile** (`/u/[address]`): same rule. The bottom-centered `truncateAddress` paragraph is hidden when no `.init` is set.
- **Dashboard** hero: hero header reads either `solpochi.init` or `0x3338…ACb6` — never both stacked together.
- No regressions in any other page that uses `<InitUsername>` (e.g., turn-order, payment-status from plan 20).

### Files
- `apps/web/src/app/leaderboard/page.tsx`
- `apps/web/src/app/u/[address]/page.tsx`
- `apps/web/src/app/dashboard/page.tsx`

---

## 3. Item 2 — Dashboard: surface USDe balance alongside USDC

### Symptom
Stats grid on `/dashboard` shows only **"USDC Balance"** (`Wallet` icon, emerald). Plan 20 added MockUSDe as a first-class circle token; the dashboard makes it look like single-asset.

### Root cause
`apps/web/src/app/dashboard/page.tsx:134-140` reads only `CONTRACTS.mockUSDC` via `useReadContract`. The stats grid at line 226-231 hard-codes the `USDC Balance` label.

### Fix (one file, ~25 lines)
Read both balances in parallel (use `useReadContracts` or two `useReadContract`s) and render two stat boxes:

```tsx
const tokens = PAYMENT_TOKENS;   // already exported by plan 20
const balances = useReadContracts({
  contracts: tokens.map((t) => ({
    address: t.address,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  })),
  query: { enabled: !!address },
});
```

Stats grid expansion options:
- **Option A (recommended):** keep grid at 4 columns by combining USDC + USDe into a single "Stablecoins" stat box that lists both:
  ```
  ┌──────────────────────┐
  │ 💼 Stablecoins       │
  │ 1,250 USDC           │
  │ 800 USDe             │
  └──────────────────────┘
  ```
- **Option B:** expand grid to 5 columns, one stat per token. Simpler code, slightly tighter on mobile.

Recommendation: **Option A** for visual hierarchy — the stat box already uses a narrow column and stacking two inside it keeps mobile layout clean. Use Option B only if Option A pushes the stat-box height noticeably taller than its peers.

Acceptance:
- After connecting, both balances render. Tokens with zero balance still show as `0 USDe`.
- No new env var required (USDe address already in env from plan 20).
- Mobile: 2-column grid still fits (each stat box independent).

### Files
- `apps/web/src/app/dashboard/page.tsx` — replace single `useReadContract` with `useReadContracts`, swap the `Wallet → "USDC Balance"` stat for the new Stablecoins card.

---

## 4. Item 3 — Network warning + "Add Kitpot to wallet" helper

### Symptom
External wallets (Brave, MetaMask) connect on whatever chain they were on (often Ethereum mainnet). Judges get raw "sign this message" prompts with no chain context, and the wallet may flag the unknown sender chain.

### Architecture
InterwovenKit signs Cosmos Amino bytes, **not** EVM transactions. Strictly speaking, the wallet's selected EVM network is irrelevant for tx submission. But the UX confusion is real, and a one-click "add Kitpot to wallet" eliminates it.

### Plan
Add three small things:

#### 4.1 `apps/web/src/lib/network.ts`
Export a `KITPOT_EVM_CHAIN_PARAMS` constant in `wallet_addEthereumChain` shape (read from existing env vars):

```ts
export const KITPOT_EVM_CHAIN_PARAMS = {
  chainId: `0x${Number(process.env.NEXT_PUBLIC_KITPOT_EVM_CHAIN_ID).toString(16)}`,
  chainName: "Kitpot Testnet",
  nativeCurrency: { name: "GAS", symbol: "GAS", decimals: 18 },
  rpcUrls: [process.env.NEXT_PUBLIC_KITPOT_JSON_RPC ?? ""],
  blockExplorerUrls: ["https://scan.testnet.initia.xyz/kitpot-2"],
} as const;
```

#### 4.2 `apps/web/src/components/layout/network-warning.tsx` (NEW)
Banner component:

- Reads `chainId` + `isConnected` from `wagmi` `useAccount`.
- Returns null when:
  - Not connected, OR
  - `chainId === 64146729809684` (already on Kitpot), OR
  - User dismissed the banner this session (set in `sessionStorage` so it does not nag).
- When shown, renders a slim yellow strip:
  ```
  ⚠ Wallet kamu di chain N. Kitpot pakai Cosmos signing — tetap bisa transact, tapi
  untuk pengalaman paling smooth: [Add Kitpot to Wallet] atau [Use Google login]
  ```
- "Add Kitpot to Wallet" button calls:
  ```ts
  window.ethereum?.request({
    method: "wallet_addEthereumChain",
    params: [KITPOT_EVM_CHAIN_PARAMS],
  });
  ```
  with try/catch — show toast "Network added!" on success or "Request rejected" on error.
- "Use Google login" link is just an anchor to `/?login=google` (or trigger Privy's open-connect with social-login filter — depends on Privy SDK API surface; pick whichever is one-line).
- "Dismiss" `×` icon at right edge — sets sessionStorage flag.

Styling: match existing yellow-tone alerts in the codebase (use Tailwind tokens, no new CSS).

#### 4.3 `apps/web/src/app/layout.tsx`
Mount `<NetworkWarning />` directly under the header (above main content). Wrap in client boundary if not already.

### Acceptance
- Brave Wallet on Ethereum mainnet → connect to Kitpot → banner appears.
- Click "Add Kitpot to Wallet" → wallet popup → user approves → banner disappears (or refreshes after `chainId` update).
- Click "×" → banner gone for the session.
- After Privy Google login → banner does not appear (Privy embedded wallet has the right chain by construction).
- Dashboard / discover / circle pages still load normally underneath.

### Files
- `apps/web/src/lib/network.ts` — add `KITPOT_EVM_CHAIN_PARAMS`.
- `apps/web/src/components/layout/network-warning.tsx` — new file.
- `apps/web/src/app/layout.tsx` — mount the component.

---

## 5. Item 4 — Auto-sign optimistic UI (race-condition workaround)

### Update 2026-04-25 (after diagnostic)
User retest showed that the auto-sign toggle DID flip to ON after waiting ~60-70 seconds. The 500 `fee-grant not found` errors are from the SDK polling the feegrant query BEFORE the grant tx is mined and indexed by the rollup REST layer. **The grant succeeds; only the UI state lags.** Root cause = block finality + REST indexing latency on kitpot-2 single-validator testnet (block production ~10-15s + indexer catch-up).

This downgrades item 4 from "diagnose silent failure" to "show user we're waiting". Apply Option A from the live discussion: optimistic UI with explicit pending state.

### Behavior contract

Current `AutoSignToggle` (`apps/web/src/components/layout/auto-sign-toggle.tsx:13-57`) renders three states:
- OFF (`enabled === false`)
- ON  (`enabled === true`)
- transient `isLoading === true` only while SDK's mutation is in flight (first 2-3s)

The bug: between SDK mutation success and on-chain index pickup (~60s), `isLoading` is false and `enabled` is still false → toggle looks like it failed. Plus 500s spam the console during that window.

Add a fourth state: **PENDING_GRANT** — locally tracked, set when user clicks Enable, cleared when (a) `enabled` flips true OR (b) 90-second timeout fires.

### Fix spec

Single file: `apps/web/src/components/layout/auto-sign-toggle.tsx`

1. Add local state `const [pending, setPending] = useState(false)`.
2. In the existing `toggle()` async fn, in the `else` (enable) branch:
   - `setPending(true)` BEFORE calling `autoSign.enable(CHAIN_ID)`.
   - After `await autoSign.enable(...)` resolves, do NOT immediately `setPending(false)` — leave it true so UI keeps showing "Granting..." until polling confirms.
   - Wrap in try/finally with a fallback `setTimeout(() => setPending(false), 90_000)` for safety so we never hang.
3. Add a `useEffect` watching `enabled`: when it flips true, `setPending(false)` + clear any pending timeout.
4. Render three button states:
   - `pending && !enabled` → text: `"Granting…"`, spinner dot animating, `disabled`, hover-disabled, title attr: `"Waiting for grant tx to land on-chain (up to ~1 minute on testnet)"`.
   - `enabled` → existing "Auto-sign ON" green dot.
   - else → existing "Enable auto-sign".
5. **Suppress noisy poll-error console spam** if straightforward — e.g., wrap the click handler with a try/catch that swallows expected `"fee-grant not found"` errors but still surfaces unexpected ones via `console.warn`. If the SDK does its own polling internally and we cannot intercept, leave it alone — do NOT monkey-patch the SDK or fetch globally.

### Acceptance

- Connect via Privy Google → click "Enable auto-sign" → sign + grant in Privy popup → toggle immediately shows `"Granting…"` with disabled cursor.
- Wait ~60s → toggle auto-flips to `"Auto-sign ON"` (green).
- If the SDK never confirms within 90s, toggle returns to `"Enable auto-sign"` (timeout fallback) so user can retry.
- External-wallet (Brave) path still works — same code, just typically lands faster because Brave already has the chain configured.
- `bun tsc --noEmit` clean.

### Out of scope

- Modifying SDK source or InterwovenKit version.
- Any other auto-sign related change (disable flow, re-enable recovery — leave plan 18 §2.2 logic untouched).
- Changing block production frequency or REST indexing config — that is an ops/infra concern.

### Files

- `apps/web/src/components/layout/auto-sign-toggle.tsx` — the only file to touch.

---

## 5c. Item 5 — Faucet must mint USDC + USDe on connect (fixes createCircle revert)

### Symptom (reported 2026-04-25)
Fresh Privy email login → enable auto-sign (works after ~60s wait per item 4) → go to `/circles/new` → click Create → Privy approve modal → user signs → tx fails:
```
Transaction failed
failed to execute message; message index: 0: Reverted
```

### Root cause
Fresh wallet has only native GAS (delivered by `/api/gas-faucet`). It has **0 USDC and 0 USDe**. The flow:
1. UI calls `approveUSDC` first — succeeds (you can approve infinite allowance with zero balance).
2. UI calls `createCircle` — contract executes `_processInitialCollateral` which calls `safeTransferFrom(msg.sender, address(this), contributionAmount)`.
3. ERC20 check: `balanceOf(user) >= contributionAmount` → `0 < 100e6` → revert.

The revert has no message string (just Reverted) because OpenZeppelin's SafeERC20 wraps low-level ERC20 calls — failing balance check inside the transferFrom doesn't surface an OZ message.

### Fix — extend `/api/gas-faucet` to also mint test stablecoins

One file: `apps/web/src/app/api/gas-faucet/route.ts`

After the existing native MsgSend succeeds, fire two additional EVM calls (server-side, using same operator key derived for GAS) that mint test stablecoins to the receiver:
- `MockUSDC.mint(receiver, 5000e6)` — 5,000 USDC, enough for several circles
- `MockUSDe.mint(receiver, 5000e6)` — 5,000 USDe, mirrors USDC

Implementation notes:
- The faucet currently uses `@initia/initia.js` for the Cosmos send. For the EVM mint calls, use either:
  - **Option (a):** `viem` (already in deps) with `createWalletClient` + `privateKeyToAccount`. Simplest path. Need to derive operator EVM address from the same mnemonic via `m/44'/60'/0'/0/0` HD path (use `@scure/bip39` + `@noble/hashes` if needed, or read existing Privy-derived key). Actually viem accepts a private key directly — derive once on cold-start, cache in module scope.
  - **Option (b):** `@initia/initia.js` has an EVM helper too — investigate `wallet.execute(...)` for MsgCall envelope.
- Either way, do this AFTER the gas send succeeds (so the receiver has an auth account first).
- Wrap each mint in its own try/catch — if either fails, log warning but still return success for the GAS drip (we don't want to block GAS delivery if mint reverts).
- Response shape extension:
  ```json
  {
    "hash": "...",                  // GAS send tx
    "sender": "init1...",
    "receiver": "init1...",
    "amount": "100000000",
    "denom": "GAS",
    "stablecoinMints": {            // NEW
      "usdc": { "tx": "0x...", "amount": "5000000000" },  // or { "error": "..." }
      "usde": { "tx": "0x...", "amount": "5000000000" }
    }
  }
  ```
- Cooldown stays 1 hour per address (existing logic) — applies to the whole bundle.

### Acceptance
- Fresh Privy Google login → connect → wait for `/api/gas-faucet` POST to return → check `/bridge` page → balances now show: GAS > 0, USDC ≈ 5000, USDe ≈ 5000.
- `/circles/new` Create flow no longer reverts on collateral transfer.
- Server logs show 1 GAS send + 2 EVM mints per call (or partial success with warnings).
- `bun tsc --noEmit` clean.
- No new env vars (operator mnemonic already in `FAUCET_MNEMONIC`).

### Out of scope
- UI-side balance check before allowing Create Circle button (would be nice but redundant once faucet handles it).
- Changing mint amount per-token (5000 of each is plenty for testnet demo).
- Securing the mock-mint endpoint — these are mock contracts, anyone can mint; the rate limit is sufficient.
- Removing the `mintUSDC` button on `/bridge` — keep it as backup in case faucet mint fails.

### Files
- `apps/web/src/app/api/gas-faucet/route.ts` — sole edit.

---

## 5e. Item 6 — Friendly tx errors + pre-flight balance checks

### Symptom
When tx reverts (e.g., insufficient USDC for collateral, late grace, full circle), users see raw EVM-stack messages:
- `Transaction failed — failed to execute message; message index: 0: Reverted`
- `execution reverted`
- Hex-encoded revert data with no decoded reason

These are unactionable. User does not know: do I need more USDC? Did I forget to approve? Is the circle full? Is this a chain bug?

### Two-pronged fix

**Prong A — Pre-flight checks (prevent reverts that are predictable):**
- Before any write tx that depends on user's balance/allowance/state, run a client-side check first.
- If precondition fails, do NOT submit the tx; instead show an actionable banner inline with the form (not just a toast — banner stays until the user fixes it or dismisses).

**Prong B — Friendly error mapping (decode reverts that did slip through):**
- Catch errors from every `useKitpotTx` write call.
- Run them through a `parseTxError(err)` helper that returns `{ title, hint, action? }`.
- Render in the existing error display areas (already exist in `create-circle-form.tsx:248-252` and similar) — replace raw `error.message` with the parsed hint.

### Pre-flight check mapping

| Action | Pre-check | Failure message |
|---|---|---|
| `createCircle` | `tokenBalance >= contributionAmount` | "You don't have enough \{symbol\}. Mint at the [Faucet](/bridge)." |
| `createCircle` | `tokenAllowance >= contributionAmount` | (handled inline — auto-approve before create, already exists) |
| `joinCircle` | `tokenBalance >= contributionAmount` | "You don't have enough \{symbol\} for collateral. Mint at the [Faucet](/bridge)." |
| `joinCircle` | `circle.memberCount < circle.maxMembers` | "This circle is already full." |
| `joinCircle` | `circle.status === Pending(0)` | "This circle has already started." |
| `joinCircle` | `userTier >= circle.minimumTier` | "Your trust tier (\{userTier\}) is below the minimum (\{minimumTier\})." |
| `deposit` | `tokenBalance >= contributionAmount` | "You don't have enough \{symbol\}. Mint at the [Faucet](/bridge)." |
| `deposit` | `!hasPaid[currentCycle][user]` | "You already paid this cycle." |
| `deposit` | `circle.status === Active(1)` | "This circle is not active right now." |
| `advanceCycle` | `block.timestamp >= cycleStart + cycleDuration` | "Cycle hasn't elapsed yet. Wait \{remainingSec\}s." |

### Friendly error mapping (revert string → user message)

`apps/web/src/lib/tx-errors.ts` (NEW) exports:
```ts
interface ParsedError {
  title: string;
  hint: string;
  action?: { label: string; href: string };
}
export function parseTxError(err: unknown): ParsedError;
```

Behavior: extract revert reason via best-effort:
- If error message contains a known require string ("Members 3-20", "Grace > cycle", "Not a member", "Cycle not elapsed", "Already paid this cycle", "Penalty too high", "Circle full") → map to friendly message.
- If contains "ERC20InsufficientBalance" or `Reverted` after a token transfer call → assume balance issue; return hint pointing to `/bridge`.
- If contains "user rejected" or "User denied" or "request rejected" → "You cancelled the signature."
- If contains "fee-grant not found" → "Auto-sign grants are still indexing on-chain. Try again in 30 seconds."
- If contains "insufficient funds" → "Wallet has no GAS. Visit the [Faucet](/bridge) or wait for auto-funding."
- Default fallback → "Transaction failed. Please try again or contact support." with the raw message in a collapsible `<details>` for debugging.

### Files

- `apps/web/src/lib/tx-errors.ts` — NEW helper.
- `apps/web/src/components/circle/create-circle-form.tsx` — pre-flight balance + parsed error.
- `apps/web/src/components/circle/join-form.tsx` — pre-flight + parsed error.
- `apps/web/src/components/circle/deposit-button.tsx` — pre-flight + parsed error.
- (Optional polish) `apps/web/src/components/ui/error-banner.tsx` — small reusable component if the inline error block in each form gets duplicated; otherwise keep inline.

### Acceptance

- Fresh wallet with 0 USDC → open `/circles/new` with USDC selected → form shows persistent banner: "You don't have enough USDC. [Mint at Faucet]" and disables the Create button. Switching token to USDe also shows the banner if USDe balance is 0.
- Same flow with USDe balance ≥ contribution → banner gone, Create button enabled.
- A user who somehow bypasses the pre-check (race condition with state) → still gets a friendly post-revert error, never the raw "Reverted" string.
- All other forms (join, deposit) get the same treatment.
- `bun tsc --noEmit` clean.

### Out of scope

- Decoding bytes-level revert data via ABI selectors (overkill — string match on existing require messages is sufficient since our contract uses string reasons).
- Internationalization — keep messages in English for now (mirrors rest of the app).
- Toast library swap — use whatever toast is already in the app, or just inline banners.

---

## 5f. Item 7 — Surface NFT achievements properly (on-chain SVG + explorer links)

### Symptom
Current `/achievements` and `/u/[address]` pages list earned achievements but:
- Show only generic placeholder icons (lucide SVGs from `ACHIEVEMENT_ICONS`), NOT the actual on-chain SVG image baked into the NFT's `tokenURI`.
- No "View on Explorer" link per badge — judges cannot verify the NFT is real on-chain in one click.
- No "soulbound — non-transferable" badge UI even though the contract enforces it.
- No earned timestamp / tx hash visible.
- No toast or animation when a new NFT is minted (user sees nothing happen — bad gamification feedback).

For hackathon scoring, the NFT angle (Initia's "Gaming & Consumer" track) is gamification-critical. Judges should be able to:
1. See the actual NFT visual rendered from on-chain SVG.
2. Click → explorer → confirm it exists on `kitpot-2` chain.
3. Understand it's soulbound.
4. Get instant feedback when earning a new badge.

### Fix scope (single big item, ~1 hour)

#### 7.1 Decode and render on-chain SVG
The contract's `tokenURI(tokenId)` returns `data:application/json;base64,<...>` with the SVG embedded as `data:image/svg+xml;base64,<...>`. Render the actual SVG, not a generic icon:

- Add a hook `useTokenSvg(tokenId: bigint)` in `apps/web/src/hooks/use-achievements.ts` that:
  - Calls `tokenURI(tokenId)` via `useReadContract`.
  - Decodes the base64 JSON payload.
  - Returns `{ name, description, image, attributes }` parsed.
- Use `<img src={image} alt={name} />` to display the real on-chain SVG (the data URI works directly as an img src).

For `/achievements` page: when a slot is unlocked, show the real SVG. When locked, keep the existing greyed icon.

#### 7.2 In-app NFT verification (NO Initia public scan dependency)

CONSTRAINT: `https://scan.testnet.initia.xyz/kitpot-2` returns 404 → kitpot-2 is NOT in Initia's public chain registry. Cannot use the public explorer.

Solution: build a tiny "Verify on-chain" expander inside each badge card. No external explorer, no hacks.

Each unlocked badge card includes a `<details>` (or hover popover) showing:

```
Verify on-chain
  Contract:  0x956a0285b10c8afaeadef98a77b1da48642dd97a  [copy]
  Token ID:  7                                           [copy]
  Earned:    2026-04-25 14:32 UTC
  Chain ID:  kitpot-2 (EVM 64146729809684)
  RPC URL:   https://kitpot-rpc.viandwi24.com/           [copy]
  
  Verify yourself:
    cast call <contract> "ownerOf(uint256)" <tokenId> --rpc-url <rpc>
    → returns your address ✓
```

Each `[copy]` button calls `navigator.clipboard.writeText(value)`. The cast command snippet is selectable text inside a code block.

Implementation:
- New component `apps/web/src/components/achievements/verify-onchain.tsx` — accepts `{ tokenId, earnedAt }` props and renders the expander.
- Reads `CONTRACTS.achievements` and `process.env.NEXT_PUBLIC_KITPOT_JSON_RPC` from existing config.
- No explorer URL needed; entire verification lives in the snippet.

Header note on `/achievements`: include a brief paragraph:
> "Kitpot-2 is a custom Initia rollup not yet listed in the public registry. Each soulbound NFT here is real — verify any badge via the [JSON-RPC contract call](#) snippet under each card, or fetch directly from `https://kitpot-rpc.viandwi24.com`."

If we later get added to the Initia registry, swap the snippet for an explorer link in one place.

#### 7.3 Soulbound badge UI
Each unlocked card should show a small lock icon + "Soulbound" text label so judges immediately understand non-transferability.

```
┌─────────────────────────┐
│ [SVG]                   │
│ First Circle            │
│ 🔒 Soulbound NFT        │
│ Earned 2026-04-25       │
│ [View on explorer →]    │
└─────────────────────────┘
```

#### 7.4 Toast / banner when new NFT awarded
After a tx that triggers an award (joinCircle, advanceCycle, deposit), poll `useAchievementTokenIds` once; if the count increased, fire a toast: "🎖 New badge earned: \{name\}" with a link to `/achievements`.

Implementation idea (minimum-invasive): in `useKitpotTx` `send()` function, after successful tx receipt, refetch `getAchievements(user)`; if count increased vs cached count, emit a toast event. Use whatever toast lib already in the app (sonner? shadcn?). If no toast lib → render a slim banner under the header for 5 seconds.

If no toast lib exists and adding one is risky → SKIP toast subitem; just rely on user navigating to `/achievements` themselves. Document in code comment.

#### 7.5 Stronger /u/[address] integration
Profile page should also show NFTs prominently:
- Section "Achievements" at the top of profile, with a horizontal grid of earned NFT SVGs.
- "Total: X / 12 badges earned" counter.
- Same explorer link pattern.

### Files
- `apps/web/src/hooks/use-achievements.ts` — add `useTokenSvg` hook.
- `apps/web/src/app/achievements/page.tsx` — render real SVG, add explorer link, soulbound label, earned date.
- `apps/web/src/components/achievements/achievement-gallery.tsx` — same upgrade for profile pages.
- `apps/web/src/app/u/[address]/page.tsx` — surface achievements section more prominently.
- `apps/web/src/hooks/use-kitpot-tx.ts` — (optional) post-tx refetch + toast trigger; SKIP if toast infra not present.

### Acceptance
- After earning a badge (e.g., complete a full circle), `/achievements` page shows the actual coloured SVG inside the card, not the placeholder icon.
- Each unlocked card has a "Verify on-chain" expander showing contract address, token ID, earned date, RPC URL, and a copy-pasteable `cast call ownerOf` snippet.
- Each unlocked card shows "🔒 Soulbound NFT" subtitle.
- `/u/[address]` profile shows an Achievements row with NFT thumbnails.
- `/achievements` header has a one-line note explaining why no public explorer link (kitpot-2 not in registry yet) and how to verify directly via JSON-RPC.
- `bun tsc --noEmit` clean.

### Out of scope
- Off-chain image generation / IPFS — the contract already returns on-chain SVG.
- New achievement types — contract enum is fixed.
- Animations beyond a simple toast (no fancy lottie / particle effects).
- Sharing NFT to social media (deeplink to twitter etc.) — nice-to-have, defer.

---

## 5d. README scope guidance (NON-CODE — for the README writing session)

When writing `README.md` and `README_DORAHACKS.md`:

- **Auto-sign claim must be honest**: describe it as **session-based / frontend-only** auto-signing via InterwovenKit (`@initia/interwovenkit-react`). The user enables auto-sign once per session, and as long as the tab is open, deposits/joins sign silently. If the user closes the tab, deposits return to manual approval. Do **not** describe it as "background", "fully automated", "no-touch", "headless", or "while you sleep" — those would overclaim.
- A **future roadmap section** can mention that a server-side bot wallet using `x/authz` + `x/feegrant` could enable truly background auto-pay (the contract is already authz-compatible), but make clear this is **not shipped** in the current submission.
- Pitch line that is honest and still strong: *"Once you enable auto-sign, paying contributions feels like Apple Pay — silent and instant — for the duration of your session."*

Do not write any background-pay claims that require off-chain bots in the demo video either.

---

## 5b. (Archived) Original diagnostic protocol (kept for reference, no longer required)

### Symptom (verbatim from user 2026-04-25)
> Login pakai Privy Google email → enable auto-sign → approve → muncul Privy sign-message window → klik Sign → muncul dialog grant kitpot-2 → klik Grant → tombol enable auto-sign **ga berubah state-nya** (gagal silently). Console log shows 3 endpoints returning HTTP 500 with body:
> ```json
> {"code":13, "message":"fee-grant not found: not found", "details":[]}
> ```

### Why this is item 4 not item 1
Auto-sign is the headline Initia-native feature for our hackathon scoring. Plan 18 §13 + plan 19 §12 both say "silent deposit working end-to-end" — but those tests likely used external wallet (Brave). The Privy embedded-wallet path may have regressed or never worked.

### Diagnostic protocol — DO NOT BLINDLY PATCH

This is investigation-first because the error code (`13`) and the `"fee-grant not found: not found"` message is a `cosmos.feegrant` query error, not a sign error. Multiple root causes possible — must identify before fixing.

#### Step 1 — Reproduce + capture full network trace
Open `https://kitpot.vercel.app` in a fresh Chrome profile (no extensions, no existing wallet). Sign in via Privy Google. Open DevTools → Network tab, filter `XHR/Fetch`. Click "Enable auto-sign". Capture:
- The sign-message dialog payload (Privy's interface usually surfaces this as a JSON-RPC method call).
- The **3 failing 500 endpoints** — exact URL, request body, response body, request order.
- Any successful grant-broadcast tx hash (look for tx hashes returned from `/cosmos/tx/v1beta1/txs`).

Save the captures into `docs/builder/notes/2026-04-25-autosign-debug.md` (raw text, not summarized).

#### Step 2 — Identify which 3 endpoints fail
Likely candidates (educated guess to verify):
- `POST /cosmos/tx/v1beta1/txs` — broadcasting MsgGrantAllowance
- `GET /cosmos/feegrant/v1beta1/allowance/{granter}/{grantee}` — querying the grant
- `GET /cosmos/authz/v1beta1/grants?granter=...&grantee=...&msg_type_url=/minievm.evm.v1.MsgCall` — querying authz grant

Confirm which three fire, and in what order. The order tells you whether SDK queries BEFORE waiting for the grant tx to mine (race condition) or after (chain genuinely missing the grant).

#### Step 3 — Verify chain has `x/feegrant` module enabled
On a machine that can reach the rollup REST endpoint:
```bash
curl -s https://kitpot-rest.viandwi24.com/cosmos/feegrant/v1beta1/allowances/init1xxxx \
  | jq .
```
Use ANY existing init address. Expected outcomes:
- `200 + {"allowances": []}` → module enabled, just no grants for this user.
- `404 / "no module" / "unknown route"` → module NOT enabled. Genesis fix needed (out of scope for this plan; document in `docs/builder/notes/`).
- `500 + "fee-grant not found"` → module enabled but query is bugged or grant address mismatch.

#### Step 4 — Compare with external-wallet path
Repeat the auto-sign flow with Brave Wallet (the operator key has feegrants per plan 18, so this should work). Capture the same 3 endpoint requests. Diff the request bodies between Privy and Brave paths:
- Are the granter / grantee addresses the same shape (`init1...`)?
- Are the `msg_type_url`s identical?
- Is the broadcast tx body identical except for signer info?

Differences point to where Privy's flow diverges.

#### Step 5 — Inspect Privy embedded-wallet derivation
InterwovenKit derives a "Ghost Wallet" from the user's primary signer. With Privy embedded wallets, the signer is Privy's secp256k1 key. Verify:
- The Ghost Wallet `init1...` address Kitpot derives matches what InterwovenKit submits on-chain.
- The address is **stable across page reloads** (a non-deterministic derivation would break feegrant lookups).

To inspect: log the derived address in DevTools console after enabling auto-sign. Cross-check against `cosmos/auth/v1beta1/accounts/{addr}` — does the address have an account on chain?

### Likely fixes (apply only after diagnosis)

If diagnostic step 2 shows "race condition" (SDK queries feegrant before tx mines):
- Workaround: add a 2-second `setTimeout` retry around the `autoSign.enable()` call (ugly but ships).
- Better: file an issue with InterwovenKit; pin a known-good SDK version.

If step 3 shows module not enabled:
- Document as a chain-config bug in `docs/builder/decisions.md`.
- Submission workaround: README must say "auto-sign currently works for external wallets only; Privy social-login auto-sign is on the roadmap pending chain config update".

If step 5 shows derivation mismatch:
- Possibly Privy's signer interface returns a key in a non-standard format. Need to align with what InterwovenKit expects.
- Likely SDK incompatibility — same workaround as race condition.

### Files
- `docs/builder/notes/2026-04-25-autosign-debug.md` — raw diagnostic capture (NEW).
- `docs/builder/decisions.md` — record root cause + chosen workaround (UPDATE).
- Source code change is conditional on diagnosis — do not pre-write the fix in this plan.

---

## 6. Execution order

1. **Items 1, 2, 3, 4 all parallel-safe** — independent file edits.
2. Hand all four to one AI builder session under the prompt below. Estimated 40-50 minutes total.
3. Builder must NOT touch any file outside the explicit list per item.
4. After build green and tsc clean, user drives commit + push + Vercel redeploy + Chrome QA.

Item 4 is now a code fix (Option A optimistic UI), no longer diagnostic. The earlier diagnostic protocol is kept in §5b for reference if the optimistic UI does not behave as expected.

---

## 7. Out of scope (explicitly)

- Modifying the Cosmos chain genesis (e.g., enabling missing modules) — requires VPS rebuild; deferred to a separate ops plan.
- Switching from Privy to a different social-login provider.
- Re-styling the welcome modal.
- Adding `wallet_switchEthereumChain` after `wallet_addEthereumChain` — leave that to the wallet's UI; a single click to add is enough.
- README + demo video — covered by the still-pending plan 19 §10 deliverables.

---

## 8. Success criteria — all seven items (coding only)

Coding is complete when ALL the following are true:

- Leaderboard rows for addresses without `.init` show a single line, not two duplicates.
- `/dashboard` stats grid shows USDe balance alongside USDC.
- `<NetworkWarning />` exists, mounted in `layout.tsx`, with `wallet_addEthereumChain` action and session-dismiss.
- `AutoSignToggle` shows `"Granting…"` pending state with 90s timeout fallback.
- `/api/gas-faucet` mints 5,000 USDC + 5,000 USDe alongside GAS drip; partial failures don't block GAS.
- `parseTxError` helper wired into create/join/deposit forms; pre-flight balance checks gate submit; raw "Reverted" never shown.
- `/achievements` and `/u/[address]` render real on-chain SVGs (not placeholder icons) with "Verify on-chain" expander, soulbound label, earned date. Header note explains kitpot-2 is not yet in the public registry and shows how to verify via JSON-RPC.
- `bun tsc --noEmit` passes.
- No test/build/deploy actions taken (deferred to user).
- README scope guidance (§5d) followed when README is written separately.

---

## 9. References

- Plan 20 — multi-token + bridge withdraw: `docs/plans/20-bridge-withdraw-multitoken.md`
- Plan 19 — judge-POV testing, includes auto-sign smoke test: `docs/plans/19-testings-as-judges-pov.md`
- InterwovenKit autosign docs: <https://docs.initia.xyz/interwovenkit/features/auto-sign>
- `wallet_addEthereumChain` spec: EIP-3085
- BlockForge auto-sign reference: `docs/examples/blueprint-1.md`
