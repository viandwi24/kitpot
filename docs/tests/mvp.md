# Test: MVP — Full Happy Path

> Requires: `docs/prompts/test.md` loaded first (environment definition).
> Flow: create circle → join → deposit → distribute → complete
> Duration: ~10 minutes (with 60s demo cycles)

---

## Goal

Verify the complete savings circle lifecycle works end-to-end:
- UI renders correctly at every stage
- Contract transactions succeed
- State transitions happen correctly (Forming → Active → Completed)
- Reputation and collateral systems work
- Multi-wallet flow works (Creator, Alice, Bob)

---

## Phase 0: Environment (auto — from docs/prompts/test.md)

Follow **Phase 0: Boot Environment** from `docs/prompts/test.md`. This will:

1. `[SETUP]` Start Anvil (if not running)
2. `[SETUP]` Deploy contracts (if not deployed)
3. `[SETUP]` Write `apps/web/.env.local` with contract addresses
4. `[SETUP]` Run `seed-mvp.ts` (mint USDC + approve for 3 accounts)
5. `[SETUP]` Start `bun dev` (if not running)
6. `[VERIFY]` All 3 services responding

After Phase 0, the state should be:
- Anvil running at `localhost:8545`
- 4 contracts deployed, addresses in `scripts/test/.deployed.json`
- `apps/web/.env.local` written with contract addresses
- 3 wallets funded with 10,000 USDC each, approvals set
- Frontend running at `localhost:3000`
- No circles created yet

---

## Steps

### Phase 1: Landing Page

**[BROWSER]** Navigate to `http://localhost:3000`

**Verify:**
- [ ] Page loads with "Savings Circles, Fully Trustless" heading
- [ ] "Built on Initia" badge visible
- [ ] Stats section: "300M+", "1%", "60s"
- [ ] "How It Works" section with 3 steps
- [ ] "Powered by Initia" section with 4 features
- [ ] CTA section with "Get Started" button
- [ ] Footer shows "Built for INITIATE Hackathon 2026"
- [ ] Dark mode is default
- [ ] Theme toggle button in navbar works (click: switch to light, click again: back to dark)

---

### Phase 2: Create Circle (Creator — Account #0)

**[BROWSER]** Click "Create" in navbar → arrives at `/circles/new`

**[BROWSER]** Fill form:
- Circle Name: `Alumni Savings`
- Description: `Monthly savings for demo`
- Contribution: `100`
- Members: `3`
- Cycle Duration: click `Demo (60s)`
- Minimum Tier: click `None (anyone)`
- Public toggle: ON

**Verify (before submit):**
- [ ] Summary shows: "3 members x 100 USDC = 300 USDC per pot"
- [ ] Collateral note: "100 USDC (returned after completion)"
- [ ] Late penalty: "5% of contribution"
- [ ] Platform fee: "1% per pot"

**[BROWSER]** Click "Create Circle"

> Note: This requires wallet connected. If wallet prompt appears, connect Account #0.
> Transaction sends 100 USDC as collateral.

**Verify:**
- [ ] Transaction prompt appears
- [ ] After confirm → redirected to `/circles`
- [ ] New circle card visible: "Alumni Savings", "Forming", "1/3 joined"

---

### Phase 3: View Circle Dashboard

**[BROWSER]** Click on "Alumni Savings" card → goes to `/circles/0`

**Verify:**
- [ ] Circle header: "Alumni Savings", "Forming" badge
- [ ] Info: "100 USDC/cycle · 3 members · 1/3 joined"
- [ ] Invite form visible with shareable link
- [ ] "Waiting for 2 more members to start..." message
- [ ] Turn order shows only Creator

---

### Phase 4: Alice Joins (Account #1)

> Alice joining requires a different wallet. Since browser has one wallet at a time,
> we use a script for Alice's join transaction.

**[SCRIPT]** Run:
```bash
bun run scripts/test/join-circle.ts --circle 0 --account 1 --username "alice.init"
```

**[BROWSER]** Refresh `/circles/0`

**Verify:**
- [ ] Member count: 2/3
- [ ] "Waiting for 1 more member..."
- [ ] Turn order shows Creator and alice.init

---

### Phase 5: Bob Joins → Circle Activates (Account #2)

**[SCRIPT]** Run:
```bash
bun run scripts/test/join-circle.ts --circle 0 --account 2 --username "bob.init"
```

**[BROWSER]** Refresh `/circles/0`

**Verify:**
- [ ] Status changed to **Active**
- [ ] "Current Cycle" card appears: Cycle 1 of 3
- [ ] Countdown timer running (from 60s)
- [ ] Pot recipient: Creator (turn order 0)
- [ ] Total pot: 300 USDC (- 3 USDC fee)
- [ ] Payment status: all 3 members "Pending"
- [ ] Auto-Pay card visible: "Set up once..."
- [ ] Turn order: Creator = "Current", alice.init = "Upcoming", bob.init = "Upcoming"

---

### Phase 6: Deposit (All Members)

**[SCRIPT]** Deposit for all 3 members:
```bash
bun run scripts/test/deposit-all.ts --circle 0
```

**[BROWSER]** Refresh `/circles/0`

**Verify:**
- [ ] Payment status: all 3 members "Paid"
- [ ] "Distribute Pot" button changes from disabled to enabled (if countdown reached 0)

---

### Phase 7: Advance Time + Distribute Pot (Cycle 1)

**[SCRIPT]** Fast-forward 60 seconds:
```bash
bun run scripts/test/advance-time.ts --seconds 60
```

**[BROWSER]** Refresh → Click "Distribute Pot"

> Or via script:
> ```bash
> bun run scripts/test/advance-cycle.ts --circle 0
> ```

**[BROWSER]** Refresh `/circles/0`

**Verify:**
- [ ] Cycle advanced to 2 of 3
- [ ] New pot recipient: alice.init
- [ ] New countdown started
- [ ] Payment status reset: all 3 "Pending"
- [ ] History section: "Cycle 1 — Creator — 297 USDC"
- [ ] Turn order: Creator = "Received 297 USDC", alice.init = "Current", bob.init = "Upcoming"

---

### Phase 8: Cycle 2 (Alice Gets Pot)

**[SCRIPT]**
```bash
bun run scripts/test/deposit-all.ts --circle 0
bun run scripts/test/advance-time.ts --seconds 60
bun run scripts/test/advance-cycle.ts --circle 0
```

**[BROWSER]** Refresh `/circles/0`

**Verify:**
- [ ] Cycle 3 of 3
- [ ] Pot recipient: bob.init
- [ ] History: Cycle 1 (Creator), Cycle 2 (alice.init)

---

### Phase 9: Cycle 3 → Circle Complete (Bob Gets Pot)

**[SCRIPT]**
```bash
bun run scripts/test/deposit-all.ts --circle 0
bun run scripts/test/advance-time.ts --seconds 60
bun run scripts/test/advance-cycle.ts --circle 0
```

**[BROWSER]** Refresh `/circles/0`

**Verify:**
- [ ] Status: **Completed**
- [ ] Green banner: "Circle completed! All members have received their pot."
- [ ] History: all 3 cycles listed
- [ ] Turn order: all 3 marked "Received"

---

### Phase 10: Verify Final State

**[SCRIPT]** Print full state:
```bash
bun run scripts/test/check-state.ts --circle 0
```

**Expected output:**
```
=== Circle 0: Alumni Savings ===
Status: Completed
Members: 3/3
Cycles: 3/3

=== Payments ===
Creator:    Cycle 1 ✓  Cycle 2 ✓  Cycle 3 ✓
alice.init: Cycle 1 ✓  Cycle 2 ✓  Cycle 3 ✓
bob.init:   Cycle 1 ✓  Cycle 2 ✓  Cycle 3 ✓

=== Pot Distribution ===
Cycle 1 → Creator:    297 USDC
Cycle 2 → alice.init: 297 USDC
Cycle 3 → bob.init:   297 USDC

=== Collateral ===
Creator:    100 USDC (claimable)
alice.init: 100 USDC (claimable)
bob.init:   100 USDC (claimable)

=== Reputation ===
Creator:    1 circle completed, 3/3 on-time, streak: 3, tier: Bronze
alice.init: 1 circle completed, 3/3 on-time, streak: 3, tier: Bronze
bob.init:   1 circle completed, 3/3 on-time, streak: 3, tier: Bronze

=== Platform Fees ===
Accumulated: 9 USDC (3 USDC × 3 cycles)
```

---

### Phase 11: Discover Page

**[BROWSER]** Navigate to `/discover`

**Verify:**
- [ ] Page loads with "Discover Circles" heading
- [ ] Since our circle is completed, it should NOT appear (only Forming circles show)
- [ ] Empty state: "No open circles available right now."

---

### Phase 12: Blockchain Verification (No UI)

These checks verify contract state directly, independent of the frontend.

**[SCRIPT]**
```bash
# Check USDC balances
bun run scripts/test/check-balances.ts

# Expected:
# Creator:    10,000 - 300 (deposits) - 100 (collateral still locked) + 297 (pot) = 9,897 USDC
# alice.init: 10,000 - 300 - 100 + 297 = 9,897 USDC
# bob.init:   10,000 - 300 - 100 + 297 = 9,897 USDC
# Contract:   300 (collateral) + 9 (fees) = 309 USDC

# Claim collateral (from all 3)
bun run scripts/test/claim-collateral.ts --circle 0

# After claim:
# Each member: 9,897 + 100 = 9,997 USDC
# Contract: 9 USDC (fees only)
# Net loss per member: 3 USDC (1% fee × 3 cycles)
```

---

## Failure Scenarios (Optional)

If time permits, test these edge cases:

### Late Payment
```bash
# Don't deposit for Creator, advance time past grace period, then deposit
bun run scripts/test/advance-time.ts --seconds 35  # past 30s grace
bun run scripts/test/deposit.ts --circle 0 --account 0
# Verify: Creator's collateral reduced by 5 USDC (5% of 100)
```

### Missed Payment
```bash
# Don't deposit for Bob at all, advance cycle
# Verify: Bob's collateral used to cover payment, reputation records missed
```

### Tier Gate
```bash
# Create a Gold-gated circle
# Try to join with a new account (Unranked) → should fail
# Verify: "Trust tier too low" error
```

---

## Clean Restart

To reset everything and start fresh:

```bash
# Kill anvil (Ctrl+C in Terminal 1), then:
anvil                                    # fresh blockchain
bun run scripts/test/deploy.ts           # redeploy
bun run scripts/test/seed-mvp.ts         # re-seed
```
