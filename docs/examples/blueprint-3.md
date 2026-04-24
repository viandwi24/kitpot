# Blueprint 3 — MemoBoard (Wasm Social)

> **Source:** <https://docs.initia.xyz/hackathon/examples/wasm-social>
> **Native Initia feature:** Initia Usernames (`.init` resolution via `useUsernameQuery`)
> **VM:** CosmWasm 2.0.4
> **Purpose:** Reference implementation of social feed UX with human-readable identity — show `pochita.init` instead of `init1...` throughout the app.

---

## 1. One-paragraph summary

MemoBoard is an on-chain guestbook. Users post a short message; the contract appends `{ sender, message }` to a growing list; the frontend renders a feed with each row resolved to its author's `.init` username. For unknown senders it falls back to truncated address. The demo showcases how a social/consumer app on Initia can feel "like Twitter", not "like crypto", thanks to the native username registry at the L1 level.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Contract | Rust / CosmWasm 2.0.4 + `cw-storage-plus` |
| Frontend | Vite + React |
| SDK | `@initia/interwovenkit-react` + `@initia/initia.js` (RESTClient) |
| Tx envelope | `/cosmwasm.wasm.v1.MsgExecuteContract` via `requestTxSync` |
| Username resolution | `useUsernameQuery(address)` hook |
| Build | CosmWasm optimizer Docker image |

## 3. Directory layout

```
my-initia-project/
├── memoboard/                  # Rust workspace
│   ├── Cargo.toml
│   ├── src/{contract.rs, lib.rs, msg.rs, state.rs}
│   └── artifacts/memoboard.wasm   # Post-optimizer output
└── memoboard-frontend/         # Vite + React
    ├── .env
    ├── src/{main.jsx, App.jsx, Board.jsx}
    └── vite.config.js
```

## 4. Contract design — Rust/CosmWasm

### State
```rust
use cw_storage_plus::Item;

pub const MESSAGES: Item<Vec<Memo>> = Item::new("messages");

#[cw_serde]
pub struct Memo {
    pub sender: String,       // bech32 init1...
    pub message: String,
}
```

### Messages
```rust
#[cw_serde]
pub struct InstantiateMsg {}                // no params — initial empty list

#[cw_serde]
pub enum ExecuteMsg {
    PostMessage { message: String },
}

#[cw_serde]
pub enum QueryMsg {
    GetMessages {},
}

#[cw_serde]
pub struct MessagesResponse {
    pub messages: Vec<Memo>,
}
```

### Entrypoints

```rust
pub fn instantiate(deps: DepsMut, ...) -> StdResult<Response> {
    MESSAGES.save(deps.storage, &vec![])?;
    Ok(Response::new())
}

pub fn execute(deps: DepsMut, _: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::PostMessage { message } => {
            // validate message length, etc.
            let mut list = MESSAGES.load(deps.storage)?;
            list.push(Memo {
                sender: info.sender.to_string(),
                message,
            });
            MESSAGES.save(deps.storage, &list)?;
            Ok(Response::new().add_attribute("sender", info.sender))
        }
    }
}

pub fn query(deps: Deps, _: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetMessages {} => {
            let messages = MESSAGES.load(deps.storage)?;
            to_json_binary(&MessagesResponse { messages })
        }
    }
}
```

### Build (via CosmWasm optimizer)

```bash
docker run --rm -v "$(pwd)/memoboard":/code \
  --mount type=volume,source=cache,target=/code/target \
  cosmwasm/optimizer-arm64:0.17.0

# Produces memoboard/artifacts/memoboard.wasm (optimized)
```

## 5. Frontend integration — critical patterns

### 5.1 Provider config (Wasm-specific)

```javascript
// src/main.jsx
const customChain = {
  chain_id: import.meta.env.VITE_APPCHAIN_ID,
  chain_name: "social",
  bech32_prefix: "init",
  apis: {
    rpc: [{ address: import.meta.env.VITE_INITIA_RPC_URL }],
    rest: [{ address: import.meta.env.VITE_INITIA_REST_URL }],
    indexer: [{ address: import.meta.env.VITE_INITIA_INDEXER_URL }],
    "json-rpc": [{ address: import.meta.env.VITE_INITIA_JSON_RPC_URL }],
  },
  metadata: {
    is_l1: false,
    minitia: { type: "miniwasm" },   // IMPORTANT: miniwasm (not minievm / minimove)
  },
  native_assets: [{
    denom: import.meta.env.VITE_NATIVE_DENOM,
    decimals: 6,                     // Wasm conventionally 6
  }],
};

<InterwovenKitProvider
  defaultChainId={customChain.chain_id}
  customChain={customChain}
  customChains={[customChain]}
>
  <App />
</InterwovenKitProvider>
```

### 5.2 Contract execute — `MsgExecuteContract`

```javascript
// Board.jsx
import { useInterwovenKit } from "@initia/interwovenkit-react";

const { initiaAddress, requestTxSync } = useInterwovenKit();

const postMessage = async (content) => {
  // IMPORTANT: msg field is BYTES (Uint8Array), not object
  const msg = new TextEncoder().encode(
    JSON.stringify({ post_message: { message: content } })
  );

  return requestTxSync({
    chainId: CHAIN_ID,
    messages: [{
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: {
        sender: initiaAddress,           // bech32 init1...
        contract: CONTRACT_ADDRESS,      // bech32 init1... (Wasm contracts are bech32, not hex)
        msg,                             // Uint8Array-encoded JSON
        funds: [],                       // []Coin for attaching native tokens
      },
    }],
  });
};
```

**Gotcha:** `msg` must be `Uint8Array`, not a plain object. CosmWasm VM expects byte-serialized JSON at this layer. `TextEncoder().encode(JSON.stringify(...))` is the canonical path.

### 5.3 Contract query — `rest.wasm.smartContractState`

```javascript
import { RESTClient } from "@initia/initia.js";

const rest = new RESTClient(REST_URL, { chainId: CHAIN_ID });

// Query must be base64-encoded string for the REST URL
const queryData = Buffer.from(
  JSON.stringify({ get_messages: {} })
).toString("base64");

const res = await rest.wasm.smartContractState(CONTRACT_ADDRESS, queryData);
// res shape depends on contract — here: { messages: [...] }
const messages = res.messages;
```

**Gotcha:** `smartContractState` returns the decoded payload DIRECTLY, not wrapped in `res.data`. Inspect the actual response first.

### 5.4 Username resolution — the showcase feature

**Connected wallet display (own username):**
```javascript
const { initiaAddress, username, openWallet } = useInterwovenKit();

<button onClick={openWallet}>
  {username ? username : truncate(initiaAddress)}
</button>
```

- `username` from `useInterwovenKit()` is the connected wallet's `.init` handle (or `null`).

**Other wallet display (in feed):**
```javascript
import { useUsernameQuery } from "@initia/interwovenkit-react";

function MessageRow({ message, initiaAddress, username }) {
  // CRITICAL: call useUsernameQuery INSIDE row component, not in parent's .map()
  const { data: senderUsername } = useUsernameQuery(message.sender);

  const label = message.sender === initiaAddress
    ? (username ? username : truncate(message.sender))
    : (senderUsername ? senderUsername : truncate(message.sender));

  return (
    <div className="message">
      <span className="sender">{label}</span>
      <p>{message.message}</p>
    </div>
  );
}

function MessageList({ messages }) {
  const { initiaAddress, username } = useInterwovenKit();
  return messages.map((message, idx) => (
    <MessageRow
      key={`${message.sender}-${idx}`}
      message={message}
      initiaAddress={initiaAddress}
      username={username}
    />
  ));
}
```

**Why row component:** React hooks can't be called inside `.map()` conditionally. Extract each list item to its own component so `useUsernameQuery` runs in a stable hook order per row.

**Behavior:**
- `useUsernameQuery(address)` returns `{ data, isLoading }`.
- `data` = `"username.init"` if registered, else `null`, else `undefined` while fetching.
- Hook automatically queries Initia L1 via the TESTNET preset spread to `InterwovenKitProvider`.

## 6. Deployment flow (shell)

### 6.1 Contract (build + deploy)

```bash
# Build via CosmWasm optimizer (single command)
docker run --rm -v "$(pwd)/memoboard":/code \
  --mount type=volume,source=cache,target=/code/target \
  cosmwasm/optimizer-arm64:0.17.0

# Store Wasm code (returns CODE_ID)
minitiad tx wasm store ./memoboard/artifacts/memoboard.wasm \
  --from gas-station --keyring-backend test \
  --chain-id <CHAIN_ID> \
  --gas auto --gas-adjustment 1.4 --yes

# Instantiate (returns CONTRACT_ADDRESS)
minitiad tx wasm instantiate <CODE_ID> "{}" \
  --label memoboard \
  --from gas-station \
  --chain-id <CHAIN_ID> \
  --no-admin --yes

# Verify deployed
minitiad query wasm list-contract-by-code <CODE_ID>
```

### 6.2 Frontend

```bash
npm create vite@latest memoboard-frontend -- --template react
cd memoboard-frontend
npm install @initia/interwovenkit-react @initia/initia.js

# .env
VITE_APPCHAIN_ID=<chain_id>
VITE_CONTRACT_ADDRESS=<instantiated bech32 address>
VITE_INITIA_RPC_URL=http://localhost:26657
VITE_INITIA_REST_URL=http://localhost:1317
VITE_INITIA_INDEXER_URL=http://localhost:8080
VITE_INITIA_JSON_RPC_URL=http://localhost:8545
VITE_NATIVE_DENOM=<denom>

npm run dev
```

## 7. Local execution flow (step-by-step)

1. User connects via InterwovenKit drawer
2. Header shows `yourname.init` if user has claimed a username (else truncated `init1...`)
3. Feed loads via REST `rest.wasm.smartContractState(CONTRACT, base64(get_messages))`
4. Each row resolves sender's username via `useUsernameQuery(address)` in `MessageRow` component
5. User types message → submit via `requestTxSync({ MsgExecuteContract })`
6. Contract appends to list; drawer confirms; feed polls + updates

## 8. Scoring angle (INITIATE rubric)

| Criterion | How MemoBoard wins |
|---|---|
| Originality & Track Fit (20%) | Consumer / Gaming track fit. Social feed is universally recognized pattern. |
| Technical Execution & Initia Integration (30%) | Proper CosmWasm contract with Rust. Correct `msg: Uint8Array` encoding. Uses `useUsernameQuery` + `useInterwovenKit().username` — the idiomatic native approach. MessageRow pattern shows React hooks discipline. |
| Product Value & UX (20%) | Feed with `.init` usernames feels like Twitter. Non-crypto users would find it readable. |
| Working Demo & Completeness (20%) | Full path: rust build → deploy → UI post → query → render. Idempotent, reproducible. |
| Market Understanding (10%) | Social apps are huge. Any feed-based product benefits from native identity. |

## 9. Relevance to Kitpot (cross-reference)

Kitpot borrows from MemoBoard:
- **`useInterwovenKit().username`** for header's connected wallet display.
- **`useUsernameQuery(address)` called in child row component** — Kitpot's `InitUsername` wrapper component (`apps/web/src/components/username/init-username.tsx`) follows this pattern. Parent `.map()` passes address to child; child runs the hook.
- **Never roll custom REST** — plan 18 §3 H3 deleted `lib/initia/username.ts` for exactly this reason. `useUsernameQuery` IS the native way.

Kitpot currently doesn't showcase `.init` as strongly as MemoBoard because most test wallets (including Brave Wallet freshly created) don't have claimed usernames. Mitigation: claim `pochita.init` for the demo wallet via Initia username portal before recording demo video.

## 10. `.init` username resolution deep dive

From <https://docs.initia.xyz/developers/developer-guides/integrating-initia-apps/usernames>:

### Registry location

Username module deployed on testnet (initiation-2) at Move address:
```
0x42cd8467b1c86e59bf319e5664a09b6b5840bb3fac64f5ce690b5041c530565a
```

Module name: `usernames`.

### Resolve methods (Move view functions)

| Function | Signature | Returns |
|---|---|---|
| `get_address_from_name(name: String)` | — | `Option<address>` |
| `get_name_from_address(addr: address)` | — | `Option<String>` |

### REST client pattern

```javascript
import { RESTClient, bcs } from "@initia/initia.js";

const rest = new RESTClient("https://rest.testnet.initia.xyz", {
  chainId: "initiation-2",
});

const USERNAMES_MODULE = "0x42cd8467b1c86e59bf319e5664a09b6b5840bb3fac64f5ce690b5041c530565a";

// username → address
const nameBcs = bcs.string().serialize("pochita").toBase64();
const res = await rest.move.view(
  USERNAMES_MODULE,
  "usernames",
  "get_address_from_name",
  [],                 // typeArgs
  [nameBcs]           // args
);
// res.data = "0x..." or null

// address → username
const addrBcs = bcs.address().serialize("0x3338...").toBase64();
const res2 = await rest.move.view(
  USERNAMES_MODULE,
  "usernames",
  "get_name_from_address",
  [],
  [addrBcs]
);
// res2.data = "\"pochita\"" (needs JSON.parse) or null
```

**Gas per query:** ~5,699 gas (read-only L1 view function).

### Why `useUsernameQuery` is preferable

The hook wraps the above + React Query caching + error handling + stale-while-revalidate semantics. **Never hand-roll the REST call in app code.**

## 11. References

- Source: <https://docs.initia.xyz/hackathon/examples/wasm-social>
- Usernames guide: <https://docs.initia.xyz/developers/developer-guides/integrating-initia-apps/usernames>
- `useUsernameQuery` reference: <https://docs.initia.xyz/interwovenkit/references/hooks/use-username-query.md>
- `useInterwovenKit` reference: <https://docs.initia.xyz/interwovenkit/references/hooks/use-interwovenkit.md>

No companion GitHub repo referenced in source.
