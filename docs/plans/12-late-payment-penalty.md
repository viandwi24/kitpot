# Plan 13 — Late Payment Handling & Collateral System

> Goal: Handle the real-world problem of members not paying on time. Collateral + penalties make the system robust and trustworthy. Solves the #1 issue with traditional savings circles.

---

## Why This Matters

- Biggest pain point in real ROSCA: "What if someone doesn't pay?"
- Shows judges we thought about real-world edge cases
- Makes the protocol viable beyond hackathon (not just a toy)
- Differentiates from CrediKye which has no penalty mechanism

---

## Design: Collateral + Grace Period + Penalty

### How It Works

```
Timeline for each cycle:

|--- Cycle Start ------- Grace Period End ------- Cycle End (advanceCycle) ---|
|                    |                         |                              |
|  Normal payment    |  Late payment           |  Missed: collateral slashed  |
|  (on-time)         |  (penalty applied)      |  (kicked or penalized)       |
```

### Collateral Model

When joining a circle, members deposit a **collateral** equal to 1x contribution amount. This collateral:
- Is returned in full when circle completes (if no penalties)
- Gets partially slashed on late payments
- Gets fully slashed + member removed if they miss completely

```solidity
// New fields in Circle struct
struct Circle {
    // ... existing ...
    uint256 collateralAmount;       // = contributionAmount (1x)
    uint256 gracePeriod;            // seconds after cycle start before penalty kicks in
    uint256 latePenaltyBps;         // penalty for late payment (e.g., 500 = 5%)
}

// New mapping
mapping(uint256 => mapping(address => uint256)) public collateralBalance;
// circleId => member => remaining collateral
```

### Scenarios

| Scenario | Action | Impact |
|----------|--------|--------|
| Pays on time (before grace period end) | Normal deposit, no penalty | Reputation: +1 on-time |
| Pays late (after grace period, before cycle end) | Deposit accepted + penalty deducted from collateral | Reputation: +1 late, streak reset |
| Never pays (cycle advances without payment) | Collateral covers contribution + remaining distributed | Reputation: +1 missed, possible kick |
| Circle completes, good standing | Full collateral returned | Happy ending |

### Functions to Add/Modify

```solidity
/// @notice Join circle with collateral deposit
function joinCircle(uint256 circleId, string calldata initUsername) external {
    // ... existing logic ...
    
    // NEW: Require collateral deposit
    IERC20(c.tokenAddress).safeTransferFrom(msg.sender, address(this), c.collateralAmount);
    collateralBalance[circleId][msg.sender] = c.collateralAmount;
}

/// @notice Deposit with automatic late penalty check
function deposit(uint256 circleId) external {
    Circle storage c = _circles[circleId];
    uint256 cycleStart = c.startTime + (c.currentCycle * c.cycleDuration);
    uint256 graceEnd = cycleStart + c.gracePeriod;
    
    bool isLate = block.timestamp > graceEnd;
    
    if (isLate) {
        // Slash penalty from collateral
        uint256 penalty = (c.contributionAmount * c.latePenaltyBps) / 10000;
        collateralBalance[circleId][msg.sender] -= penalty;
        accumulatedFees[c.tokenAddress] += penalty; // penalty goes to platform
        emit LatePenaltyApplied(circleId, msg.sender, penalty);
    }
    
    _depositFor(circleId, msg.sender);
    reputation.recordPayment(msg.sender, circleId, c.currentCycle, !isLate);
}

/// @notice Handle missed payment during advanceCycle
function advanceCycle(uint256 circleId) external {
    // For members who haven't paid:
    for (uint i = 0; i < members.length; i++) {
        if (!hasPaid[circleId][c.currentCycle][members[i].addr]) {
            _handleMissedPayment(circleId, members[i].addr);
        }
    }
    // ... rest of distribution logic ...
}

function _handleMissedPayment(uint256 circleId, address member) internal {
    Circle storage c = _circles[circleId];
    uint256 collateral = collateralBalance[circleId][member];
    
    if (collateral >= c.contributionAmount) {
        // Use collateral as payment
        collateralBalance[circleId][member] -= c.contributionAmount;
        hasPaid[circleId][c.currentCycle][member] = true;
        emit CollateralUsedForPayment(circleId, member, c.contributionAmount);
    } else {
        // Insufficient collateral — slash all remaining
        accumulatedFees[c.tokenAddress] += collateral;
        collateralBalance[circleId][member] = 0;
        emit MemberDefaulted(circleId, member, collateral);
    }
    
    reputation.recordMissedPayment(member, circleId, c.currentCycle);
}

/// @notice Return collateral after circle completion
function claimCollateral(uint256 circleId) external onlyMember(circleId) {
    require(_circles[circleId].status == CircleStatus.Completed, "Circle not completed");
    uint256 amount = collateralBalance[circleId][msg.sender];
    require(amount > 0, "No collateral to claim");
    
    collateralBalance[circleId][msg.sender] = 0;
    IERC20(_circles[circleId].tokenAddress).safeTransfer(msg.sender, amount);
    
    emit CollateralReturned(circleId, msg.sender, amount);
}
```

### Events

```solidity
event CollateralDeposited(uint256 indexed circleId, address indexed member, uint256 amount);
event LatePenaltyApplied(uint256 indexed circleId, address indexed member, uint256 penalty);
event CollateralUsedForPayment(uint256 indexed circleId, address indexed member, uint256 amount);
event MemberDefaulted(uint256 indexed circleId, address indexed member, uint256 slashedAmount);
event CollateralReturned(uint256 indexed circleId, address indexed member, uint256 amount);
```

---

## Frontend Changes

### Join Circle — Show Collateral Requirement

```
┌────────────────────────────────────────┐
│ Join Circle                            │
│                                        │
│ Contribution: 100 USDC / cycle         │
│ Collateral:   100 USDC (returned after │
│               circle completes)        │
│                                        │
│ Total needed to join: 200 USDC         │
│                                        │
│ [Join Circle (200 USDC)]               │
└────────────────────────────────────────┘
```

### Dashboard — Collateral Status

```
┌────────────────────────────────────────┐
│ Your Collateral                        │
│ Deposited: 100 USDC                    │
│ Remaining: 95 USDC (5 USDC penalty)   │
│ Status: Active                         │
│                                        │
│ Returned when circle completes.        │
└────────────────────────────────────────┘
```

### Circle Completed — Claim Collateral Button

```
[Claim 95 USDC Collateral]
```

---

## Edge Cases

| Case | Handling |
|------|----------|
| Member defaults + collateral < contribution | Partial coverage, pot reduced, other members split loss |
| All members default simultaneously | Impossible with collateral (covers at least 1 cycle each) |
| Collateral runs out mid-circle | Member can top-up collateral, or accept reduced pot coverage |
| Member wants to leave mid-circle | No exit — collateral stays locked until completion |
| Grace period = 0 | No late window, only on-time or missed |

---

## Configuration for Demo

```solidity
// Demo settings:
collateralAmount = contributionAmount   // 1x (100 USDC)
gracePeriod = 30 seconds                // (production: 3 days)
latePenaltyBps = 500                    // 5% penalty
```

---

## Output Files

```
contracts/src/KitpotCircle.sol           ← MODIFIED: add collateral + penalty logic
contracts/test/KitpotPenalty.t.sol       ← NEW: penalty edge case tests

apps/web/src/components/circle/
├── collateral-status.tsx                ← NEW
├── claim-collateral-button.tsx          ← NEW
└── join-form.tsx                        ← MODIFIED: show collateral requirement
```

---

## Dependencies

- **Blocked by:** Plan 11 (reputation.recordPayment integration)
- **Blocks:** nothing
