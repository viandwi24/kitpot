# Plan 03 — Smart Contract: Payments, Distribution & Cycle Engine

> Goal: Tambahkan payment collection, pot distribution (round-robin), cycle advancement, dan platform fee ke `KitpotCircle.sol`.

---

## Scope

- `deposit()` — anggota bayar iuran untuk current cycle
- `distributePot()` — kirim pot ke pemenang giliran
- Cycle advancement logic (kapan cycle maju, siapa pemenang)
- Platform fee (1% dari pot)
- Payment tracking per cycle per member
- Trigger function untuk advance cycle (callable by anyone when time is up)

## Non-goals

- Auto-signing sessions (Plan 04) — ini masih manual deposit dulu
- Frontend (Plan 06-09)
- Testing

---

## Contract Additions

### New State Variables

```solidity
// Tracking payments: circleId => cycleNumber => memberAddress => paid
mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasPaid;

// Tracking pot received: circleId => cycleNumber => recipient
mapping(uint256 => mapping(uint256 => address)) public cycleRecipient;

// Platform fee collection
uint256 public accumulatedFees;
```

### New Functions

```solidity
/// @notice Anggota deposit iuran untuk current cycle
/// @dev Transfers ERC20 dari caller ke contract
function deposit(uint256 circleId) external nonReentrant whenNotPaused;

/// @notice Advance cycle: collect semua deposit, kirim pot ke pemenang giliran
/// @dev Callable by anyone when: semua member sudah deposit DAN cycle time sudah lewat
function advanceCycle(uint256 circleId) external nonReentrant whenNotPaused;

/// @notice Cek apakah semua member sudah deposit untuk current cycle
function allMembersPaid(uint256 circleId) public view returns (bool);

/// @notice Hitung siapa pemenang untuk cycle tertentu (round-robin)
function getCycleRecipient(uint256 circleId, uint256 cycleNumber) public view returns (address);

/// @notice Get payment status semua member untuk current cycle
function getCyclePaymentStatus(uint256 circleId) external view returns (address[] memory members, bool[] memory paid);

/// @notice Owner withdraw accumulated platform fees
function withdrawFees(address token) external onlyOwner;

/// @notice Get current cycle info
function getCurrentCycleInfo(uint256 circleId) external view returns (
    uint256 cycleNumber,
    uint256 cycleStartTime,
    uint256 cycleEndTime,
    address recipient,
    bool allPaid,
    bool canAdvance
);
```

### Events

```solidity
event DepositMade(uint256 indexed circleId, address indexed member, uint256 cycleNumber, uint256 amount);
event PotDistributed(uint256 indexed circleId, uint256 cycleNumber, address indexed recipient, uint256 potAmount, uint256 feeAmount);
event CycleAdvanced(uint256 indexed circleId, uint256 newCycleNumber);
event CircleCompleted(uint256 indexed circleId);
event FeesWithdrawn(address indexed token, uint256 amount);
```

### Logic Detail

#### `deposit(circleId)`

1. Check: circle status == Active
2. Check: caller is member
3. Check: caller hasn't paid current cycle yet (`!hasPaid[circleId][currentCycle][msg.sender]`)
4. Transfer `contributionAmount` dari caller ke contract via SafeERC20
5. Mark `hasPaid = true`
6. Emit `DepositMade`

#### `advanceCycle(circleId)`

1. Check: circle status == Active
2. Check: `allMembersPaid(circleId) == true`
3. Check: `block.timestamp >= startTime + (currentCycle * cycleDuration)` (cycle time sudah lewat)
4. Determine recipient: `members[currentCycle].addr` (round-robin by turnOrder)
5. Calculate fee: `totalPot * platformFeeBps / 10000`
6. Transfer `totalPot - fee` ke recipient via SafeERC20
7. Add fee ke `accumulatedFees`
8. Mark `cycleRecipient[circleId][currentCycle] = recipient`
9. Increment `currentCycle`
10. If `currentCycle >= totalCycles` → set status = Completed
11. Emit events

#### Round-robin order

- turnOrder = index saat join (0, 1, 2, ...)
- Cycle 0 → member dengan turnOrder 0 (creator)
- Cycle 1 → member dengan turnOrder 1
- dst.

#### Platform fee

- Default: 100 bps (1%)
- Owner bisa adjust via `setPlatformFee(uint256 newFeeBps)` — max 500 (5%)
- Fee accumulates in contract, owner withdraws separately

---

## Edge Cases

- Member belum deposit tapi cycle time habis → `advanceCycle` revert (semua HARUS deposit dulu)
- Late payment: tidak ada penalty di MVP, tapi payment baru bisa dilakukan untuk current cycle saja
- Double deposit: revert karena `hasPaid` check

---

## Output files

```
contracts/src/KitpotCircle.sol   ← updated with payment + distribution logic
```

---

## Dependencies

- **Blocked by:** Plan 02 (needs circle core)
- **Blocks:** Plan 04 (auto-signing builds on deposit), Plan 05 (deploy needs complete contract)
