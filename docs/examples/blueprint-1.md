# Blueprint 1 — BlockForge (Move Game)

> **Source:** <https://docs.initia.xyz/hackathon/examples/move-game>
> **Native Initia feature:** Auto-signing / Session UX (`/initia.move.v1.MsgExecute`)
> **VM:** Move 2.1 (minimove)
> **Purpose:** Reference implementation of "invisible UX" for high-frequency gameplay via InterwovenKit Ghost Wallet pattern.

---

## 1. One-paragraph summary

BlockForge is a crafting engine. Players mint shards (free), burn 2 shards to craft a relic, and see on-chain inventory update live. The demo's core point is that after setting up auto-signing once, every `mint_shard` and `craft_relic` call runs **without a wallet popup** — the session-derived "Ghost Wallet" signs on behalf of the user under `authz` + `feegrant` delegation.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Contract | Move 2.1 with InitiaStdlib dep |
| Frontend | Vite + React |
| SDK | `@initia/interwovenkit-react` + `@initia/initia.js` (RESTClient, AccAddress) |
| Wagmi/Query | `wagmi` + `@tanstack/react-query` |
| Tx envelope | `/initia.move.v1.MsgExecute` via `requestTxSync` |
| Session UX | Ghost Wallet via `autoSign.enable(chainId, { permissions: [...] })` |

## 3. Directory layout

```
my-initia-project/
├── blockforge/                 # Move package (name = module author)
│   ├── Move.toml
│   └── sources/
│       └── items.move
└── blockforge-frontend/        # Vite + React app
    ├── .env
    ├── src/{main.jsx, App.jsx, Game.jsx, index.css}
    └── vite.config.js
```

## 4. Contract design — `blockforge::items`

### Resources
```move
struct Inventory has key {
    shards: u64,
    relics: u64,
}

struct InventoryView has copy, drop, store {
    shards: u64,
    relics: u64,
}
```

### Entrypoints
| Function | Signature | Effect |
|---|---|---|
| `mint_shard` | `entry fun mint_shard(account: &signer)` | `+1` shard |
| `craft_relic` | `entry fun craft_relic(account: &signer)` | `-2` shards, `+1` relic |

### Views (`#[view]`)
- `inventory_of(addr: address): InventoryView`
- `shard_count(addr: address): u64`
- `relic_count(addr: address): u64`

### Initialization
Inventory is lazy: first `mint_shard` call triggers `ensure_inventory()` that `move_to(account, Inventory { shards: 0, relics: 0 })`.

## 5. Frontend integration — critical patterns

### 5.1 Provider config (Move-specific)

```jsx
// src/main.jsx
import { InterwovenKitProvider, TESTNET } from "@initia/interwovenkit-react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

const customChain = {
  chain_id: import.meta.env.VITE_APPCHAIN_ID,
  chain_name: "BlockForge Appchain",
  pretty_name: "BlockForge",
  bech32_prefix: "init",
  network_type: "testnet",
  apis: {
    rpc: [{ address: import.meta.env.VITE_INITIA_RPC_URL }],
    rest: [{ address: import.meta.env.VITE_INITIA_REST_URL }],
    indexer: [{ address: import.meta.env.VITE_INITIA_INDEXER_URL }],
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
    minitia: { type: "minimove" },   // IMPORTANT: minimove, not minievm
  },
  native_assets: [{
    denom: import.meta.env.VITE_NATIVE_DENOM,
    name: "Native Token",
    symbol: import.meta.env.VITE_NATIVE_SYMBOL,
    decimals: Number(import.meta.env.VITE_NATIVE_DECIMALS ?? 6),
  }],
};

<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <InterwovenKitProvider
      {...TESTNET}
      defaultChainId={customChain.chain_id}
      enableAutoSign={true}
      customChain={customChain}
      customChains={[customChain]}
    >
      <App />
    </InterwovenKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

### 5.2 Tx submit — `MsgExecute` with auto-sign awareness

```jsx
// Game.jsx
import { MsgExecute } from "@initia/initia.proto/initia/move/v1/tx";
import { useInterwovenKit } from "@initia/interwovenkit-react";

const submitAction = async (functionName) => {
  const { initiaAddress, requestTxSync, autoSign } = useInterwovenKit();
  const isAutoSignEnabled = autoSign?.isEnabledByChain?.[CHAIN_ID];

  return requestTxSync({
    chainId: CHAIN_ID,
    autoSign: isAutoSignEnabled,                  // true → silent
    feeDenom: isAutoSignEnabled ? NATIVE_DENOM : undefined,
    messages: [{
      typeUrl: "/initia.move.v1.MsgExecute",
      value: MsgExecute.fromPartial({
        sender: initiaAddress,                    // bech32 init1...
        moduleAddress: MODULE_ADDRESS,            // bech32 (address of module owner)
        moduleName: "items",
        functionName,                             // "mint_shard" or "craft_relic"
        typeArgs: [],                             // Move generics (none here)
        args: [],                                 // Move args (none here)
      }),
    }],
  });
};
```

### 5.3 Resource query — `rest.move.resource`

```jsx
import { RESTClient, AccAddress } from "@initia/initia.js";

const MODULE_ADDRESS_HEX = AccAddress.toHex(MODULE_ADDRESS);       // 0x... without padding
const INVENTORY_STRUCT_TAG = `${MODULE_ADDRESS_HEX}::items::Inventory`;
const rest = new RESTClient(REST_URL, { chainId: CHAIN_ID });

const resource = await rest.move.resource(
  initiaAddress,              // owner (bech32)
  INVENTORY_STRUCT_TAG,       // struct tag (hex address)
);

const inventory = {
  shards: Number(resource.data?.shards ?? 0),
  relics: Number(resource.data?.relics ?? 0),
};
```

**Gotcha:** `rest.move.resource` needs owner in **bech32** but struct tag in **hex** module address. Mixing formats returns `invalid struct tag`.

### 5.4 Auto-sign toggle with permission array

```jsx
const toggleAutoSign = async () => {
  const isEnabled = Boolean(autoSign?.isEnabledByChain?.[CHAIN_ID]);

  if (isEnabled) {
    try {
      await autoSign.disable(CHAIN_ID);
    } catch (err) {
      // Recovery: if "authorization not found", re-enable and disable to reset
      if (String(err?.message).includes("authorization not found")) {
        await autoSign.enable(CHAIN_ID, {
          permissions: ["/initia.move.v1.MsgExecute"],
        });
        await autoSign.disable(CHAIN_ID);
      }
    }
  } else {
    await autoSign.enable(CHAIN_ID, {
      permissions: ["/initia.move.v1.MsgExecute"],
    });
  }
};
```

**Important permissions note:** For Move, `permissions` must list the exact Move message type `/initia.move.v1.MsgExecute`. EVM would use `/minievm.evm.v1.MsgCall`. Wasm uses `/cosmwasm.wasm.v1.MsgExecuteContract`.

## 6. Deployment flow (shell commands)

### 6.1 Contract

```bash
mkdir blockforge && cd blockforge
minitiad move new blockforge

# Get gas-station hex
GAS_STATION_BECH32=$(minitiad keys show gas-station -a --keyring-backend test)
GAS_STATION_HEX=$(minitiad keys parse "$GAS_STATION_BECH32" | grep bytes | awk '{print "0x" $2}')

# Build
minitiad move build --language-version=2.1 \
  --named-addresses blockforge=$GAS_STATION_HEX

# Test
minitiad move test --language-version=2.1 \
  --named-addresses blockforge=$GAS_STATION_HEX

# Deploy
minitiad move deploy --build \
  --language-version=2.1 \
  --named-addresses blockforge=$GAS_STATION_HEX \
  --from gas-station --keyring-backend test \
  --chain-id $(curl -s http://localhost:26657/status | jq -r ".result.node_info.network") \
  --gas auto --gas-adjustment 1.4 --yes
```

### 6.2 Frontend

```bash
npm create vite@latest blockforge-frontend -- --template react
cd blockforge-frontend
npm install @initia/initia.js @initia/interwovenkit-react @tanstack/react-query wagmi buffer util
npm install -D vite-plugin-node-polyfills

# .env required
VITE_APPCHAIN_ID=<chain_id>
VITE_INITIA_RPC_URL=http://localhost:26657
VITE_INITIA_REST_URL=http://localhost:1317
VITE_INITIA_INDEXER_URL=http://localhost:8080
VITE_NATIVE_DENOM=<denom>
VITE_NATIVE_SYMBOL=<symbol>
VITE_NATIVE_DECIMALS=6
VITE_BLOCKFORGE_MODULE_ADDRESS=<module_owner_bech32>

npm run dev
```

## 7. Judge test scenarios (from doc)

1. Connect wallet → click **Mint Shard** → inventory shards +1
2. Mint 2 shards → click **Craft Relic** → shards −2, relics +1
3. Mint 1 shard → click **Craft Relic** → expect tx failure (insufficient resources)
4. Click **Enable Auto-Sign** → approve session setup (drawer + popup once)
5. With auto-sign ON, **Mint Shard** → NO wallet popup, tx confirms silently
6. Click **Disable Auto-Sign** → next action prompts for signature again
7. Refresh page → inventory restored from on-chain `rest.move.resource`

## 8. Scoring angle for judges (INITIATE rubric)

| Criterion | How BlockForge wins |
|---|---|
| Originality & Track Fit (20%) | Gaming track fit: crafting game is clear product, not generic demo. |
| Technical Execution & Initia Integration (30%) | Move contract with typed resources + views + #[view] annotations. Auto-sign with explicit `permissions` array. Proper `rest.move.resource` query with bech32/hex split. Uses `@initia/initia.js` for SDK-level interaction. |
| Product Value & UX (20%) | Silent gameplay after one-time approval — killer moment. Would convert easily to real game. |
| Working Demo & Completeness (20%) | Minimum 7 scenarios documented. Full deployment path reproducible. |
| Market Understanding (10%) | Gaming market is huge; this pattern applicable to every on-chain game. |

## 9. Relevance to Kitpot (cross-reference)

Kitpot borrows from BlockForge:
- **Auto-sign flow pattern** — Kitpot uses same `autoSign.enable(chainId, { permissions })` but with `/minievm.evm.v1.MsgCall` permission for EVM.
- **Silent tx after setup** — Kitpot `submitTxBlock` branch mirrors BlockForge `requestTxSync({ autoSign: true, feeDenom })`.
- **Resource-style queries** — Kitpot uses `cast call` style viewing instead of `rest.move.resource` since we're EVM.

BlockForge's `autoSign.enable` signature with `{ permissions: [...] }` **differs from our Kitpot implementation** — plan 18 §2.2 says `autoSign.enable(chainId)` only (no permissions arg). The plan document was drafted against the docs which were ambiguous; BlockForge's concrete code confirms permissions can be passed if app needs tighter scoping. If Kitpot regresses on auto-sign, check the BlockForge pattern for `permissions` syntax.

## 10. References

- Source: <https://docs.initia.xyz/hackathon/examples/move-game>
- InterwovenKit docs: <https://docs.initia.xyz/interwovenkit/>
- Auto-sign introduction: <https://docs.initia.xyz/interwovenkit/features/autosign/introduction>
- InitiaStdlib: `{ git = "https://github.com/initia-labs/movevm.git", subdir = "precompile/modules/initia_stdlib", rev = "main" }`

No companion GitHub repo was referenced in the source doc.
