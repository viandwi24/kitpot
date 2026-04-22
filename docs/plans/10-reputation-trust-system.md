# Plan 11 — Reputation & Trust Score System

> Goal: On-chain reputation that tracks payment behavior, assigns trust tiers, and gates access to higher-value circles. This is the BIGGEST scoring differentiator vs other submissions.

---

## Why This Matters for Scoring

- CrediKye (Grand Prize winner) had reputation + trust tiers — judges clearly value this
- Shows "Product Value & UX" (20% scoring) — real problem solved: who to trust in a savings circle?
- Shows "Technical Execution" (30%) — non-trivial on-chain system
- Makes `.init` username meaningful — your reputation travels with your identity

---

## Architecture: Separate Contract `KitpotReputation.sol`

Why separate from KitpotCircle:
- Reputation is PORTABLE across circles (not tied to one circle)
- Reputation is tied to ADDRESS (maps to .init username)
- Different access patterns (read-heavy, rarely written)
- Can be upgraded independently

### Data Model

```solidity
struct MemberReputation {
    uint256 totalCirclesJoined;
    uint256 totalCirclesCompleted;
    uint256 totalCyclesPaid;
    uint256 totalCyclesMissed;         // late or missed
    uint256 totalCyclesOnTime;          // paid before deadline
    uint256 totalPotReceived;           // lifetime USDC received
    uint256 totalContributed;           // lifetime USDC contributed
    uint256 consecutiveOnTime;          // current streak
    uint256 longestStreak;              // all-time best streak
    uint256 lastActivityTimestamp;
    TrustTier tier;
}

enum TrustTier {
    Unranked,    // 0 circles completed
    Bronze,      // 1+ circles, 70%+ on-time
    Silver,      // 3+ circles, 85%+ on-time
    Gold,        // 5+ circles, 95%+ on-time
    Diamond      // 10+ circles, 99%+ on-time, 0 missed
}
```

### Trust Tier Calculation

```
Tier requirements:
- Unranked: default (no history)
- Bronze:   >= 1 circle completed AND on-time rate >= 70%
- Silver:   >= 3 circles completed AND on-time rate >= 85%
- Gold:     >= 5 circles completed AND on-time rate >= 95%
- Diamond:  >= 10 circles completed AND on-time rate >= 99% AND 0 missed
```

On-time rate = `totalCyclesOnTime / (totalCyclesOnTime + totalCyclesMissed) * 100`

### Functions

```solidity
/// @notice Called by KitpotCircle after each successful deposit
function recordPayment(
    address member,
    uint256 circleId,
    uint256 cycleNumber,
    bool onTime           // true if paid before cycle end timestamp
) external onlyKitpotCircle;

/// @notice Called by KitpotCircle when a member misses payment deadline
function recordMissedPayment(
    address member,
    uint256 circleId,
    uint256 cycleNumber
) external onlyKitpotCircle;

/// @notice Called by KitpotCircle when circle completes
function recordCircleCompleted(
    address member,
    uint256 circleId
) external onlyKitpotCircle;

/// @notice Anyone can trigger tier recalculation for a member
function recalculateTier(address member) external;

/// @notice Check if member meets minimum tier for a circle
function meetsMinimumTier(address member, TrustTier required) external view returns (bool);

/// @notice Get full reputation data
function getReputation(address member) external view returns (MemberReputation memory);

/// @notice Get tier for display
function getTier(address member) external view returns (TrustTier);

/// @notice Get leaderboard data (top N by streak)
function getTopMembers(uint256 count) external view returns (address[] memory, uint256[] memory scores);
```

### Events

```solidity
event PaymentRecorded(address indexed member, uint256 indexed circleId, uint256 cycle, bool onTime);
event MissedPaymentRecorded(address indexed member, uint256 indexed circleId, uint256 cycle);
event CircleCompletedForMember(address indexed member, uint256 indexed circleId);
event TierUpdated(address indexed member, TrustTier oldTier, TrustTier newTier);
```

### Integration with KitpotCircle

Modify `KitpotCircle.sol`:

1. Add `IKitpotReputation public reputation;` state variable
2. In `_depositFor()`: call `reputation.recordPayment(member, circleId, cycle, isOnTime)`
3. In `advanceCycle()` when `currentCycle >= totalCycles`: call `reputation.recordCircleCompleted(member, circleId)` for each member
4. In `createCircle()`: add optional `minimumTier` parameter — revert if joiner doesn't meet tier
5. Add deadline tracking: `isOnTime = block.timestamp <= cycleStartTime + cycleDuration`

### Circle-Level Tier Gating

```solidity
// In KitpotCircle.sol
struct Circle {
    // ... existing fields ...
    TrustTier minimumTier;  // NEW: minimum tier to join (Unranked = no restriction)
}

function joinCircle(uint256 circleId, string calldata initUsername) external {
    // ... existing checks ...
    
    // NEW: tier gate check
    if (c.minimumTier != TrustTier.Unranked) {
        require(
            reputation.meetsMinimumTier(msg.sender, c.minimumTier),
            "Trust tier too low"
        );
    }
}
```

---

## Frontend Components

### Profile / Reputation Display

```
┌────────────────────────────────────────┐
│ alice.init                    [Silver] │
│                                        │
│ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│ │ 5        │ │ 12/14    │ │ 7      │  │
│ │ Circles  │ │ On-time  │ │ Streak │  │
│ └──────────┘ └──────────┘ └────────┘  │
│                                        │
│ On-time rate: 85.7%                    │
│ Next tier: Gold (need 95%+ and 5 done) │
│ Total contributed: 4,200 USDC          │
│ Total received: 4,158 USDC             │
└────────────────────────────────────────┘
```

### Tier Badge in Members List

Show tier badge next to each member in the circle dashboard payment status and turn order views.

### Circle Creation — Minimum Tier Selector

In create circle form, add optional "Minimum Trust Tier" dropdown:
- None (anyone can join)
- Bronze+
- Silver+
- Gold+
- Diamond only

---

## Edge Cases & Handling

| Scenario | Handling |
|----------|----------|
| New user (no history) | TrustTier.Unranked, can join any circle without tier restriction |
| Member pays late (after cycle deadline but before advance) | Counts as `onTime = false`, still valid payment |
| Member never pays (cycle advances without them) | `recordMissedPayment()` called, streak resets to 0 |
| Streak gaming (join easy circles to inflate) | Tier also requires minimum circles COMPLETED, not just payments |
| Sybil attack (new wallets to bypass bad rep) | New wallets start at Unranked — can't join gated circles |
| Reputation data migration | Reputation contract is upgradeable via owner |

---

## Output Files

```
contracts/src/KitpotReputation.sol       ← NEW: reputation registry
contracts/src/interfaces/IKitpotReputation.sol  ← NEW: interface
contracts/src/KitpotCircle.sol           ← MODIFIED: add reputation integration
contracts/test/KitpotReputation.t.sol    ← NEW: reputation tests

apps/web/src/components/reputation/
├── reputation-card.tsx                  ← member reputation display
├── tier-badge.tsx                       ← small badge component
└── tier-gate-selector.tsx               ← create circle tier dropdown

apps/web/src/hooks/use-reputation.ts     ← hook to read reputation
```

---

## Dependencies

- **Blocked by:** Plan 02-04 (needs base contract)
- **Blocks:** Plan 12 (achievements reference reputation data)
