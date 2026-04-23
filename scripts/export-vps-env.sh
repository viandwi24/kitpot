#!/usr/bin/env bash
# Export all env vars needed to run kitpot node on VPS.
# Run this on your Mac, copy the output to Dokploy env vars.
set -e

MINITIA_CONFIG="${MINITIA_HOME:-$HOME/.minitia}/config"
WEAVE_MINITIA="$HOME/.weave/data/minitia.config.json"
WEAVE_CONFIG="$HOME/.weave/config.json"

# ── Validate files exist ──────────────────────────────────────────────────────
for f in "$MINITIA_CONFIG/genesis.json" "$MINITIA_CONFIG/priv_validator_key.json" "$MINITIA_CONFIG/node_key.json"; do
    if [ ! -f "$f" ]; then
        echo "ERROR: $f not found. Run 'weave init' first." >&2
        exit 1
    fi
done
if [ ! -f "$WEAVE_MINITIA" ]; then
    echo "ERROR: $WEAVE_MINITIA not found." >&2
    exit 1
fi

# ── Read chain config ─────────────────────────────────────────────────────────
L2_CHAIN_ID=$(python3 -c "import json; print(json.load(open('$WEAVE_MINITIA'))['l2_config']['chain_id'])")
L1_CHAIN_ID=$(python3 -c "import json; print(json.load(open('$WEAVE_MINITIA'))['l1_config']['chain_id'])")
L1_RPC_URL=$(python3 -c "import json; print(json.load(open('$WEAVE_MINITIA'))['l1_config']['rpc_url'])")
L1_GAS_PRICE=$(python3 -c "import json; print(json.load(open('$WEAVE_MINITIA'))['l1_config']['gas_prices'])")

# ── Read mnemonics ────────────────────────────────────────────────────────────
BRIDGE_EXECUTOR_MNEMONIC=$(python3 -c "import json; print(json.load(open('$WEAVE_MINITIA'))['system_keys']['bridge_executor']['mnemonic'])")
OUTPUT_SUBMITTER_MNEMONIC=$(python3 -c "import json; print(json.load(open('$WEAVE_MINITIA'))['system_keys']['output_submitter']['mnemonic'])")
BATCH_SUBMITTER_MNEMONIC=$(python3 -c "import json; print(json.load(open('$WEAVE_MINITIA'))['system_keys']['batch_submitter']['mnemonic'])")
CHALLENGER_MNEMONIC=$(python3 -c "import json; print(json.load(open('$WEAVE_MINITIA'))['system_keys']['challenger']['mnemonic'])")

# Gas station (deployer key)
GAS_STATION_MNEMONIC=$(python3 -c "import json; print(json.load(open('$WEAVE_CONFIG'))['common']['gas_station']['mnemonic'])")

# ── Encode chain files ────────────────────────────────────────────────────────
GENESIS_B64=$(base64 -i "$MINITIA_CONFIG/genesis.json" | tr -d '\n')
VALIDATOR_KEY_B64=$(base64 -i "$MINITIA_CONFIG/priv_validator_key.json" | tr -d '\n')
NODE_KEY_B64=$(base64 -i "$MINITIA_CONFIG/node_key.json" | tr -d '\n')

# ── Output ────────────────────────────────────────────────────────────────────
cat <<EOF
# ═══════════════════════════════════════════════════════════
# Kitpot VPS Environment Variables
# Copy-paste these into Dokploy → Environment Variables
# Generated: $(date)
# Chain: $L2_CHAIN_ID
# ═══════════════════════════════════════════════════════════

MINITIA_HOME=/data/.minitia
OPINIT_HOME=/data/.opinit
L1_CHAIN_ID=$L1_CHAIN_ID
L1_RPC_URL=$L1_RPC_URL
L1_GAS_PRICE=$L1_GAS_PRICE
L2_CHAIN_ID=$L2_CHAIN_ID
RUN_OPINIT=true
AUTO_DEPLOY=false

BRIDGE_EXECUTOR_MNEMONIC=$BRIDGE_EXECUTOR_MNEMONIC
OUTPUT_SUBMITTER_MNEMONIC=$OUTPUT_SUBMITTER_MNEMONIC
BATCH_SUBMITTER_MNEMONIC=$BATCH_SUBMITTER_MNEMONIC
CHALLENGER_MNEMONIC=$CHALLENGER_MNEMONIC

GENESIS_B64=$GENESIS_B64
VALIDATOR_KEY_B64=$VALIDATOR_KEY_B64
NODE_KEY_B64=$NODE_KEY_B64

# ── Deploy contracts dari local (jalankan ini di Mac setelah node VPS up) ────
# DEPLOYER_MNEMONIC: $GAS_STATION_MNEMONIC
#
# forge script contracts/script/Deploy.s.sol \\
#   --rpc-url https://<rpc-domain> \\
#   --private-key \$(cast wallet private-key "$GAS_STATION_MNEMONIC" "m/44'/60'/0'/0/0") \\
#   --broadcast
EOF
