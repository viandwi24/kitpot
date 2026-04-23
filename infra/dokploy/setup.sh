#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Kitpot Node Setup Script
# Run inside container: docker exec -it <container> /setup.sh [mode]
#
# Modes:
#   /setup.sh restore   — restore existing kitpot-2 from env vars (GENESIS_B64, etc.)
#   /setup.sh init      — initialize a fresh chain, ready for contract deployment
# ─────────────────────────────────────────────────────────────────────────────
set -e

MINITIA_HOME="${MINITIA_HOME:-/data/.minitia}"
MODE="${1:-}"

# ── Guard: already configured ────────────────────────────────────────────────
if [ -f "$MINITIA_HOME/config/genesis.json" ]; then
    echo "[setup] Chain already configured at $MINITIA_HOME"
    echo "[setup] Delete $MINITIA_HOME to reinitialize."
    exit 0
fi

mkdir -p "$MINITIA_HOME/config" "$MINITIA_HOME/data"

# ── Mode selection ────────────────────────────────────────────────────────────
if [ -z "$MODE" ]; then
    echo ""
    echo "Usage: /setup.sh <mode>"
    echo ""
    echo "  restore   Restore existing kitpot-2 from env vars"
    echo "            Required env vars:"
    echo "              GENESIS_B64         — genesis.json (base64)"
    echo "              VALIDATOR_KEY_B64   — priv_validator_key.json (base64)"
    echo "              NODE_KEY_B64        — node_key.json (base64)"
    echo ""
    echo "  init      Initialize a fresh chain (fully configured, contract-deployable)"
    echo "            Required env vars:"
    echo "              CHAIN_ID            — e.g. kitpot-2"
    echo "              MONIKER             — node name, e.g. kitpot-node"
    echo "            Optional:"
    echo "              DEPLOYER_ADDRESS    — EVM hex address to prefund (e.g. 0xf39F...)"
    echo ""
    echo "How to get base64 values from your Mac:"
    echo "  base64 -i ~/.minitia/config/genesis.json"
    echo "  base64 -i ~/.minitia/config/priv_validator_key.json"
    echo "  base64 -i ~/.minitia/config/node_key.json"
    echo ""
    exit 1
fi

# ── Mode: restore ─────────────────────────────────────────────────────────────
if [ "$MODE" = "restore" ]; then
    echo "[setup] Restoring kitpot-2 chain from env vars..."

    if [ -z "$GENESIS_B64" ] || [ -z "$VALIDATOR_KEY_B64" ] || [ -z "$NODE_KEY_B64" ]; then
        echo "[setup] Error: GENESIS_B64, VALIDATOR_KEY_B64, and NODE_KEY_B64 must be set."
        exit 1
    fi

    echo "$GENESIS_B64"       | base64 -d > "$MINITIA_HOME/config/genesis.json"
    echo "$VALIDATOR_KEY_B64" | base64 -d > "$MINITIA_HOME/config/priv_validator_key.json"
    echo "$NODE_KEY_B64"      | base64 -d > "$MINITIA_HOME/config/node_key.json"

    # Generate default app.toml and config.toml if missing
    if [ ! -f "$MINITIA_HOME/config/app.toml" ]; then
        minitiad init temp --chain-id placeholder --home /tmp/minitia-tmp > /dev/null 2>&1 || true
        cp /tmp/minitia-tmp/config/app.toml "$MINITIA_HOME/config/app.toml" 2>/dev/null || true
        cp /tmp/minitia-tmp/config/config.toml "$MINITIA_HOME/config/config.toml" 2>/dev/null || true
        rm -rf /tmp/minitia-tmp
    fi

    echo "[setup] Chain restored successfully."
    echo "[setup] Node will start automatically in a few seconds."
    exit 0
fi

# ── Mode: init ────────────────────────────────────────────────────────────────
if [ "$MODE" = "init" ]; then
    if [ -z "$CHAIN_ID" ] || [ -z "$MONIKER" ]; then
        echo "[setup] Error: CHAIN_ID and MONIKER must be set."
        echo "[setup] Example: CHAIN_ID=kitpot-3 MONIKER=my-node /setup.sh init"
        exit 1
    fi

    echo "[setup] Initializing fresh chain: $CHAIN_ID ($MONIKER)..."
    minitiad init "$MONIKER" --chain-id "$CHAIN_ID" --home "$MINITIA_HOME"

    # ── Generate operator key (validator + admin) ─────────────────────────────
    echo "[setup] Generating operator key..."
    minitiad keys add operator \
        --home "$MINITIA_HOME" \
        --keyring-backend test \
        --output json > /tmp/operator_key.json 2>&1
    OPERATOR_ADDR=$(python3 -c "import json; print(json.load(open('/tmp/operator_key.json'))['address'])")
    OPERATOR_MNEMONIC=$(python3 -c "import json; print(json.load(open('/tmp/operator_key.json'))['mnemonic'])")
    # validator operator_address uses initvaloper prefix, not init
    VALOPER_ADDR=$(minitiad keys show operator --bech val -a \
        --home "$MINITIA_HOME" --keyring-backend test 2>/dev/null)
    echo "[setup] Operator address: $OPERATOR_ADDR"
    echo "[setup] Valoper address:  $VALOPER_ADDR"

    # ── Patch genesis ─────────────────────────────────────────────────────────
    # minitiad init leaves several fields empty that cause InitGenesis panics:
    #   - opchild.params.admin = ""              → panic: empty address
    #   - opchild.params.bridge_executors = [""] → panic: empty address
    #   - opchild.validators = []                → CometBFT: validator set is empty
    #
    # Fix: set admin, clear empty bridge_executors, add genesis validator using
    # the consensus pubkey from priv_validator_key.json.
    # DefaultPowerReduction for minitia = 274887383584 (from error message).
    python3 - <<PYEOF
import json

genesis_path = "$MINITIA_HOME/config/genesis.json"
priv_key_path = "$MINITIA_HOME/config/priv_validator_key.json"
operator_addr = "$OPERATOR_ADDR"
moniker       = "$MONIKER"

with open(genesis_path) as f:
    g = json.load(f)
with open(priv_key_path) as f:
    priv_key = json.load(f)

cons_pub_key = priv_key["pub_key"]["value"]
valoper_addr = "$VALOPER_ADDR"

# 1. Clear empty bridge_executors
g["app_state"]["opchild"]["params"]["bridge_executors"] = [
    x for x in g["app_state"]["opchild"]["params"]["bridge_executors"] if x
]

# 2. Set admin (uses init prefix)
g["app_state"]["opchild"]["params"]["admin"] = operator_addr

# 3. Add genesis validator
# From OPinit v1.2.4 proto/opinit/opchild/v1/types.proto:
#   Validator { moniker, operator_address(initvaloper), consensus_pubkey, cons_power }
g["app_state"]["opchild"]["validators"] = [{
    "moniker": moniker,
    "operator_address": valoper_addr,
    "consensus_pubkey": {
        "@type": "/cosmos.crypto.ed25519.PubKey",
        "key": cons_pub_key
    },
    "cons_power": "1"
}]
g["app_state"]["opchild"]["last_validator_powers"] = [
    {"address": valoper_addr, "power": "1"}
]

with open(genesis_path, "w") as f:
    json.dump(g, f, indent=2)

print("[setup] Genesis patched:")
print(f"  - opchild admin: {operator_addr}")
print(f"  - bridge_executors: cleared")
print(f"  - validator added: {valoper_addr} (power=1)")
PYEOF

    # ── Prefund deployer account via genesis ──────────────────────────────────
    # Add the operator itself with GAS tokens so it can pay fees
    minitiad genesis add-genesis-account "$OPERATOR_ADDR" 1000000000000GAS \
        --home "$MINITIA_HOME" --keyring-backend test 2>/dev/null || true

    # If DEPLOYER_ADDRESS is set (EVM hex), convert and prefund it too
    if [ -n "${DEPLOYER_ADDRESS:-}" ]; then
        echo "[setup] Prefunding deployer: $DEPLOYER_ADDRESS"
        # Convert hex EVM address to bech32 init prefix
        DEPLOYER_BECH32=$(python3 -c "
import binascii
hex_addr = '$DEPLOYER_ADDRESS'.replace('0x','').replace('0X','')
addr_bytes = bytes.fromhex(hex_addr)
import sys
# bech32 encode
charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
def bech32_polymod(values):
    GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
    chk = 1
    for v in values:
        b = (chk >> 25)
        chk = (chk & 0x1ffffff) << 5 ^ v
        for i in range(5):
            chk ^= GEN[i] if ((b >> i) & 1) else 0
    return chk
def bech32_hrp_expand(hrp):
    return [ord(x) >> 5 for x in hrp] + [0] + [ord(x) & 31 for x in hrp]
def convertbits(data, frombits, tobits, pad=True):
    acc = 0; bits = 0; ret = []; maxv = (1 << tobits) - 1
    for value in data:
        acc = ((acc << frombits) | value) & 0xffffffff
        bits += frombits
        while bits >= tobits:
            bits -= tobits
            ret.append((acc >> bits) & maxv)
    if pad:
        if bits: ret.append((acc << (tobits - bits)) & maxv)
    elif bits >= frombits or ((acc << (tobits - bits)) & maxv):
        return None
    return ret
hrp = 'init'
data = convertbits(addr_bytes, 8, 5)
combined = data + [0,0,0,0,0,0]
polymod = bech32_polymod(bech32_hrp_expand(hrp) + combined) ^ 1
checksum = [(polymod >> 5 * (5 - i)) & 31 for i in range(6)]
print(hrp + '1' + ''.join([charset[d] for d in data + checksum]))
" 2>/dev/null || echo "")
        if [ -n "$DEPLOYER_BECH32" ]; then
            minitiad genesis add-genesis-account "$DEPLOYER_BECH32" 1000000000000GAS \
                --home "$MINITIA_HOME" --keyring-backend test 2>/dev/null || true
            echo "[setup] Prefunded deployer bech32: $DEPLOYER_BECH32"
        fi
    fi

    # ── Derive EVM private key for forge deployment ───────────────────────────
    # minitiad uses ethsecp256k1 with HD path m/44'/60'/0'/0/0 — same as Ethereum.
    # We derive the private key from the mnemonic via cast to guarantee the
    # resulting EVM address matches the genesis-funded operator address.
    echo "[setup] Deriving EVM private key for contract deployment..."
    OPERATOR_PRIVATE_KEY_HEX=$(cast wallet private-key \
        "$OPERATOR_MNEMONIC" \
        "m/44'/60'/0'/0/0" 2>/dev/null \
        | tr -d '[:space:]' | sed 's/^0x//' || echo "")

    if [ -n "$OPERATOR_PRIVATE_KEY_HEX" ]; then
        echo "$OPERATOR_PRIVATE_KEY_HEX" > /data/operator_private_key.hex
        DERIVED_EVM=$(cast wallet address "0x$OPERATOR_PRIVATE_KEY_HEX" 2>/dev/null || echo "")
        echo "[setup] EVM deployer address: $DERIVED_EVM"
        echo "[setup] Operator address:     $OPERATOR_ADDR"
    else
        echo "[setup] Warning: cast not available — contract deployment may fail"
    fi

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           FRESH CHAIN INITIALIZED                           ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  Chain ID : $CHAIN_ID"
    echo "║  Operator : $OPERATOR_ADDR"
    echo "║  Mnemonic : (see below — save this!)"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "OPERATOR MNEMONIC (save this to recover the key):"
    echo "$OPERATOR_MNEMONIC"
    echo ""
    echo "[setup] Node will start automatically in a few seconds."
    exit 0
fi

echo "[setup] Unknown mode: $MODE. Use 'restore' or 'init'."
exit 1
