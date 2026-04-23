#!/usr/bin/env bash
set -e

MINITIA_HOME="${MINITIA_HOME:-/data/.minitia}"
OPINIT_HOME="${OPINIT_HOME:-/data/.opinit}"

# ── Patch app.toml for public access ────────────────────────────────────────
# Ensure JSON-RPC and Tendermint RPC are bound to 0.0.0.0 (not just localhost)
if [ -f "$MINITIA_HOME/config/app.toml" ]; then
    sed -i 's|address = "127.0.0.1:8545"|address = "0.0.0.0:8545"|g' "$MINITIA_HOME/config/app.toml"
    sed -i 's|address = "127.0.0.1:8546"|address = "0.0.0.0:8546"|g' "$MINITIA_HOME/config/app.toml"
fi
if [ -f "$MINITIA_HOME/config/config.toml" ]; then
    sed -i 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|g' "$MINITIA_HOME/config/config.toml"
fi

# ── Start minitiad rollup node ───────────────────────────────────────────────
echo "[entrypoint] Starting minitiad..."
minitiad start --home="$MINITIA_HOME" &
MINITIAD_PID=$!

# ── Wait for EVM RPC to be ready ─────────────────────────────────────────────
echo "[entrypoint] Waiting for EVM RPC on :8545..."
for i in $(seq 1 60); do
    if curl -sf -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        > /dev/null 2>&1; then
        echo "[entrypoint] EVM RPC ready."
        break
    fi
    sleep 2
done

# ── Start OPinit bots (optional) ─────────────────────────────────────────────
if [ "${RUN_OPINIT:-false}" = "true" ]; then

    mkdir -p "$OPINIT_HOME/executor" "$OPINIT_HOME/challenger"

    # Initialize executor config if not present
    if [ ! -f "$OPINIT_HOME/executor/executor.json" ]; then
        echo "[entrypoint] Initializing opinit executor config..."
        opinitd init executor --home="$OPINIT_HOME/executor"

        # Add keys from env
        echo "$BRIDGE_EXECUTOR_MNEMONIC"    | opinitd keys add "$L1_CHAIN_ID" bridge_executor    --home="$OPINIT_HOME/executor" --recover
        echo "$OUTPUT_SUBMITTER_MNEMONIC"   | opinitd keys add "$L1_CHAIN_ID" output_submitter   --home="$OPINIT_HOME/executor" --recover
        echo "$BATCH_SUBMITTER_MNEMONIC"    | opinitd keys add "$L1_CHAIN_ID" batch_submitter    --home="$OPINIT_HOME/executor" --recover

        # Patch executor.json with actual values
        python3 - <<PYEOF
import json, os
cfg_path = "$OPINIT_HOME/executor/executor.json"
with open(cfg_path) as f:
    cfg = json.load(f)
cfg["version"] = 1
cfg["l1_node"]["chain_id"]    = os.environ["L1_CHAIN_ID"]
cfg["l1_node"]["rpc_address"] = os.environ["L1_RPC_URL"]
cfg["l1_node"]["gas_price"]   = os.environ.get("L1_GAS_PRICE", "0.015uinit")
cfg["l1_node"]["bech32_prefix"] = "init"
cfg["l2_node"]["chain_id"]    = os.environ["L2_CHAIN_ID"]
cfg["l2_node"]["rpc_address"] = "http://localhost:26657"
cfg["l2_node"]["bech32_prefix"] = "init"
cfg["da_node"]["chain_id"]    = os.environ["L1_CHAIN_ID"]
cfg["da_node"]["rpc_address"] = os.environ["L1_RPC_URL"]
cfg["da_node"]["bech32_prefix"] = "init"
cfg["bridge_executor"]        = "bridge_executor"
cfg["oracle_bridge_executor"] = "bridge_executor"
with open(cfg_path, "w") as f:
    json.dump(cfg, f, indent=2)
print("[entrypoint] executor.json configured.")
PYEOF
    fi

    # Initialize challenger config if not present
    if [ ! -f "$OPINIT_HOME/challenger/challenger.json" ]; then
        echo "[entrypoint] Initializing opinit challenger config..."
        opinitd init challenger --home="$OPINIT_HOME/challenger"

        echo "$CHALLENGER_MNEMONIC" | opinitd keys add "$L1_CHAIN_ID" challenger --home="$OPINIT_HOME/challenger" --recover

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
print("[entrypoint] challenger.json configured.")
PYEOF
    fi

    echo "[entrypoint] Starting opinit-executor..."
    opinitd start executor --home="$OPINIT_HOME/executor" &

    echo "[entrypoint] Starting opinit-challenger..."
    opinitd start challenger --home="$OPINIT_HOME/challenger" &
fi

echo "[entrypoint] All processes running. Monitoring minitiad (PID $MINITIAD_PID)..."
wait $MINITIAD_PID
