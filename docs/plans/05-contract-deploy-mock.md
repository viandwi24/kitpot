# Plan 05 — Contract Deploy Scripts & Mock Token

> Goal: Foundry deploy scripts siap pakai + MockUSDC token untuk testing. Semua yang dibutuhkan untuk deploy ke kitpot-1 testnet.

---

## Scope

- `MockUSDC.sol` — ERC20 token untuk testing (mintable, 6 decimals)
- `Deploy.s.sol` — deploy KitpotCircle + MockUSDC ke testnet
- `SetupDemo.s.sol` — script untuk setup demo scenario (create circle, join, approve)
- Contract ABI export untuk frontend

## Non-goals

- Actual deployment (itu di Plan 10)
- Testing / `forge test`
- Foundry tests (written but not run)

---

## Files

### 1. `contracts/src/MockUSDC.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Mock USDC for testnet. Anyone can mint. 6 decimals like real USDC.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Anyone can mint on testnet
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

### 2. `contracts/script/Deploy.s.sol`

```solidity
// Deploy KitpotCircle + MockUSDC
// Usage: forge script script/Deploy.s.sol --rpc-url $KITPOT_RPC_URL --broadcast

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        // 1. Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();

        // 2. Deploy KitpotCircle (owner = deployer, fee = 1%)
        KitpotCircle kitpot = new KitpotCircle(100); // 100 bps = 1%

        vm.stopBroadcast();

        // Log addresses
        console.log("MockUSDC:", address(usdc));
        console.log("KitpotCircle:", address(kitpot));
    }
}
```

### 3. `contracts/script/SetupDemo.s.sol`

Script untuk prep demo scenario:

```solidity
// Setelah deploy, jalankan ini untuk setup demo:
// 1. Mint 10,000 USDC ke 5 test wallets
// 2. Create circle "Arisan Alumni" (5 members, 100 USDC, 60s cycle)
// 3. Join circle dari 4 wallet lainnya
// 4. Approve USDC spending dari semua wallets ke contract
// 5. Authorize sessions dari semua wallets
```

### 4. ABI Export

Setelah `forge build` (di Plan 10), ABI akan tersedia di:
```
contracts/out/KitpotCircle.sol/KitpotCircle.json
contracts/out/MockUSDC.sol/MockUSDC.json
```

Untuk frontend, buat:
```
apps/web/src/lib/abi/
├── KitpotCircle.ts   ← export const KITPOT_ABI = [...] as const
└── MockUSDC.ts       ← export const MOCK_USDC_ABI = [...] as const
```

> ABI di-copy manual setelah forge build di Plan 10. Untuk sekarang, buat placeholder files dengan ABI yang ditulis manual dari function signatures.

### 5. Foundry Test Files (ditulis, tidak dijalankan)

```
contracts/test/KitpotCircle.t.sol   ← basic tests for circle CRUD, payments, sessions
contracts/test/MockUSDC.t.sol       ← mint & transfer tests
```

Test ditulis sekarang supaya siap dijalankan di Plan 10.

---

## foundry.toml update

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.26"

[rpc_endpoints]
kitpot = "${KITPOT_RPC_URL}"
```

---

## Output files

```
contracts/
├── src/
│   ├── KitpotCircle.sol     (dari Plan 02-04)
│   └── MockUSDC.sol         ← NEW
├── script/
│   ├── Deploy.s.sol         ← NEW
│   └── SetupDemo.s.sol      ← NEW
├── test/
│   ├── KitpotCircle.t.sol   ← NEW (written, not run)
│   └── MockUSDC.t.sol       ← NEW (written, not run)
├── foundry.toml             ← UPDATED
apps/web/src/lib/abi/
├── KitpotCircle.ts          ← NEW (placeholder ABI)
└── MockUSDC.ts              ← NEW (placeholder ABI)
```

---

## Dependencies

- **Blocked by:** Plan 04 (needs complete contract)
- **Blocks:** Plan 10 (deploy needs scripts), Plan 06-09 (frontend needs ABI placeholders)
