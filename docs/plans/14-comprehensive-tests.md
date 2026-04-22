# Plan 15 — Comprehensive Test Suite

> Goal: Full test coverage for all contracts. Judges read code — a robust test suite shows rigor and production-readiness.

---

## Why This Matters

- "Technical Execution" (30% scoring) — tests prove correctness
- Judges at crypto hackathons check test files — it's a signal of quality
- Catches bugs before demo (nothing worse than a demo crash)
- Differentiates from submissions that have zero tests

---

## Current State: 11 tests in KitpotCircle.t.sol

### Gaps to Fill

| Area | Current | Needed |
|------|---------|--------|
| Circle CRUD | 2 tests | +3 (boundary values, max 20 members, empty name) |
| Join | 2 tests | +4 (double join, join after active, join full circle, tier gate) |
| Deposits | 2 tests | +5 (insufficient balance, wrong circle, batch deposit, on-behalf, after complete) |
| Cycle advance | 1 test | +4 (time-lock, partial payments, collateral slash, final cycle) |
| Sessions | 3 tests | +5 (expiry, wrong circle, wrong operator, max amount, batch with mixed) |
| Reputation | 0 tests | +8 (record payment, tier calc, streak, missed, upgrade, downgrade) |
| Achievements | 0 tests | +6 (award, soulbound check, duplicate, auto-trigger, metadata) |
| Penalties | 0 tests | +6 (grace period, late penalty, collateral slash, claim, default, top-up) |
| Admin | 0 tests | +4 (fee change, fee withdraw, pause, unpause) |
| Edge cases | 0 tests | +5 (reentrancy, overflow, zero amounts, max uint, same block) |
| Full lifecycle | 1 test | +2 (lifecycle with penalties, lifecycle with mixed sessions) |

**Total target: ~55 tests** (from 11 currently)

---

## Test File Structure

```
contracts/test/
├── KitpotCircle.t.sol              ← EXPAND: core circle + deposit + cycle tests
├── KitpotReputation.t.sol          ← NEW: reputation system tests
├── KitpotAchievements.t.sol        ← NEW: soulbound NFT tests
├── KitpotPenalty.t.sol             ← NEW: collateral + penalty tests
├── KitpotSessions.t.sol            ← NEW: auto-signing session tests
├── KitpotAdmin.t.sol               ← NEW: admin function tests
├── KitpotEdgeCases.t.sol           ← NEW: reentrancy, overflow, etc.
└── helpers/
    └── TestSetup.sol               ← NEW: shared test fixtures
```

---

## Key Test Scenarios

### Session Edge Cases (KitpotSessions.t.sol)

```solidity
function test_session_expiry() public {
    // Authorize session → warp past expiry → depositOnBehalf should revert
}

function test_session_wrongCircle() public {
    // Authorize for circle 0 → try depositOnBehalf on circle 1 → revert
}

function test_batchDeposit_mixedSessions() public {
    // 3 members: A has session, B has expired session, C has no session
    // batchDeposit should only deposit for A, skip B and C
}

function test_batchDeposit_insufficientBalance() public {
    // Member has session but 0 USDC balance → skip, don't revert
}

function test_session_maxAmount() public {
    // Session maxAmountPerCycle = 50 but contribution = 100 → should fail authorize
}
```

### Penalty Tests (KitpotPenalty.t.sol)

```solidity
function test_deposit_onTime() public {
    // Deposit within grace period → no penalty
}

function test_deposit_late() public {
    // Deposit after grace period → penalty deducted from collateral
}

function test_missedPayment_collateralCovers() public {
    // Member doesn't pay → advanceCycle → collateral used
}

function test_missedPayment_insufficientCollateral() public {
    // Collateral already partially slashed → not enough for contribution
}

function test_claimCollateral_afterCompletion() public {
    // Circle completed → claim remaining collateral
}

function test_claimCollateral_beforeCompletion() public {
    // Revert: can't claim while circle is active
}
```

### Reputation Tests (KitpotReputation.t.sol)

```solidity
function test_tierCalculation_bronze() public {
    // 1 circle completed, 70%+ on-time → Bronze
}

function test_tierCalculation_silver() public {
    // 3 circles completed, 85%+ on-time → Silver
}

function test_streakReset() public {
    // 5 on-time → streak = 5 → 1 miss → streak = 0
}

function test_tierDowngrade() public {
    // Was Silver → miss payments → drops below 85% → back to Bronze
}

function test_meetsMinimumTier_gate() public {
    // Gold-gated circle → Bronze member tries to join → revert
}
```

### Admin Tests (KitpotAdmin.t.sol)

```solidity
function test_setPlatformFee_capped() public {
    // Try set 600 bps (6%) → revert (max 500)
}

function test_withdrawFees() public {
    // After cycles with fees → owner withdraws → correct amount
}

function test_pause_blocksAll() public {
    // Pause → createCircle, deposit, advanceCycle all revert
}

function test_onlyOwner() public {
    // Non-owner tries admin functions → revert
}
```

### Edge Case Tests (KitpotEdgeCases.t.sol)

```solidity
function test_createCircle_maxMembers20() public {
    // Create circle with 20 members, all join, verify works
}

function test_deposit_afterCircleComplete() public {
    // Try deposit on completed circle → revert
}

function test_joinCircle_afterActive() public {
    // Try join after circle is Active → revert
}

function test_advanceCycle_tooEarly() public {
    // All paid but cycle time not elapsed → revert
}

function test_zeroContribution() public {
    // Create circle with 0 contribution → revert
}
```

---

## Shared Test Setup (helpers/TestSetup.sol)

```solidity
contract TestSetup is Test {
    KitpotCircle public kitpot;
    KitpotReputation public reputation;
    KitpotAchievements public achievements;
    MockUSDC public usdc;
    
    address[] public wallets;
    
    function _setupFullEnvironment() internal {
        usdc = new MockUSDC();
        reputation = new KitpotReputation();
        achievements = new KitpotAchievements();
        kitpot = new KitpotCircle(100, address(reputation), address(achievements));
        
        // Setup 5 test wallets with USDC
        for (uint i = 0; i < 5; i++) {
            address w = makeAddr(string(abi.encodePacked("wallet", i)));
            wallets.push(w);
            usdc.mint(w, 100_000e6);
            vm.prank(w);
            usdc.approve(address(kitpot), type(uint256).max);
        }
    }
    
    function _createAndFillCircle(uint256 members) internal returns (uint256) {
        // Helper: create circle + join all members
    }
    
    function _depositAll(uint256 circleId) internal {
        // Helper: all members deposit for current cycle
    }
}
```

---

## Output Files

```
contracts/test/
├── KitpotCircle.t.sol          ← EXPANDED
├── KitpotReputation.t.sol      ← NEW
├── KitpotAchievements.t.sol    ← NEW
├── KitpotPenalty.t.sol         ← NEW
├── KitpotSessions.t.sol        ← NEW
├── KitpotAdmin.t.sol           ← NEW
├── KitpotEdgeCases.t.sol       ← NEW
└── helpers/
    └── TestSetup.sol           ← NEW
```

---

## Dependencies

- **Blocked by:** Plan 11, 12, 13 (needs new contracts to test)
- **Blocks:** Plan 10 (tests need to pass before deploy)
