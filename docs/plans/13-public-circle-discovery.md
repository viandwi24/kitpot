# Plan 14 — Public Circle Discovery & Browse

> Goal: Users can browse open circles and join them. Makes the app feel like a complete product, not just a demo.

---

## Why This Matters

- Shows "Product Value & UX" (20% scoring) — app feels real, not just a code demo
- Addresses go-to-market: how do strangers find circles?
- Low effort, high visual impact for judges
- Makes demo video more interesting (show active ecosystem)

---

## Design

### Circle Visibility

Add to Circle struct:

```solidity
bool isPublic;          // true = anyone can browse and join
string description;     // short description for discovery
```

### New View Function

```solidity
/// @notice Get all public circles that are still forming (open for joining)
function getPublicCircles(uint256 offset, uint256 limit) 
    external view 
    returns (Circle[] memory circles, uint256 total);
```

Since on-chain iteration is expensive, alternative approach: **use events + frontend indexing**. The frontend reads `CircleCreated` events and filters by `isPublic`.

### Frontend: `/discover` Page

```
┌────────────────────────────────────────────────────┐
│ Discover Circles                    [Filter ▼]     │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ Alumni Savings               Forming [Silver+] │ │
│ │ 100 USDC/cycle · 3 slots · 2/5 joined         │ │
│ │ "Monthly savings for university alumni"        │ │
│ │ Creator: alice.init [Gold]                     │ │
│ │ [View Details]                                 │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ Crypto Savers Club           Forming [None]    │ │
│ │ 50 USDC/cycle · 5 slots · 1/5 joined          │ │
│ │ "Low-stakes circle for beginners"              │ │
│ │ Creator: bob.init [Bronze]                     │ │
│ │ [View Details]                                 │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ High Rollers Only            Forming [Gold+]   │ │
│ │ 500 USDC/cycle · 3 slots · 1/3 joined         │ │
│ │ "For experienced members only"                 │ │
│ │ Creator: charlie.init [Diamond]                │ │
│ │ [View Details]                                 │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ Showing 3 open circles                             │
└────────────────────────────────────────────────────┘
```

### Filters

- Contribution range (slider)
- Minimum tier required (any / Bronze+ / Silver+ / Gold+)
- Members remaining (has open slots)
- Cycle duration (demo / short / monthly)

---

## Contract Changes

### Modified `createCircle()`

```solidity
function createCircle(
    string calldata name,
    string calldata description,      // NEW
    address tokenAddress,
    uint256 contributionAmount,
    uint256 maxMembers,
    uint256 cycleDuration,
    bool isPublic,                    // NEW
    TrustTier minimumTier             // NEW (from Plan 11)
) external whenNotPaused returns (uint256 circleId);
```

### New Event Fields

```solidity
event CircleCreated(
    uint256 indexed circleId, address indexed creator, string name,
    string description,                // NEW
    uint256 contributionAmount, uint256 maxMembers, uint256 cycleDuration,
    bool isPublic, TrustTier minimumTier  // NEW
);
```

---

## Frontend Changes

### New Route: `/discover`

- List all public + Forming circles
- Each card shows: name, description, contribution, slots, creator reputation, minimum tier
- Click → goes to `/join/[id]`

### Modified Create Circle Form

Add:
- "Make this circle public" toggle
- "Description" text area (optional, for public circles)
- "Minimum trust tier" dropdown

### Navigation Update

Add "Discover" link to header nav.

---

## Output Files

```
contracts/src/KitpotCircle.sol              ← MODIFIED: add isPublic, description, minimumTier
apps/web/src/app/discover/page.tsx          ← NEW
apps/web/src/components/circle/discover-card.tsx  ← NEW
apps/web/src/hooks/use-discover.ts          ← NEW
apps/web/src/components/circle/create-circle-form.tsx ← MODIFIED
apps/web/src/components/layout/header.tsx   ← MODIFIED: add Discover nav link
```

---

## Dependencies

- **Blocked by:** Plan 11 (tier display on cards)
- **Blocks:** nothing
