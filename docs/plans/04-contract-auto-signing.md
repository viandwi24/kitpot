# Plan 04 — Smart Contract: Auto-Signing Sessions

> Goal: Tambahkan session authorization ke contract sehingga operator bisa call `deposit()` atas nama member tanpa approval per-cycle. Referensi utama: Drip's GhostRegistry.sol pattern.

---

## Scope

- Session struct & storage (max amount, expiry, target circle)
- `authorizeSession()` — member approve auto-deposit 1x
- `revokeSession()` — member bisa cabut kapan saja
- `depositOnBehalf()` — operator (atau siapapun) trigger deposit pakai session
- `batchDeposit()` — trigger deposit untuk semua member yang punya session aktif

## Non-goals

- Frontend UI (Plan 09)
- Actual InterwovenKit auto-signing integration (itu di frontend, ini contract-level authorization)
- Testing

---

## Design Notes

### Dua layer auto-signing

1. **Contract-level (Plan ini):** Contract punya session authorization — "address X boleh call deposit atas nama saya untuk circle Y"
2. **InterwovenKit-level (Plan 09, frontend):** InterwovenKit's auto-signing = user approve tx signing di wallet level. Frontend trigger `depositOnBehalf()` tanpa user klik approve lagi.

Kedua layer ini saling melengkapi. Contract-level memastikan hanya authorized calls yang jalan. InterwovenKit-level memastikan tx bisa di-sign tanpa popup.

### Drip's GhostRegistry pattern

Di Drip, operator hanya bisa call 1 function yang sudah di-whitelist. Kita adopt pattern yang sama:
- Session hanya berlaku untuk `deposit()` pada circle tertentu
- Session punya max amount per call dan expiry timestamp
- Tidak ada open-ended authorization

---

## Contract Additions

### New Struct

```solidity
struct Session {
    uint256 circleId;           // session hanya berlaku untuk circle ini
    uint256 maxAmountPerCycle;  // max yang boleh ditarik per cycle
    uint256 expiry;             // timestamp session berakhir
    bool active;
}
```

### New State Variables

```solidity
// member => operator => Session
mapping(address => mapping(address => Session)) public sessions;

// Convenience: circleId => list of members with active sessions
// (untuk batchDeposit)
```

### New Functions

```solidity
/// @notice Member authorize operator untuk deposit atas namanya
/// @param operator Address yang boleh trigger deposit (bisa contract, bisa EOA)
/// @param circleId Circle yang di-authorize
/// @param maxAmountPerCycle Max amount per cycle (harus >= circle.contributionAmount)
/// @param expiry Timestamp session berakhir
function authorizeSession(
    address operator,
    uint256 circleId,
    uint256 maxAmountPerCycle,
    uint256 expiry
) external;

/// @notice Member revoke session
function revokeSession(address operator) external;

/// @notice Operator deposit atas nama member (menggunakan session)
/// @dev Transfers ERC20 dari MEMBER (bukan operator) ke contract
///      Requires: ERC20 approval dari member ke contract address
function depositOnBehalf(uint256 circleId, address member) external nonReentrant;

/// @notice Batch deposit untuk semua member dengan active session
/// @dev Caller bisa siapa saja (keeper, frontend, cron)
function batchDeposit(uint256 circleId) external nonReentrant;

/// @notice Check apakah session masih valid
function isSessionValid(address member, address operator, uint256 circleId) public view returns (bool);
```

### Events

```solidity
event SessionAuthorized(address indexed member, address indexed operator, uint256 indexed circleId, uint256 maxAmountPerCycle, uint256 expiry);
event SessionRevoked(address indexed member, address indexed operator);
event DepositOnBehalf(uint256 indexed circleId, address indexed member, address indexed operator, uint256 amount);
```

### Logic Detail

#### `authorizeSession()`

1. Check: caller is member of circleId
2. Check: `maxAmountPerCycle >= circles[circleId].contributionAmount`
3. Check: `expiry > block.timestamp`
4. Store session
5. Emit event

#### `depositOnBehalf(circleId, member)`

1. Check: session exists & active & not expired
2. Check: session.circleId matches
3. Check: `circles[circleId].contributionAmount <= session.maxAmountPerCycle`
4. Check: member hasn't paid current cycle yet
5. Transfer `contributionAmount` from MEMBER to contract (requires member has approved contract for ERC20)
6. Mark `hasPaid = true`
7. Emit events

#### `batchDeposit(circleId)`

Loop over all members of circle:
1. For each member: check if they have valid session with msg.sender as operator
2. If yes AND hasn't paid yet → call internal `_depositFor(circleId, member)`
3. Skip if no session or already paid (don't revert on skip)

### ERC20 Approval Flow

Penting: auto-signing BUKAN berarti contract bisa ambil token tanpa approval. Member tetap harus:
1. `token.approve(kitpotContractAddress, totalAmount)` — one-time, amount = contributionAmount * totalCycles
2. `authorizeSession(operator, circleId, amount, expiry)` — one-time

Setelah dua approval ini, operator bisa `depositOnBehalf()` setiap cycle tanpa member klik apapun.

---

## Output files

```
contracts/src/KitpotCircle.sol   ← updated with session authorization
```

---

## Dependencies

- **Blocked by:** Plan 03 (needs deposit logic)
- **Blocks:** Plan 05 (deploy needs complete contract), Plan 09 (frontend auto-signing UI)
