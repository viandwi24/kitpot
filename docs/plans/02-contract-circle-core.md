# Plan 02 — Smart Contract: Circle Core

> Goal: `KitpotCircle.sol` dengan create circle, join circle, dan state management lengkap. Belum ada payment/distribution.

---

## Scope

- Struct definitions (Circle, Member)
- `createCircle()` — creator jadi member pertama
- `joinCircle()` — max slots enforcement
- `getCircle()` / `getMembers()` — view functions
- Circle state machine (Forming → Active → Completed)
- Events untuk setiap state change

## Non-goals

- Payment/deposit logic (Plan 03)
- Auto-signing sessions (Plan 04)
- Deploy scripts (Plan 05)
- Testing / `forge build` / `forge test`

---

## Contract Design

### Structs

```solidity
struct Circle {
    uint256 id;
    string name;
    address creator;
    address tokenAddress;       // ERC20 (USDC) yang dipakai
    uint256 contributionAmount; // nominal per cycle (misal 100 USDC)
    uint256 maxMembers;         // jumlah slot (5-20)
    uint256 totalCycles;        // = maxMembers (setiap orang dapat 1x)
    uint256 currentCycle;       // cycle ke berapa sekarang (0-indexed)
    uint256 cycleDuration;      // KRITIS: configurable (60s demo, 30 hari prod)
    uint256 startTime;          // timestamp circle mulai (setelah penuh)
    uint256 memberCount;
    CircleStatus status;
}

struct Member {
    address addr;
    string initUsername;        // .init username (display only)
    uint256 joinedAt;
    bool hasReceivedPot;        // sudah dapat giliran belum
    uint256 turnOrder;          // posisi dalam round-robin (0-indexed)
}

enum CircleStatus {
    Forming,    // belum penuh, masih bisa join
    Active,     // penuh, cycle berjalan
    Completed   // semua cycle selesai
}
```

### State Variables

```solidity
uint256 public nextCircleId;
mapping(uint256 => Circle) public circles;
mapping(uint256 => Member[]) public circleMembers;
mapping(uint256 => mapping(address => bool)) public isMember;

// Platform fee
address public owner;
uint256 public platformFeeBps; // 100 = 1%
```

### Functions

```solidity
// Create
function createCircle(
    string calldata name,
    address tokenAddress,
    uint256 contributionAmount,
    uint256 maxMembers,        // 3-20
    uint256 cycleDuration      // in seconds
) external returns (uint256 circleId);

// Join
function joinCircle(
    uint256 circleId,
    string calldata initUsername
) external;

// Views
function getCircle(uint256 circleId) external view returns (Circle memory);
function getMembers(uint256 circleId) external view returns (Member[] memory);
function getMemberByAddress(uint256 circleId, address addr) external view returns (Member memory);
function getCircleCount() external view returns (uint256);
```

### Events

```solidity
event CircleCreated(uint256 indexed circleId, address indexed creator, string name, uint256 contributionAmount, uint256 maxMembers);
event MemberJoined(uint256 indexed circleId, address indexed member, string initUsername, uint256 turnOrder);
event CircleActivated(uint256 indexed circleId, uint256 startTime);
```

### Logic rules

1. `createCircle`: creator otomatis jadi member pertama (turnOrder = 0), `maxMembers` antara 3-20
2. `joinCircle`: revert kalau circle penuh atau sudah Active. Caller jadi member dengan turnOrder incremental
3. Ketika `memberCount == maxMembers` → status berubah ke `Active`, `startTime` di-set ke `block.timestamp`
4. `totalCycles = maxMembers` (setiap member dapat pot tepat 1x)

### Modifiers

```solidity
modifier onlyCircleStatus(uint256 circleId, CircleStatus expected);
modifier onlyMember(uint256 circleId);
```

### Inheritance

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract KitpotCircle is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    // ...
}
```

---

## Output files

```
contracts/src/KitpotCircle.sol   ← core contract (create + join + views + events)
```

---

## Dependencies

- **Blocked by:** Plan 01 (needs Foundry project)
- **Blocks:** Plan 03 (payment needs circle state), Plan 04, Plan 05
