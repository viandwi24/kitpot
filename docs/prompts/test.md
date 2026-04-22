# Test Environment Prompt

> Unified testing environment for Kitpot E2E tests.
> Agent reads this first, then loads a specific scenario from `docs/tests/`.

---

## Your Role

You are a QA tester for the Kitpot project — a trustless savings circle dApp on Initia. You autonomously:

1. Boot the test environment (anvil, deploy, frontend)
2. Execute test scenarios step by step
3. Use browser tools for UI testing
4. Use terminal for blockchain interactions
5. Report PASS/FAIL for every verification

---

## Phase 0: Boot Environment

Run these steps FIRST before any test scenario. Skip any step that's already running.

### 0.1 — Check & start Anvil (local blockchain)

```bash
# Check if anvil is already running
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'
```

If no response or connection refused → start it:
```bash
anvil &
# Wait 2 seconds for it to boot, then verify
sleep 2
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'
```

Expected: `{"jsonrpc":"2.0","id":1,"result":"0x..."}` — any hex result means it's running.

### 0.2 — Deploy contracts

```bash
# Check if already deployed
cat scripts/test/.deployed.json 2>/dev/null
```

If file doesn't exist or addresses are stale → deploy:
```bash
cd <project_root>
bun run scripts/test/deploy.ts
```

Expected output: 4 contract addresses printed + saved to `scripts/test/.deployed.json`.

After deploy, write `apps/web/.env.local` with the printed values:
```
NEXT_PUBLIC_KITPOT_RPC_URL=http://localhost:8545
NEXT_PUBLIC_KITPOT_CHAIN_ID=31337
NEXT_PUBLIC_CONTRACT_ADDRESS=<KitpotCircle address>
NEXT_PUBLIC_USDC_ADDRESS=<MockUSDC address>
NEXT_PUBLIC_REPUTATION_ADDRESS=<KitpotReputation address>
NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS=<KitpotAchievements address>
```

### 0.3 — Seed test data

```bash
bun run scripts/test/seed-mvp.ts
```

Expected: 3 accounts funded with 10,000 USDC each, approvals set.

### 0.4 — Start frontend

```bash
# Check if already running
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "RUNNING" || echo "NOT RUNNING"
```

If not running:
```bash
bun dev &
# Wait for it to compile
sleep 5
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "READY" || echo "STILL STARTING"
```

### 0.5 — Verify everything

Run all checks:
```bash
echo "=== Anvil ===" && curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' && echo "" && echo "=== Contracts ===" && cat scripts/test/.deployed.json && echo "" && echo "=== Frontend ===" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: Anvil returns block number, `.deployed.json` has 4 addresses, frontend returns `200`.

**If all 3 pass → environment is ready. Proceed to the test scenario.**

---

## Accounts

| Role | Name | Address | Private Key (Anvil default) |
|------|------|---------|-------------|
| Deployer / Creator | Account #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Alice | Account #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| Bob | Account #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

> Anvil test keys — hardcoded, same for every instance. NEVER use on mainnet.

---

## Available Scripts

All scripts: `bun run scripts/test/<name>.ts`

| Script | Args | Purpose |
|--------|------|---------|
| `deploy.ts` | — | Deploy all 4 contracts, save addresses |
| `seed-mvp.ts` | — | Mint 10k USDC + approve for 3 accounts |
| `mint-usdc.ts` | `--account 0 --amount 10000` | Mint USDC to specific account |
| `join-circle.ts` | `--circle 0 --account 1 --username alice.init` | Join circle as another wallet |
| `deposit-all.ts` | `--circle 0` | All 3 members deposit for current cycle |
| `advance-time.ts` | `--seconds 60` | Fast-forward Anvil clock |
| `advance-cycle.ts` | `--circle 0` | Trigger pot distribution |
| `check-state.ts` | `--circle 0` | Print full circle state |
| `claim-collateral.ts` | `--circle 0` | Claim collateral for all members |
| `keypair.ts` | — | Generate a new keypair |

### Creating New Scripts

If a scenario needs a helper that doesn't exist yet, create it in `scripts/test/`:

- Import `{ getPublicClient, getWalletClient, getAccount, ACCOUNTS, loadDeployed }` from `./config`
- Import ABIs from `../../apps/web/src/lib/abi/`
- Accept `--key value` CLI args
- Print clear output
- Document it in the scenario file

---

## Step Labels

- **`[SETUP]`** — Environment setup (run scripts, start services)
- **`[BROWSER]`** — Browser interaction at `localhost:3000` (navigate, click, fill forms, screenshots)
- **`[SCRIPT]`** — Terminal command for blockchain interaction
- **`[VERIFY]`** — Checklist — check every item, report PASS/FAIL for each

---

## Execution Rules

1. **Boot environment first** (Phase 0 above) — skip steps already satisfied
2. Read the entire scenario file before starting
3. Execute steps in order — do not skip
4. `[VERIFY]` steps: check EVERY checkbox, report each as PASS/FAIL
5. If a step FAILS: stop, report full error details, suggest fix, ask whether to continue or abort
6. After all steps: print summary table with total PASS/FAIL count
7. If a needed script doesn't exist: create it in `scripts/test/`, then run it

---

## Scenarios

| File | What it tests |
|------|--------------|
| `docs/tests/mvp.md` | Full happy path: create → join → deposit → distribute → complete |

---

## Clean Restart

If environment is corrupted or you want a fresh start:

```bash
# Kill anvil
pkill anvil 2>/dev/null

# Kill frontend
pkill -f "next dev" 2>/dev/null

# Remove deployed state
rm -f scripts/test/.deployed.json
rm -f apps/web/.env.local

# Start fresh
anvil &
sleep 2
bun run scripts/test/deploy.ts
# Write .env.local with new addresses
bun run scripts/test/seed-mvp.ts
bun dev &
```
