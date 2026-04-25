# Plan 22 — Pull-Claim Model + Permissionless Keeper

> **Created:** 2026‑04‑25 (post-plan-21 ship)
> **Status:** Design / planning. Execution after submission OR if deadline allows (high risk pre-submission because it requires contract redeploy that wipes existing demo state).
> **Goal:** replace push-based `advanceCycle` with a pull-based `claimPot` (recipient-only, atomic with cycle advance), plus a permissionless `substituteClaim` safety net for dormant recipients (any address can call it; pot still lands in the recipient's wallet, caller earns a tiny reward). Tighten time math and config validators in the same pass.
> **Reference:** competitor analysis with CrediKye (`docs/plans/21-…` discussion log) — they use Telegram bot as off-chain notifier; we use on-chain incentives + permissionless keeper.

---

## 1. Why this plan exists

### 1.1 Problem with current architecture

`advanceCycle()` is permissionless (anyone can call after `cycleStart + cycleDuration`), but in practice **nobody is incentivized to call it**:
- Members who already paid don't need to do anything until next cycle.
- The recipient, who DOES benefit, has no UI affordance reminding them.
- A random user has zero economic incentive.

Result: pot can sit undistributed indefinitely. Plan 18/19 demos worked because operator manually clicked the button; in production this is a **silent failure mode**.

### 1.2 Goals

1. **Pull model**: recipient claims their own pot — they have skin in the game (they want the money), so they're the natural caller.
2. **Permissionless safety net**: if recipient goes dormant, ANY address can trigger pot delivery to that recipient after a grace period, and earn a small keeper fee for the effort. Circle never gets stuck.
3. **Atomic state advance**: claiming = pot transfer + cycle increment + next-cycle clock starts, all in one tx. No partial states.
4. **Tighter time math**: every timestamp transition has explicit invariants documented in code; UI can show accurate countdowns.
5. **Better config validation**: reject obviously-bad circle params at create time so users don't ship deployments that brick themselves.

### 1.3 Non-goals

- Telegram bot / mini app integration (defer — separate plan).
- Off-chain notifier (post-hackathon).
- Decentralized keeper network (Gelato/Chainlink) — only for very-mature production.
- Multi-recipient pot (e.g., split pot to two members) — out of ROSCA spec.

---

## 2. Contract changes (KitpotCircle.sol)

### 2.1 New / modified functions

#### `claimPot(uint256 circleId)` — NEW
Recipient-only. Replaces the recipient-receiving side of `advanceCycle()`.

```solidity
function claimPot(uint256 circleId)
    external
    nonReentrant
    whenNotPaused
    onlyCircleStatus(circleId, CircleStatus.Active)
{
    Circle storage c = _circles[circleId];
    Member[] storage members = _circleMembers[circleId];

    // Permission: only the current cycle's recipient can claim
    address recipient = members[c.currentCycle].addr;
    require(msg.sender == recipient, "Not your turn");

    uint256 cycleStart = cycleStartTimes[circleId][c.currentCycle];
    require(cycleStart > 0, "Cycle not started");
    require(block.timestamp >= cycleStart + c.cycleDuration, "Cycle not elapsed");

    _processMissedPayments(circleId);

    uint256 totalPot = c.contributionAmount * c.maxMembers;
    uint256 fee = (totalPot * platformFeeBps) / 10000;
    uint256 payout = totalPot - fee;

    IERC20(c.tokenAddress).safeTransfer(recipient, payout);
    if (fee > 0) accumulatedFees[c.tokenAddress] += fee;

    cycleRecipient[circleId][c.currentCycle] = recipient;
    members[c.currentCycle].hasReceivedPot = true;

    reputation.recordPotReceived(recipient, payout);
    _maybeAwardFirstPot(recipient, circleId);

    emit PotClaimed(circleId, c.currentCycle, recipient, payout, fee);

    _advanceToNextCycle(circleId);
}
```

#### `substituteClaim(uint256 circleId)` — NEW
Permissionless. After dormant-grace, anyone can trigger pot delivery; pot still goes to the actual recipient (NOT the caller); caller gets `KEEPER_REWARD_BPS` cut.

```solidity
uint256 public constant DORMANT_GRACE = 7 days;
uint256 public constant KEEPER_REWARD_BPS = 10; // 0.1% of pot

function substituteClaim(uint256 circleId)
    external
    nonReentrant
    whenNotPaused
    onlyCircleStatus(circleId, CircleStatus.Active)
{
    Circle storage c = _circles[circleId];
    Member[] storage members = _circleMembers[circleId];

    address recipient = members[c.currentCycle].addr;
    uint256 cycleStart = cycleStartTimes[circleId][c.currentCycle];
    require(cycleStart > 0, "Cycle not started");
    require(
        block.timestamp >= cycleStart + c.cycleDuration + DORMANT_GRACE,
        "Wait for dormant grace"
    );

    _processMissedPayments(circleId);

    uint256 totalPot = c.contributionAmount * c.maxMembers;
    uint256 platformFee = (totalPot * platformFeeBps) / 10000;
    uint256 keeperReward = (totalPot * KEEPER_REWARD_BPS) / 10000;
    uint256 payout = totalPot - platformFee - keeperReward;

    IERC20 token = IERC20(c.tokenAddress);
    token.safeTransfer(recipient, payout);
    token.safeTransfer(msg.sender, keeperReward);
    if (platformFee > 0) accumulatedFees[c.tokenAddress] += platformFee;

    cycleRecipient[circleId][c.currentCycle] = recipient;
    members[c.currentCycle].hasReceivedPot = true;

    reputation.recordPotReceived(recipient, payout);
    _maybeAwardFirstPot(recipient, circleId);

    emit SubstituteClaimed(circleId, c.currentCycle, recipient, msg.sender, payout, platformFee, keeperReward);

    _advanceToNextCycle(circleId);
}
```

#### `_advanceToNextCycle(uint256 circleId)` — NEW INTERNAL
Single source of truth for the cycle-increment logic (extracted from current `advanceCycle`). Keeps `claimPot` and `substituteClaim` consistent.

```solidity
function _advanceToNextCycle(uint256 circleId) internal {
    Circle storage c = _circles[circleId];
    Member[] storage members = _circleMembers[circleId];

    uint256 nextCycle = c.currentCycle + 1;

    if (nextCycle < c.totalCycles) {
        // Start the clock for the next cycle deterministically:
        // use the previous cycle's end time, NOT block.timestamp, so a long
        // delay before claim does not extend the next cycle's deadline.
        uint256 prevCycleStart = cycleStartTimes[circleId][c.currentCycle];
        cycleStartTimes[circleId][nextCycle] = prevCycleStart + c.cycleDuration;
    }

    c.currentCycle = nextCycle;

    if (c.currentCycle >= c.totalCycles) {
        c.status = CircleStatus.Completed;
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i].addr;
            reputation.recordCircleCompleted(m, circleId);
            _maybeAwardCompletionAchievements(m, members[i].missedPayments, circleId);
        }
        emit CircleCompleted(circleId);
    } else {
        emit CycleAdvanced(circleId, c.currentCycle);
    }
}
```

**Critical design decision:** `cycleStartTimes[nextCycle] = prevCycleStart + cycleDuration` instead of `block.timestamp`. This means the next cycle's deadline is **deterministic** — a sluggish recipient who waits 6 days to claim does NOT push the next cycle's deadline 6 days later. Members already deposit-due know exactly when the next cycle ends.

**Tradeoff:** if claim is delayed N seconds beyond `cycleStart + cycleDuration`, the next cycle's effective duration shrinks by N. If N > cycleDuration, next cycle is already due before it started — depositors must rush. To prevent this, add a guard:

```solidity
if (block.timestamp > cycleStartTimes[circleId][nextCycle] + c.cycleDuration) {
    // Next cycle would have already lapsed — start fresh from now.
    cycleStartTimes[circleId][nextCycle] = block.timestamp;
}
```

#### `advanceCycle(uint256 circleId)` — DEPRECATED
Keep as a thin alias that calls `claimPot` if msg.sender == recipient, else `substituteClaim` if dormant, else revert. Eases migration for any UI/script still pointing at the old function. Mark in NatSpec: `@dev DEPRECATED — prefer claimPot or substituteClaim`.

### 2.2 New view functions for UI countdowns

```solidity
struct CycleTiming {
    uint256 cycleStart;      // unix
    uint256 cycleEnd;        // cycleStart + cycleDuration
    uint256 dormantDeadline; // cycleEnd + DORMANT_GRACE
    uint256 nowTs;           // block.timestamp at query
    bool    canRecipientClaim;
    bool    canSubstituteClaim;
    address recipient;
}

function getCycleTiming(uint256 circleId) external view returns (CycleTiming memory);
```

Frontend reads this once and shows the right countdown without doing math itself.

### 2.3 Tightened config validation in `createCircle`

Add to existing requires:
```solidity
require(cycleDuration >= 60, "Cycle too short (min 60s)");
require(cycleDuration <= 365 days, "Cycle too long");
require(gracePeriod > 0, "Grace must be > 0");
require(gracePeriod < cycleDuration, "Grace must be < cycle");  // strict <, not <=
require(maxMembers >= 3 && maxMembers <= 20, "Members 3-20");
require(contributionAmount > 0, "Contribution > 0");
require(latePenaltyBps <= MAX_LATE_PENALTY_BPS, "Penalty too high");
require(IERC20(tokenAddress).balanceOf(address(this)) >= 0, "Bad token"); // sanity ping
require(bytes(name).length > 0 && bytes(name).length <= 64, "Bad name length");
require(bytes(initUsername).length > 0, "Username required");
```

### 2.4 New events

```solidity
event PotClaimed(uint256 indexed circleId, uint256 indexed cycleIndex, address indexed recipient, uint256 payout, uint256 fee);
event SubstituteClaimed(uint256 indexed circleId, uint256 indexed cycleIndex, address indexed recipient, address keeper, uint256 payout, uint256 platformFee, uint256 keeperReward);
```

Subgraph/explorer can now distinguish recipient-claimed vs substitute-claimed pots, useful for analytics.

### 2.5 Internal helpers (extracted from current code)

- `_processMissedPayments(circleId)` — loops members, slashes collateral for non-payers (extracted from current `advanceCycle`).
- `_maybeAwardFirstPot(recipient, circleId)` — extracted achievement award logic.
- `_maybeAwardCompletionAchievements(member, missed, circleId)` — same for circle completion.

These reduce code duplication between `claimPot` and `substituteClaim`.

---

## 3. Frontend changes (apps/web)

### 3.1 New hook bindings in `use-kitpot-tx.ts`

```ts
claimPot: (circleId: bigint) => send([msgCall(..., "claimPot", [circleId], ...)]),
substituteClaim: (circleId: bigint) => send([msgCall(..., "substituteClaim", [circleId], ...)]),
```

Keep `advanceCycle` for backward compat if old contract still in use during migration window.

### 3.2 Circle detail page updates (`apps/web/src/app/circles/[id]/page.tsx`)

Replace existing `<AdvanceCycleButton>` with two conditional buttons:

```
┌─ Cycle 0 of 3 ──────────────────────────────────┐
│ Recipient: Alice (alice.init)                   │
│ Cycle ends in: 12s    [countdown timer]         │
│                                                  │
│ [if connected wallet === recipient]              │
│   [✨ Claim 297 USDC pot →]                      │
│                                                  │
│ [else if cycle elapsed but recipient inactive]   │
│   [⏰ Recipient hasn't claimed for 6 days,       │
│    after 1 more day anyone can substitute claim] │
│                                                  │
│ [else if past dormant deadline]                  │
│   [🚀 Substitute claim (earn 0.1% keeper fee) →] │
└──────────────────────────────────────────────────┘
```

Logic:
- Use `getCycleTiming(circleId)` for state machine.
- Show recipient-only "Claim Pot" button when `canRecipientClaim && msg.sender === recipient`.
- Show permissionless "Substitute Claim" button when `canSubstituteClaim` (anyone including recipient).
- During elapsed-but-pre-dormant window, show informational banner "Waiting for recipient to claim. After {N} more time, anyone can trigger substitute claim."
- Live countdown: tick every second, recompute from `cycleEnd` and `dormantDeadline`.

### 3.3 New component `<CycleCountdown>`

```tsx
interface Props { deadlineTs: number; label: string; }
function CycleCountdown({ deadlineTs, label }: Props) {
  const [now, setNow] = useState(Date.now() / 1000);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, deadlineTs - now);
  const fmt =
    remaining < 60 ? `${Math.floor(remaining)}s`
    : remaining < 3600 ? `${Math.floor(remaining/60)}m ${Math.floor(remaining%60)}s`
    : `${Math.floor(remaining/3600)}h ${Math.floor((remaining%3600)/60)}m`;
  return <span>{label}: <strong>{fmt}</strong></span>;
}
```

### 3.4 Pre-flight + error mapping updates (extends plan 21 §5e)

Add to `parseTxError`:
- `"Not your turn"` → "Only the current cycle's recipient can claim. Wait for your turn."
- `"Cycle not elapsed"` → "Cycle still in progress. Try again after {countdown}s."
- `"Wait for dormant grace"` → "Recipient still has time to claim. Substitute claim opens after the dormant grace period."

### 3.5 Discover / dashboard / profile updates

- Show a small "needs claim" indicator next to circles where the connected wallet is the current recipient and pot is claimable.
- Optional: badge "Keeper opportunity" on circles past dormant deadline (anyone can earn 0.1%).

---

## 4. Test scripts

### 4.1 `scripts/test/prove-pull-claim.ts` — happy path

1. Generate Alice + Bob fresh keys, fund + mint USDe.
2. Operator creates 3-member USDe circle.
3. All 3 deposit cycle 0 on time.
4. Wait `cycleDuration + 1s`.
5. Operator (member 0, recipient) calls `claimPot(circleId)`.
6. Assert: Operator balance gained `payout`, `currentCycle === 1`, `cycleStartTimes[1] === cycleStartTimes[0] + cycleDuration` (deterministic).
7. Repeat for Alice (member 1) and Bob (member 2). Last claim moves status to `Completed`.

### 4.2 `scripts/test/prove-substitute-claim.ts` — dormant scenario

1. Setup as above through cycle 0 deposits.
2. Wait `cycleDuration + DORMANT_GRACE + 1s`.
3. Bob (NOT the recipient) calls `substituteClaim(circleId)`.
4. Assert: Operator (recipient) balance gained `payout`, Bob (keeper) balance gained `keeperReward`, `currentCycle === 1`, event `SubstituteClaimed` emitted with both addresses.

### 4.3 `scripts/test/prove-time-determinism.ts`

1. Setup, all deposit.
2. Wait `cycleDuration + 30s` (longer than needed).
3. Recipient claims late.
4. Assert: `cycleStartTimes[1]` is `cycleStartTimes[0] + cycleDuration` (NOT `block.timestamp` of claim). Next cycle deadline is calculable in advance.

### 4.4 `scripts/test/prove-config-validation.ts`

For each invalid config, assert createCircle reverts with the right reason:
- cycleDuration = 0 → "Cycle too short (min 60s)"
- gracePeriod = 0 → "Grace must be > 0"
- gracePeriod = cycleDuration → "Grace must be < cycle"
- maxMembers = 2 → "Members 3-20"
- name = "" → "Bad name length"
- name length > 64 → same
- initUsername = "" → "Username required"
- latePenaltyBps = 1001 → "Penalty too high"
- contributionAmount = 0 → "Contribution > 0"

---

## 5. Migration / deployment strategy

### 5.1 The hard truth

Contract redeploy via `scripts/sync-deploy.sh` **wipes existing 4 demo circles**. This includes circle 3 (the "Proof Demo USDe Circle" we created during plan 21 prove-pot-and-late testing).

For hackathon submission, this is acceptable IF we re-seed demo data after redeploy. But it adds risk:
- Redeploy might fail (gas estimation, state issues).
- Re-seed script must work first try (needs ACCOUNT_1, ACCOUNT_2 keys).
- Vercel env update + redeploy adds another chain of "did we update everything?".

### 5.2 Recommended timing

**DO NOT execute this plan before submission deadline (2026-04-27).** Submit Kitpot with current push-based architecture (which works). After submission, this plan becomes priority 1.

If we have a clear, calm 6+ hour buffer pre-deadline AND pull-claim is unambiguously better for the demo video, we can reconsider — but only with a pre-recorded fallback demo using the current push architecture in case redeploy goes sideways.

### 5.3 Step-by-step (when execution is approved)

1. Update `KitpotCircle.sol` with all changes from §2.
2. `forge test -vv` — all green.
3. `./scripts/sync-deploy.sh` — redeploy all contracts, sync env files, update Vercel.
4. Manually verify Vercel env vars match new addresses (per CLAUDE.md deploy rules).
5. Trigger Vercel redeploy without build cache.
6. Re-seed at least 2 demo circles via `scripts/test/prove-pull-claim.ts setup`.
7. Smoke test in Chrome: create circle, all deposit, wait, claim, see pot land.
8. Update `docs/plans/19-…` §12 execution log with new addresses + claim flow proof.
9. Re-record any submission demo video sections that show the claim button.

---

## 6. Documentation updates

### 6.1 `CLAUDE.md`
Add to "Contract rules" section:
> Pot distribution uses **pull model**: recipient calls `claimPot(circleId)` after `cycleStart + cycleDuration`; if recipient is dormant past `cycleEnd + DORMANT_GRACE` (7 days), anyone can call `substituteClaim(circleId)` to deliver the pot to the recipient address (still goes to recipient, NOT caller) and earn `KEEPER_REWARD_BPS` (0.1%) for the trigger. The legacy `advanceCycle()` is deprecated and only kept as a router.

### 6.2 `README.md` "Architecture" section
> Pot distribution avoids the common ROSCA failure mode of "stuck circles" via two layers:
> 1. **Recipient claim (pull model):** the cycle's beneficiary calls `claimPot()` to receive the pot. They are economically motivated to do so (it's their money).
> 2. **Permissionless keeper safety net:** if the recipient is dormant for 7 days past the cycle end, any wallet can call `substituteClaim()`. The pot still goes to the original recipient's address; the caller earns 0.1% as a keeper fee. No bots required, no missed pots.

### 6.3 `docs/builder/decisions.md`
Record the decision:
- Date: when executed.
- Decision: pull model + permissionless keeper.
- Why: prevents stuck circles without dependence on bot infrastructure; aligns with DeFi pull patterns (Compound, Aave).
- Alternatives considered: push-based with cron bot (rejected — SPOF, cost), Chainlink Automation (rejected — not yet on Initia, costs $).

---

## 7. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Redeploy fails mid-flight, leaves contracts in broken state | Low | `sync-deploy.sh` exits on first failure; re-run is idempotent |
| Existing demo circles lost after redeploy | Certain | Re-seed via prove-pull-claim.ts; document in changelog |
| Frontend code references old function name | Medium | grep `advanceCycle` after merge, replace with `claimPot`; deprecated alias still works as fallback |
| Time-determinism guard makes next cycle already lapsed for very-late claims | Low | Guard adjusts `cycleStartTimes[next]` to `block.timestamp` if too far past; tested in prove-time-determinism.ts |
| Keeper reward enables griefing (someone races recipient on every claim) | Medium | Reward only kicks in after DORMANT_GRACE — recipient has 7 days exclusive window. Race only happens for genuinely dormant cases |
| New view function breaks ABI of existing frontend during migration window | Low | Add new functions; don't modify existing signatures; frontend update can lag |

---

## 8. Open questions (decide before execution)

1. **Should `DORMANT_GRACE` be configurable per circle?** Pro: flexibility (high-value circles want shorter grace). Con: more attack surface. **Default decision: hardcode at 7 days globally for v1; make configurable in v2.**
2. **Should keeper reward come from pot or fee pool?** Pro of fee pool: pot stays exactly as members expect. Con: fee pool may be empty. **Default decision: from pot (0.1% deduction is acceptable; recipient still receives 99.8% on substitute claim vs 99% on direct claim).**
3. **Should `substituteClaim` check that recipient address is not zero/blacklisted?** Edge case but possible. **Default decision: trust on-chain state; if recipient address ever becomes invalid, that's an upstream contract bug.**
4. **Can the recipient themselves call `substituteClaim` instead of `claimPot`?** Technically yes, but they'd lose 0.1% to their own keeper reward. **Default decision: allow but discourage in UI; show recipient the `claimPot` path.**

---

## 9. Out of scope

- Telegram bot notifier (separate plan, post-hackathon).
- Email/push notification system.
- Per-circle dormant grace customization.
- Refund of collateral after circle Completed (already covered by existing `claimCollateral` — verify still works after refactor).
- Cross-circle batch operations (claim multiple in one tx).

---

## 10. References

- Plan 21 — UX polish + faucet stablecoin mint
- CrediKye DoraHacks page: <https://dorahacks.io/buidl/40170>
- Current contract: `contracts/src/KitpotCircle.sol` lines 277-365 (advanceCycle, deposit logic)
- Current advance-cycle UI: `apps/web/src/components/circle/advance-cycle-button.tsx`
- Current useKitpotTx: `apps/web/src/hooks/use-kitpot-tx.ts`
- Compound `accrueInterest` (pull pattern reference): widely cited in DeFi engineering posts
