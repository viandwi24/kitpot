#!/usr/bin/env bash
set -e

MINITIA_HOME="${MINITIA_HOME:-/data/.minitia}"
OPINIT_HOME="${OPINIT_HOME:-/data/.opinit}"

# ── Setup detection ───────────────────────────────────────────────────────────
# Chain is considered configured when genesis.json exists.
# If not present, wait for admin to run /setup.sh inside the container.

if [ ! -f "$MINITIA_HOME/config/genesis.json" ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           KITPOT NODE — WAITING FOR SETUP                   ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  Chain is not configured yet. Run setup inside container:   ║"
    echo "║                                                              ║"
    echo "║    docker exec -it <container> /setup.sh                    ║"
    echo "║                                                              ║"
    echo "║  Two modes available:                                        ║"
    echo "║    /setup.sh restore   — restore existing kitpot-2 chain    ║"
    echo "║                          (requires GENESIS_B64 etc in env)  ║"
    echo "║    /setup.sh init      — initialize fresh chain             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""

    while [ ! -f "$MINITIA_HOME/config/genesis.json" ]; do
        echo "[kitpot] No chain configured — waiting for setup... ($(date '+%H:%M:%S'))"
        sleep 10
    done

    echo "[kitpot] Setup detected. Starting node in 3 seconds..."
    sleep 3
fi

# ── Patch app.toml for public access + CORS ─────────────────────────────────
# InterwovenKit (browser) talks to REST :1317 and Cosmos RPC :26657. Both must:
#   (a) listen on 0.0.0.0 (not localhost) so Traefik/Nginx can reach them
#   (b) allow cross-origin requests from the Vercel frontend
#
# EVM JSON-RPC :8545 and WS :8546 only need the bind patch — CORS on EVM RPC
# is typically handled via reverse-proxy headers, and Ethereum-style JSON-RPC
# calls are preflight-exempt when using application/json.
if [ -f "$MINITIA_HOME/config/app.toml" ]; then
    # EVM JSON-RPC + WS bind to 0.0.0.0
    sed -i 's|address = "127.0.0.1:8545"|address = "0.0.0.0:8545"|g' "$MINITIA_HOME/config/app.toml"
    sed -i 's|address = "127.0.0.1:8546"|address = "0.0.0.0:8546"|g' "$MINITIA_HOME/config/app.toml"

    # Cosmos REST API — enable it (default: disabled), bind to 0.0.0.0, allow CORS.
    # Using sed range addressing to only touch keys within the [api] section,
    # because "enable = false" and "enabled-unsafe-cors = false" also appear
    # in [grpc], [grpc-web], [rosetta], [telemetry], [state-sync.snapshots], etc.
    sed -i '/^\[api\]/,/^\[/ s|^enable = false|enable = true|' "$MINITIA_HOME/config/app.toml"
    sed -i '/^\[api\]/,/^\[/ s|address = "tcp://localhost:1317"|address = "tcp://0.0.0.0:1317"|' "$MINITIA_HOME/config/app.toml"
    sed -i '/^\[api\]/,/^\[/ s|address = "tcp://127.0.0.1:1317"|address = "tcp://0.0.0.0:1317"|' "$MINITIA_HOME/config/app.toml"
    sed -i '/^\[api\]/,/^\[/ s|^enabled-unsafe-cors = false|enabled-unsafe-cors = true|' "$MINITIA_HOME/config/app.toml"
fi

if [ -f "$MINITIA_HOME/config/config.toml" ]; then
    # Cosmos RPC :26657 — bind + CORS
    sed -i 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|g' "$MINITIA_HOME/config/config.toml"
    sed -i 's|cors_allowed_origins = \[\]|cors_allowed_origins = ["*"]|g' "$MINITIA_HOME/config/config.toml"
fi

echo "[kitpot] Config patched:"
echo "  - EVM JSON-RPC  :8545  bind 0.0.0.0"
echo "  - EVM WebSocket :8546  bind 0.0.0.0"
echo "  - Cosmos RPC    :26657 bind 0.0.0.0, CORS enabled"
echo "  - Cosmos REST   :1317  enabled, bind 0.0.0.0, CORS enabled"

# ── Start minitiad rollup node ────────────────────────────────────────────────
echo "[kitpot] Starting minitiad..."
minitiad start --home="$MINITIA_HOME" &
MINITIAD_PID=$!

# ── Wait for EVM RPC to be ready ─────────────────────────────────────────────
# Wait for block >= 1, then sleep 5s to let the EVM JSON-RPC module fully
# initialize. Without the sleep, forge gets -32603 "jsonrpc is not ready"
# even though eth_blockNumber already returns a result.
echo "[kitpot] Waiting for EVM RPC on :8545..."
for i in $(seq 1 60); do
    BLOCK_HEX=$(curl -sf -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null \
        | python3 -c "import json,sys; print(json.load(sys.stdin).get('result','0x0'))" 2>/dev/null \
        || echo "0x0")
    BLOCK_NUM=$(python3 -c "print(int('${BLOCK_HEX}', 16))" 2>/dev/null || echo 0)
    if [ "${BLOCK_NUM:-0}" -ge 1 ]; then
        echo "[kitpot] EVM RPC up (block $BLOCK_NUM). Waiting 5s for full init..."
        sleep 5
        echo "[kitpot] EVM RPC ready."
        break
    fi
    sleep 2
done

# ── Start OPinit bots (optional) ─────────────────────────────────────────────
if [ "${RUN_OPINIT:-false}" = "true" ]; then

    mkdir -p "$OPINIT_HOME/executor" "$OPINIT_HOME/challenger"

    if [ ! -f "$OPINIT_HOME/executor/executor.json" ]; then
        echo "[kitpot] Initializing opinit executor config..."
        opinitd init executor --home="$OPINIT_HOME/executor"

        echo "$BRIDGE_EXECUTOR_MNEMONIC"  > /tmp/k1.txt
        echo "$OUTPUT_SUBMITTER_MNEMONIC" > /tmp/k2.txt
        echo "$BATCH_SUBMITTER_MNEMONIC"  > /tmp/k3.txt
        opinitd keys add "$L2_CHAIN_ID" bridge_executor  --home="$OPINIT_HOME/executor" --recover --source /tmp/k1.txt
        opinitd keys add "$L1_CHAIN_ID" output_submitter --home="$OPINIT_HOME/executor" --recover --source /tmp/k2.txt
        opinitd keys add "$L1_CHAIN_ID" batch_submitter  --home="$OPINIT_HOME/executor" --recover --source /tmp/k3.txt
        rm -f /tmp/k1.txt /tmp/k2.txt /tmp/k3.txt

        python3 - <<PYEOF
import json, os
cfg_path = "$OPINIT_HOME/executor/executor.json"
with open(cfg_path) as f:
    cfg = json.load(f)
cfg["version"] = 1
cfg["l1_node"]["chain_id"]      = os.environ["L1_CHAIN_ID"]
cfg["l1_node"]["rpc_address"]   = os.environ["L1_RPC_URL"]
cfg["l1_node"]["gas_price"]     = os.environ.get("L1_GAS_PRICE", "0.015uinit")
cfg["l1_node"]["bech32_prefix"] = "init"
cfg["l2_node"]["chain_id"]      = os.environ["L2_CHAIN_ID"]
cfg["l2_node"]["rpc_address"]   = "http://localhost:26657"
cfg["l2_node"]["bech32_prefix"] = "init"
cfg["da_node"]["chain_id"]      = os.environ["L1_CHAIN_ID"]
cfg["da_node"]["rpc_address"]   = os.environ["L1_RPC_URL"]
cfg["da_node"]["bech32_prefix"] = "init"
cfg["bridge_executor"]          = "bridge_executor"
cfg["oracle_bridge_executor"]   = ""
with open(cfg_path, "w") as f:
    json.dump(cfg, f, indent=2)
print("[kitpot] executor.json configured.")
PYEOF
    fi

    if [ ! -f "$OPINIT_HOME/challenger/challenger.json" ]; then
        echo "[kitpot] Initializing opinit challenger config..."
        opinitd init challenger --home="$OPINIT_HOME/challenger"

        echo "$CHALLENGER_MNEMONIC" > /tmp/k4.txt
        opinitd keys add "$L1_CHAIN_ID" challenger --home="$OPINIT_HOME/challenger" --recover --source /tmp/k4.txt
        rm -f /tmp/k4.txt

        python3 - <<PYEOF
import json, os
cfg_path = "$OPINIT_HOME/challenger/challenger.json"
with open(cfg_path) as f:
    cfg = json.load(f)
cfg["version"] = 1
cfg["l1_node"]["chain_id"]      = os.environ["L1_CHAIN_ID"]
cfg["l1_node"]["rpc_address"]   = os.environ["L1_RPC_URL"]
cfg["l1_node"]["bech32_prefix"] = "init"
cfg["l2_node"]["chain_id"]      = os.environ["L2_CHAIN_ID"]
cfg["l2_node"]["rpc_address"]   = "http://localhost:26657"
cfg["l2_node"]["bech32_prefix"] = "init"
with open(cfg_path, "w") as f:
    json.dump(cfg, f, indent=2)
print("[kitpot] challenger.json configured.")
PYEOF
    fi

    echo "[kitpot] Starting opinit executor..."
    opinitd start executor --home="$OPINIT_HOME/executor" &

    echo "[kitpot] Starting opinit challenger..."
    opinitd start challenger --home="$OPINIT_HOME/challenger" &
fi

echo "[kitpot] All processes running. Monitoring minitiad (PID $MINITIAD_PID)..."
wait $MINITIAD_PID
