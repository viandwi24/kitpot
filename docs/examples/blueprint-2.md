# Blueprint 2 — MiniBank (EVM Bank)

> **Source:** <https://docs.initia.xyz/hackathon/examples/evm-bank>
> **Native Initia feature:** Interwoven Bridge (`openBridge` / `openDeposit` / `openWithdraw`)
> **VM:** EVM / MiniEVM (Solidity via Foundry)
> **Purpose:** Reference implementation of cross-chain liquidity UX — connect an isolated appchain to the Interwoven Stack via native bridge modal.

---

## 1. One-paragraph summary

MiniBank is a digital piggy bank on a MiniEVM rollup. Users deposit native tokens via a payable Solidity function and withdraw by calling `withdraw(uint256)`. The value-add over a boring bank contract is the **"Bridge Assets" button** that opens InterwovenKit's native bridge modal — users move `uinit` from Initia L1 testnet (`initiation-2`) into the appchain without leaving the UI, then immediately deposit. One seamless flow demonstrates how an appchain plugs into the broader Initia ecosystem.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Contract | Solidity via Foundry |
| Frontend | Vite + React + TypeScript |
| SDK | `@initia/interwovenkit-react` + `@initia/initia.js` |
| EVM libs | `wagmi` + `viem` |
| Tx envelope | `/minievm.evm.v1.MsgCall` via `requestTxBlock` |
| Bridge | `openBridge({ srcChainId, srcDenom })` |

## 3. Directory layout

```
my-initia-project/
├── minibank/                   # Foundry project
│   ├── foundry.toml
│   ├── src/MiniBank.sol
│   ├── test/MiniBank.t.sol
│   └── script/Deploy.s.sol
└── minibank-frontend/          # Vite + React TS
    ├── .env
    ├── src/{main.jsx, App.jsx, Bank.jsx}
    └── vite.config.js
```

## 4. Contract design — `MiniBank.sol`

### State
```solidity
mapping(address => uint256) private balances;
```

### Functions
| Function | Visibility / payable | Purpose |
|---|---|---|
| `deposit()` | `external payable` | Credit `msg.value` to `balances[msg.sender]` |
| `withdraw(uint256 amount)` | `external` | Subtract amount, transfer via low-level `call{value:}` |
| `myBalance()` | `external view` returns (uint256) | `balances[msg.sender]` |
| `totalSavingsOf(address user)` | `external view` returns (uint256) | Public read of any user's balance |
| `receive()` | `external payable` | Plain ETH transfer auto-routes to `deposit()` logic |

### Events
```solidity
event Deposited(address indexed user, uint256 amount);
event Withdrawn(address indexed user, uint256 amount);
```

### Foundry tests
`test/MiniBank.t.sol` covers: deposit success, withdraw success, revert on insufficient balance.

## 5. Frontend integration — critical patterns

### 5.1 Provider config (EVM-specific)

```javascript
// src/main.jsx
const customChain = {
  chain_id: import.meta.env.VITE_APPCHAIN_ID,
  chain_name: "minibank",
  bech32_prefix: "init",
  apis: {
    rpc: [{ address: "http://localhost:26657" }],
    rest: [{ address: "http://localhost:1317" }],
    indexer: [{ address: "http://localhost:8080" }],
    "json-rpc": [{ address: "http://localhost:8545" }],    // EVM-specific key
  },
  fees: {
    fee_tokens: [{
      denom: import.meta.env.VITE_NATIVE_DENOM,
      fixed_min_gas_price: 0,
      low_gas_price: 0,
      average_gas_price: 0,
      high_gas_price: 0,
    }],
  },
  staking: { staking_tokens: [{ denom: import.meta.env.VITE_NATIVE_DENOM }] },
  metadata: {
    is_l1: false,
    minitia: { type: "minievm" },   // IMPORTANT: minievm
  },
  native_assets: [{
    denom: import.meta.env.VITE_NATIVE_DENOM,
    symbol: import.meta.env.VITE_NATIVE_SYMBOL,
    decimals: 18,                                          // EVM default
  }],
};
```

**Key difference from Move:** `apis."json-rpc"` key is required; `metadata.minitia.type = "minievm"`; `native_assets.decimals = 18` (vs Move's 6).

### 5.2 Tx submit — `MsgCall` wrapping EVM calldata

```javascript
// Bank.jsx
import { encodeFunctionData, parseUnits } from "viem";
import { useInterwovenKit } from "@initia/interwovenkit-react";

const { initiaAddress, requestTxBlock } = useInterwovenKit();

const depositTx = async (amount /* string, in whole tokens */) => {
  const input = encodeFunctionData({
    abi: MINI_BANK_ABI,
    functionName: "deposit",
    args: [],
  });

  return requestTxBlock({
    chainId: CHAIN_ID,
    messages: [{
      typeUrl: "/minievm.evm.v1.MsgCall",
      value: {
        sender: initiaAddress.toLowerCase(),           // bech32 lowercased (mandatory)
        contractAddr: MINI_BANK_ADDRESS,               // hex 0x...
        input,                                         // viem-encoded calldata
        value: parseUnits(amount, 18).toString(),      // native-token amount as string
        accessList: [],                                // EMPTY array mandatory
        authList: [],                                  // EMPTY array mandatory
      },
    }],
  });
};
```

**Gotchas:**
- `sender` **must be bech32** (from `initiaAddress`), lowercased. Using hex address here throws "decoding bech32 failed".
- `contractAddr` **must be hex** (`0x...`).
- `value` is a **string** (wei in base units for native). `"0"` for non-payable calls.
- `accessList: []` and `authList: []` are **mandatory** even if empty — Amino conversion crashes without them.

### 5.3 Bridge integration

```javascript
const { openBridge } = useInterwovenKit();

const handleBridge = async () => {
  await openBridge({
    srcChainId: "initiation-2",      // Initia L1 testnet
    srcDenom: "uinit",                // L1 native token
  });
};
```

**Local dev caveat:** modal may be blank if you pass `dstChainId` pointing at a local appchain not in the Initia registry. Omit `dstChainId` and the kit uses the current `defaultChainId`.

### 5.4 View via EVM JSON-RPC

For `myBalance()` / `totalSavingsOf(address)` reads, use `eth_call`:

```javascript
import { createPublicClient, http } from "viem";

const publicClient = createPublicClient({
  chain: { id: Number(CHAIN_ID_EVM), ... },
  transport: http(JSON_RPC_URL),
});

const balance = await publicClient.readContract({
  address: MINI_BANK_ADDRESS,
  abi: MINI_BANK_ABI,
  functionName: "myBalance",
  account: connectedHexAddress,       // needed for msg.sender in view
});
```

**Note:** `myBalance()` returns `balances[msg.sender]`. `eth_call` needs `from` parameter so appchain resolves correct sender.

## 6. Deployment flow (shell)

### 6.1 Contract

```bash
forge init minibank --no-git
cd minibank
# Paste src/MiniBank.sol, test/MiniBank.t.sol

forge build
forge test -vv

# Extract bytecode for minitiad CLI path
jq -r ".bytecode.object" out/MiniBank.sol/MiniBank.json \
  | tr -d "\n" | sed "s/^0x//" > minibank.bin

# Deploy via minitiad (Cosmos-wrapped EVM create)
CHAIN_ID=$(curl -s http://localhost:26657/status | jq -r ".result.node_info.network")
minitiad tx evm create minibank.bin \
  --from gas-station --keyring-backend test \
  --chain-id $CHAIN_ID --node http://localhost:26657 \
  --gas auto --gas-adjustment 1.4 --yes --output json
```

Alternatively (simpler): `forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast`.

### 6.2 Frontend

```bash
npm create vite@latest minibank-frontend -- --template react
cd minibank-frontend
npm install @initia/interwovenkit-react wagmi viem @tanstack/react-query @initia/initia.js

# .env required
VITE_APPCHAIN_ID=<chain_id>
VITE_MINIBANK_CONTRACT=<deployed address>
VITE_NATIVE_DENOM=<native denom>
VITE_NATIVE_SYMBOL=<symbol>
VITE_JSON_RPC_URL=http://localhost:8545

npm run dev
```

## 7. Smoke test flow

1. Connect wallet via InterwovenKit drawer
2. Click **Bridge Assets** → select `initiation-2` as source, `uinit` denom → bridge a small amount to appchain
3. Click **Deposit** with `1` → confirm via drawer → check `myBalance()` returns `1000000000000000000` (1e18 wei)
4. Click **Withdraw** with `0.5` → confirm → balance now `500000000000000000` (5e17 wei)
5. Verify `Deposited` / `Withdrawn` events emitted (via block explorer)

## 8. Scoring angle (INITIATE rubric)

| Criterion | How MiniBank wins |
|---|---|
| Originality & Track Fit (20%) | DeFi/yield track fit via financial primitive. Bridge angle makes it interoperable. |
| Technical Execution & Initia Integration (30%) | Proper EVM contract with Foundry tests. Correct `MsgCall` shape (bech32 sender, empty accessList/authList). Native bridge used as-is, not reimplemented. |
| Product Value & UX (20%) | Bridge modal is one-click. User doesn't think "two chains" — just a money flow. |
| Working Demo & Completeness (20%) | Minimal but complete: deposit/withdraw/view + bridge in single UI. |
| Market Understanding (10%) | Every DeFi app has deposit/withdraw; bridging problem is universal. |

## 9. Relevance to Kitpot (cross-reference)

Kitpot borrows from MiniBank:
- **MsgCall shape** — Kitpot's `useKitpotTx.ts` uses exact pattern: `sender: initiaAddress.toLowerCase()`, `contractAddr: hex`, `accessList: []`, `authList: []`.
- **customChain config** — Kitpot's `providers.tsx` mirrors this (with minievm type, 18 decimals, json-rpc key).
- **Bridge UX** — Kitpot's Faucet page exposes `openBridge()` button for the same cross-chain deposit UX.

MiniBank uses `requestTxBlock` (blocking, returns `DeliverTxResponse`). Kitpot conditionally switches between `requestTxBlock` and `submitTxBlock` based on `autoSign.isEnabledByChain`. MiniBank doesn't showcase auto-sign — that's BlockForge's territory.

## 10. openBridge / openDeposit / openWithdraw reference

From <https://docs.initia.xyz/interwovenkit/features/transfers/deposit-withdraw>:

```typescript
const { openDeposit, openWithdraw, openBridge } = useInterwovenKit();

// Generic bridge (both directions)
openBridge({
  srcChainId: "initiation-2",     // source chain
  srcDenom: "uinit",               // source denom
  // dstChainId, dstDenom optional — default to current chain
});

// Specifically deposit (L1 → appchain)
openDeposit({
  denoms: ["uinit"],               // required, non-empty array
  chainId: "initiation-2",         // source chain (L1)
  recipientAddress: initiaAddress,
});

// Specifically withdraw (appchain → L1)
openWithdraw({
  denoms: [NATIVE_DENOM],
  chainId: CHAIN_ID,
});
```

**When to use which:**
- `openBridge` — general, user picks direction
- `openDeposit` — flow knows it wants assets IN (recommended for faucet-style UX like MiniBank & Kitpot)
- `openWithdraw` — flow knows it wants assets OUT (e.g., claiming profit)

**Requirement:** wallet must be connected, else throws. Modal handles IBC / OPinit routing under the hood — devs don't need to know which.

## 11. References

- Source: <https://docs.initia.xyz/hackathon/examples/evm-bank>
- Deposit/withdraw docs: <https://docs.initia.xyz/interwovenkit/features/transfers/deposit-withdraw>
- InterwovenKit hooks: <https://docs.initia.xyz/interwovenkit/references/hooks/use-interwovenkit.md>
- Complete docs index: <https://docs.initia.xyz/llms.txt>

No companion GitHub repo referenced in source.
