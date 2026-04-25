#!/usr/bin/env bash
#
# sync-deploy.sh — single-shot contract redeploy + env sync
#
# What it does:
#   1. Runs `forge script Deploy.s.sol --broadcast` to deploy fresh contracts
#      to kitpot-2 testnet (5 contracts: MockUSDC, MockUSDe, Reputation,
#      Achievements, KitpotCircle).
#   2. Parses the new contract addresses from the latest broadcast file.
#   3. Updates `apps/web/.env.local` (local dev).
#   4. Updates `scripts/test/.deployed.json` (test scripts).
#   5. Updates the testnet hardcoded block in `scripts/test/config.ts`.
#   6. Prints a Vercel-ready env block for manual paste, OR auto-syncs via
#      `vercel env` CLI if installed and authenticated.
#
# Required env (set before running):
#   PRIVATE_KEY        — operator/deployer EVM private key (0x...)
#   KITPOT_RPC_URL     — kitpot-2 EVM JSON-RPC URL
#                        defaults to https://kitpot-rpc.viandwi24.com/
#
# Optional env:
#   DEPLOY_MOCK_USDE   — set to "1" to ALSO deploy MockUSDe via the standalone
#                        DeployMockUSDe.s.sol script (since main Deploy.s.sol
#                        does not include it).
#
# Usage:
#   ./scripts/sync-deploy.sh
#
# WARNING:
#   Re-running this WIPES on-chain state. Existing circles, NFT badges,
#   reputation entries — all gone (they live on the OLD contract addresses
#   which are now orphaned). Only run when you genuinely want a clean slate.
#
#   For most session work — DO NOT redeploy. Update env vars to point at the
#   already-live contracts. Use `cast call` to verify addresses still have code.
#

set -euo pipefail

# ── Paths ──────────────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_LOCAL="$ROOT/apps/web/.env.local"
DEPLOYED="$ROOT/scripts/test/.deployed.json"
CONFIG_TS="$ROOT/scripts/test/config.ts"
BROADCAST="$ROOT/contracts/broadcast/Deploy.s.sol/64146729809684/run-latest.json"
USDE_BROADCAST="$ROOT/contracts/broadcast/DeployMockUSDe.s.sol/64146729809684/run-latest.json"

# ── Config ─────────────────────────────────────────────────────────────
KITPOT_RPC_URL="${KITPOT_RPC_URL:-https://kitpot-rpc.viandwi24.com/}"

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "ERROR: PRIVATE_KEY env var not set"
  echo "Set it via:"
  echo "  export PRIVATE_KEY=0x<operator-private-key>"
  exit 1
fi

# ── Tool checks ────────────────────────────────────────────────────────
for tool in forge jq sed; do
  if ! command -v "$tool" &>/dev/null; then
    echo "ERROR: required tool '$tool' not in PATH"
    exit 1
  fi
done

# ── Step 1: Deploy core contracts ──────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Step 1/5 — Deploying core contracts (MockUSDC + Reputation +"
echo "             Achievements + KitpotCircle) to kitpot-2"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

cd "$ROOT/contracts"
forge script script/Deploy.s.sol \
  --rpc-url "$KITPOT_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --legacy
cd "$ROOT"

# ── Step 2 (optional): Deploy MockUSDe ─────────────────────────────────
if [[ "${DEPLOY_MOCK_USDE:-0}" == "1" ]]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════════════"
  echo "  Step 2/5 — Deploying MockUSDe (standalone script)"
  echo "═══════════════════════════════════════════════════════════════════"
  echo ""

  cd "$ROOT/contracts"
  forge script script/DeployMockUSDe.s.sol \
    --rpc-url "$KITPOT_RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --legacy
  cd "$ROOT"
fi

# ── Step 3: Parse new addresses ────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Step 3/5 — Parsing new contract addresses"
echo "═══════════════════════════════════════════════════════════════════"

if [[ ! -f "$BROADCAST" ]]; then
  echo "ERROR: broadcast file not found at $BROADCAST"
  exit 1
fi

USDC=$(jq -r '.transactions[] | select(.contractName=="MockUSDC") | .contractAddress' "$BROADCAST" | head -1)
REP=$(jq -r '.transactions[] | select(.contractName=="KitpotReputation") | .contractAddress' "$BROADCAST" | head -1)
ACH=$(jq -r '.transactions[] | select(.contractName=="KitpotAchievements") | .contractAddress' "$BROADCAST" | head -1)
KIT=$(jq -r '.transactions[] | select(.contractName=="KitpotCircle") | .contractAddress' "$BROADCAST" | head -1)

if [[ "${DEPLOY_MOCK_USDE:-0}" == "1" && -f "$USDE_BROADCAST" ]]; then
  USDE=$(jq -r '.transactions[] | select(.contractName=="MockUSDe") | .contractAddress' "$USDE_BROADCAST" | head -1)
else
  # Try to read existing USDe from .env.local if not redeploying
  USDE=$(grep -E "^NEXT_PUBLIC_USDE_ADDRESS=" "$ENV_LOCAL" 2>/dev/null | cut -d= -f2- || echo "")
fi

echo ""
echo "  KitpotCircle:        $KIT"
echo "  MockUSDC:            $USDC"
echo "  MockUSDe:            ${USDE:-(unchanged)}"
echo "  KitpotReputation:    $REP"
echo "  KitpotAchievements:  $ACH"

# Validate
for var_name in KIT USDC REP ACH; do
  val="${!var_name}"
  if [[ -z "$val" || "$val" == "null" ]]; then
    echo "ERROR: failed to parse $var_name from broadcast file"
    exit 1
  fi
done

# ── Step 4: Update local env files ─────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Step 4/5 — Updating local .env.local + .deployed.json + config.ts"
echo "═══════════════════════════════════════════════════════════════════"

# 4a. apps/web/.env.local
if [[ -f "$ENV_LOCAL" ]]; then
  sed -i.bak \
    -e "s|^NEXT_PUBLIC_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_CONTRACT_ADDRESS=$KIT|" \
    -e "s|^NEXT_PUBLIC_USDC_ADDRESS=.*|NEXT_PUBLIC_USDC_ADDRESS=$USDC|" \
    -e "s|^NEXT_PUBLIC_REPUTATION_ADDRESS=.*|NEXT_PUBLIC_REPUTATION_ADDRESS=$REP|" \
    -e "s|^NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS=.*|NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS=$ACH|" \
    "$ENV_LOCAL"
  if [[ -n "$USDE" && "${DEPLOY_MOCK_USDE:-0}" == "1" ]]; then
    sed -i.bak -e "s|^NEXT_PUBLIC_USDE_ADDRESS=.*|NEXT_PUBLIC_USDE_ADDRESS=$USDE|" "$ENV_LOCAL"
  fi
  rm -f "$ENV_LOCAL.bak"
  echo "  ✓ Updated $ENV_LOCAL"
else
  echo "  ⚠ Skipped $ENV_LOCAL (file not found — create from .env.example)"
fi

# 4b. scripts/test/.deployed.json
if [[ -f "$DEPLOYED" ]]; then
  jq --arg usdc "$USDC" --arg kit "$KIT" --arg rep "$REP" --arg ach "$ACH" --arg usde "$USDE" \
    'if $usde != "" then
       .MockUSDC=$usdc | .MockUSDe=$usde | .KitpotCircle=$kit | .KitpotReputation=$rep | .KitpotAchievements=$ach
     else
       .MockUSDC=$usdc | .KitpotCircle=$kit | .KitpotReputation=$rep | .KitpotAchievements=$ach
     end' "$DEPLOYED" > "$DEPLOYED.tmp"
  mv "$DEPLOYED.tmp" "$DEPLOYED"
  echo "  ✓ Updated $DEPLOYED"
else
  echo "  ⚠ Skipped $DEPLOYED (file not found)"
fi

# 4c. scripts/test/config.ts hardcoded testnet block (best-effort sed)
if [[ -f "$CONFIG_TS" ]]; then
  python3 - <<PYEOF || echo "  ⚠ Skipped config.ts patch (manual update may be needed)"
import re, sys
p = "$CONFIG_TS"
src = open(p).read()
mapping = {
    "MockUSDC":           "$USDC",
    "MockUSDe":           "${USDE:-}",
    "KitpotReputation":   "$REP",
    "KitpotAchievements": "$ACH",
    "KitpotCircle":       "$KIT",
}
for name, addr in mapping.items():
    if not addr:
        continue
    # Match line like:  MockUSDC: "0xOLD..."
    pattern = re.compile(rf'({re.escape(name)}\s*:\s*")0x[0-9a-fA-F]{{40}}(")')
    src, n = pattern.subn(rf'\g<1>{addr}\g<2>', src)
    if n:
        print(f"  ✓ Patched {name} in config.ts")
open(p, "w").write(src)
PYEOF
fi

# ── Step 5: Vercel sync (CLI) or print env block ───────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Step 5/5 — Vercel env sync"
echo "═══════════════════════════════════════════════════════════════════"

print_vercel_block() {
  echo ""
  echo "  ┌─ Paste these into Vercel → Settings → Environment Variables ─┐"
  echo ""
  printf "    NEXT_PUBLIC_CONTRACT_ADDRESS      = %s\n" "$KIT"
  printf "    NEXT_PUBLIC_USDC_ADDRESS          = %s\n" "$USDC"
  if [[ -n "$USDE" ]]; then
    printf "    NEXT_PUBLIC_USDE_ADDRESS          = %s\n" "$USDE"
  fi
  printf "    NEXT_PUBLIC_REPUTATION_ADDRESS    = %s\n" "$REP"
  printf "    NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS  = %s\n" "$ACH"
  echo ""
  echo "  Then redeploy via dashboard (uncheck 'Use existing Build Cache')"
  echo "  └─────────────────────────────────────────────────────────────┘"
}

if command -v vercel &>/dev/null; then
  echo "  Vercel CLI detected. Auto-syncing env vars..."
  echo "  (Skipping if not in a linked Vercel project)"

  if [[ -f "$ROOT/.vercel/project.json" ]]; then
    for env in production preview development; do
      echo "$KIT"  | vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS "$env" --force >/dev/null 2>&1 || true
      echo "$USDC" | vercel env add NEXT_PUBLIC_USDC_ADDRESS "$env" --force >/dev/null 2>&1 || true
      [[ -n "$USDE" ]] && echo "$USDE" | vercel env add NEXT_PUBLIC_USDE_ADDRESS "$env" --force >/dev/null 2>&1 || true
      echo "$REP"  | vercel env add NEXT_PUBLIC_REPUTATION_ADDRESS "$env" --force >/dev/null 2>&1 || true
      echo "$ACH"  | vercel env add NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS "$env" --force >/dev/null 2>&1 || true
    done
    echo "  ✓ Vercel env vars updated"
    echo ""
    echo "  Trigger redeploy with:  vercel --prod --force"
  else
    echo "  ⚠ Project not linked (.vercel/project.json missing)"
    echo "    Run: vercel link"
    print_vercel_block
  fi
else
  echo "  Vercel CLI not installed."
  echo "    Install with: npm i -g vercel  (then run 'vercel login' + 'vercel link')"
  print_vercel_block
fi

# ── Done ───────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✓ sync-deploy complete"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo "    1. Verify Vercel env vars (above)"
echo "    2. Trigger Vercel redeploy (uncheck Build Cache)"
echo "    3. Check https://kitpot.vercel.app/about — Program Overview should"
echo "       show the new contract addresses with green status dots"
echo ""
