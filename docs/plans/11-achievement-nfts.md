# Plan 12 — Soulbound Achievement NFTs

> Goal: Non-transferable NFT badges for milestones. Visual proof of trustworthiness. Judges at hackathons love visible on-chain credentials.

---

## Why This Matters

- CrediKye had Soulbound NFT badges — judges valued this
- Tangible proof of participation (not just a number)
- Shows "Technical Execution" (ERC721 + custom logic)
- .init username + NFT badge = portable on-chain identity
- Makes the app "sticky" — users collect achievements

---

## Architecture: `KitpotAchievements.sol` (ERC721, Soulbound)

### Soulbound = Non-transferable

```solidity
// Override transfer functions to make non-transferable
function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
    address from = _ownerOf(tokenId);
    // Only allow minting (from == address(0)), not transfers
    require(from == address(0), "Soulbound: non-transferable");
    return super._update(to, tokenId, auth);
}
```

### Achievement Types

```solidity
enum AchievementType {
    FirstCircleJoined,        // Joined first circle
    FirstPotReceived,         // Received pot for the first time
    CircleCompleted,          // Completed a full circle
    PerfectCircle,            // Completed circle with 100% on-time payments
    Streak3,                  // 3 consecutive on-time payments
    Streak10,                 // 10 consecutive on-time payments
    Streak25,                 // 25 consecutive on-time payments
    CircleCreator,            // Created a circle that completed successfully
    HighRoller,              // Participated in circle with 500+ USDC contribution
    Veteran,                  // Completed 5+ circles
    Diamond,                  // Achieved Diamond trust tier
    EarlyAdopter             // Joined during hackathon period (before deadline)
}
```

### Token Metadata (On-chain SVG)

Each achievement has on-chain generated SVG artwork — no external IPFS dependency:

```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    Achievement memory a = achievements[tokenId];
    
    string memory svg = generateSVG(a.achievementType);
    string memory json = string(abi.encodePacked(
        '{"name":"Kitpot: ', achievementNames[a.achievementType], '",',
        '"description":"', achievementDescriptions[a.achievementType], '",',
        '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
        '"attributes":[{"trait_type":"Type","value":"', achievementNames[a.achievementType], '"},',
        '{"trait_type":"Earned","display_type":"date","value":', Strings.toString(a.earnedAt), '}]}'
    ));
    
    return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
}
```

### Data Model

```solidity
struct Achievement {
    AchievementType achievementType;
    address holder;
    uint256 earnedAt;       // timestamp
    uint256 circleId;       // related circle (0 if N/A)
}

// State
mapping(uint256 => Achievement) public achievements;
mapping(address => mapping(AchievementType => bool)) public hasAchievement;
mapping(address => uint256[]) public memberAchievements;
uint256 public nextTokenId;
```

### Functions

```solidity
/// @notice Called by KitpotCircle/Reputation contracts to award achievements
function award(address member, AchievementType aType, uint256 circleId) external onlyAuthorized;

/// @notice Check and auto-award based on current reputation state
function checkAndAward(address member) external;

/// @notice Get all achievements for a member
function getAchievements(address member) external view returns (Achievement[] memory);

/// @notice Check if member has specific achievement
function has(address member, AchievementType aType) external view returns (bool);

/// @notice Count total achievements for a member
function achievementCount(address member) external view returns (uint256);
```

### Auto-Award Triggers

| Achievement | Triggered When | Called By |
|---|---|---|
| FirstCircleJoined | `joinCircle()` first time | KitpotCircle |
| FirstPotReceived | `advanceCycle()` when member is recipient for first time | KitpotCircle |
| CircleCompleted | Circle status → Completed | KitpotCircle |
| PerfectCircle | Circle completed + member had 0 missed payments | KitpotCircle + Reputation |
| Streak3/10/25 | `recordPayment()` when consecutiveOnTime hits threshold | Reputation |
| CircleCreator | Circle that member created reaches Completed | KitpotCircle |
| HighRoller | Join circle with contributionAmount >= 500 USDC | KitpotCircle |
| Veteran | `recordCircleCompleted()` count >= 5 | Reputation |
| Diamond | Tier updated to Diamond | Reputation |
| EarlyAdopter | Join any circle before hackathon deadline timestamp | KitpotCircle |

---

## Frontend Components

### Achievement Gallery (Profile Page)

```
┌──────────────────────────────────────────────┐
│ Your Achievements (4/12)                     │
│                                              │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │ ★   │ │ ✓✓✓ │ │ 🏆  │ │ 🔥  │            │
│ │First│ │Perf.│ │Done │ │St.3 │            │
│ └─────┘ └─────┘ └─────┘ └─────┘            │
│                                              │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │ 🔒  │ │ 🔒  │ │ 🔒  │ │ 🔒  │            │
│ │St.10│ │St.25│ │Vet. │ │Diam.│            │
│ └─────┘ └─────┘ └─────┘ └─────┘            │
└──────────────────────────────────────────────┘
```

### Achievement Toast (When Earned)

Show celebratory toast notification when a new achievement is earned after a transaction.

### Member Card Enhancement

In payment status and turn order, show small achievement icons next to member names.

---

## Output Files

```
contracts/src/KitpotAchievements.sol     ← NEW: soulbound NFT contract
contracts/src/libraries/SVGGenerator.sol ← NEW: on-chain SVG generation
contracts/test/KitpotAchievements.t.sol  ← NEW: tests

apps/web/src/components/achievements/
├── achievement-gallery.tsx
├── achievement-badge.tsx
├── achievement-toast.tsx
└── locked-achievement.tsx

apps/web/src/hooks/use-achievements.ts
apps/web/src/lib/abi/KitpotAchievements.ts
```

---

## Dependencies

- **Blocked by:** Plan 11 (reputation triggers achievements)
- **Blocks:** nothing (standalone visual feature)
