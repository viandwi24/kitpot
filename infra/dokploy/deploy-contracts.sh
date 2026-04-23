#!/usr/bin/env bash
# Auto-deploy Kitpot contracts to the local rollup node.
# Called by entrypoint.sh after EVM RPC is confirmed ready.
set -e
set -o pipefail

DEPLOY_OUTPUT="${DEPLOY_OUTPUT:-/data/deployed.json}"
RPC_URL="http://localhost:8545"

# Already deployed?
if [ -f "$DEPLOY_OUTPUT" ]; then
    echo "[deploy] Contracts already deployed. Addresses:"
    cat "$DEPLOY_OUTPUT"
    exit 0
fi

# Resolve deployer private key
if [ -n "${DEPLOYER_PRIVATE_KEY:-}" ]; then
    PRIVATE_KEY="$DEPLOYER_PRIVATE_KEY"
elif [ -f /data/operator_private_key.hex ]; then
    PRIVATE_KEY=$(cat /data/operator_private_key.hex | tr -d '[:space:]')
else
    echo "[deploy] No private key found. Set DEPLOYER_PRIVATE_KEY or run /setup.sh init first."
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "[deploy] Private key is empty — skipping deployment."
    exit 1
fi

echo "[deploy] Deployer: $(cast wallet address "0x$PRIVATE_KEY" 2>/dev/null || echo "unknown")"
echo "[deploy] Deploying Kitpot contracts to $RPC_URL..."

cd /contracts

# Run forge deploy — redirect output to log file, check exit code explicitly
forge script script/Deploy.s.sol \
    --rpc-url "$RPC_URL" \
    --broadcast \
    2>&1 | tee /tmp/forge-deploy.log
FORGE_EXIT=${PIPESTATUS[0]}

if [ "$FORGE_EXIT" -ne 0 ]; then
    echo "[deploy] Forge broadcast failed (exit $FORGE_EXIT). Check /tmp/forge-deploy.log"
    exit 1
fi

echo "[deploy] Forge deploy succeeded. Extracting addresses..."

# Parse broadcast JSON — forge saves to broadcast/<script>/<chainId>/run-latest.json
CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL" 2>/dev/null || echo "")
BROADCAST_JSON=""
if [ -n "$CHAIN_ID" ]; then
    BROADCAST_JSON="/contracts/broadcast/Deploy.s.sol/${CHAIN_ID}/run-latest.json"
fi

if [ -n "$BROADCAST_JSON" ] && [ -f "$BROADCAST_JSON" ]; then
    python3 - <<PYEOF
import json, sys

with open("$BROADCAST_JSON") as f:
    broadcast = json.load(f)

addresses = {}
for tx in broadcast.get("transactions", []):
    name = tx.get("contractName")
    addr = tx.get("contractAddress")
    if name and addr:
        addresses[name] = addr

if not addresses.get("KitpotCircle"):
    print("[deploy] ERROR: KitpotCircle not found in broadcast JSON", file=sys.stderr)
    sys.exit(1)

output = {
    "KitpotCircle":       addresses.get("KitpotCircle", ""),
    "MockUSDC":           addresses.get("MockUSDC", ""),
    "KitpotReputation":   addresses.get("KitpotReputation", ""),
    "KitpotAchievements": addresses.get("KitpotAchievements", ""),
}

with open("$DEPLOY_OUTPUT", "w") as f:
    json.dump(output, f, indent=2)

print("[deploy] Deployed addresses:")
for k, v in output.items():
    print(f"  {k}: {v}")

print("")
print("Add to your .env / Vercel:")
print(f"  NEXT_PUBLIC_CONTRACT_ADDRESS={output['KitpotCircle']}")
print(f"  NEXT_PUBLIC_USDC_ADDRESS={output['MockUSDC']}")
print(f"  NEXT_PUBLIC_REPUTATION_ADDRESS={output['KitpotReputation']}")
print(f"  NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS={output['KitpotAchievements']}")
PYEOF
else
    echo "[deploy] Could not find broadcast JSON at: $BROADCAST_JSON"
    echo "[deploy] Raw forge output:"
    cat /tmp/forge-deploy.log
    exit 1
fi
