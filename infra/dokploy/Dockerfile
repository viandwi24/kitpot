FROM ubuntu:22.04

# ── Build args (override via --build-arg) ────────────────────────────────────
ARG MINITIAD_VERSION=v1.2.15
ARG OPINITD_VERSION=v1.0.20
ARG TARGETARCH=amd64

# ── System deps ───────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    tar \
    jq \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# ── Download minitiad (kitpot-2 rollup node) ──────────────────────────────────
RUN set -eux; \
    ARCH=$([ "$TARGETARCH" = "arm64" ] && echo "aarch64" || echo "x86_64"); \
    wget -q "https://github.com/initia-labs/minievm/releases/download/${MINITIAD_VERSION}/minievm_${MINITIAD_VERSION}_Linux_${ARCH}.tar.gz" \
        -O /tmp/minitiad.tar.gz; \
    tar -xzf /tmp/minitiad.tar.gz -C /tmp; \
    mv /tmp/minitiad /usr/local/bin/minitiad; \
    chmod +x /usr/local/bin/minitiad; \
    rm /tmp/minitiad.tar.gz

# ── Download opinitd (executor + challenger bots) ─────────────────────────────
RUN set -eux; \
    ARCH=$([ "$TARGETARCH" = "arm64" ] && echo "aarch64" || echo "x86_64"); \
    wget -q "https://github.com/initia-labs/opinit-bots/releases/download/${OPINITD_VERSION}/opinitd_${OPINITD_VERSION}_Linux_${ARCH}.tar.gz" \
        -O /tmp/opinitd.tar.gz; \
    tar -xzf /tmp/opinitd.tar.gz -C /tmp; \
    mv /tmp/opinitd /usr/local/bin/opinitd; \
    chmod +x /usr/local/bin/opinitd; \
    rm /tmp/opinitd.tar.gz

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# ── Runtime env defaults ──────────────────────────────────────────────────────
# Chain home (mount your .minitia directory here as a volume)
ENV MINITIA_HOME=/data/.minitia
# OPinit home (auto-initialized on first run when RUN_OPINIT=true)
ENV OPINIT_HOME=/data/.opinit

# L1 (Initia testnet)
ENV L1_CHAIN_ID=initiation-2
ENV L1_RPC_URL=https://rpc.testnet.initia.xyz:443
ENV L1_GAS_PRICE=0.015uinit

# L2 (kitpot-2 rollup)
ENV L2_CHAIN_ID=kitpot-2

# Set to "true" to also run executor + challenger alongside the node
ENV RUN_OPINIT=false

# ── Key mnemonics — REQUIRED when RUN_OPINIT=true, pass via runtime env ───────
# ENV BRIDGE_EXECUTOR_MNEMONIC=
# ENV OUTPUT_SUBMITTER_MNEMONIC=
# ENV BATCH_SUBMITTER_MNEMONIC=
# ENV CHALLENGER_MNEMONIC=

# ── Ports ─────────────────────────────────────────────────────────────────────
# 8545  → EVM JSON-RPC  (proxy THIS one for your domain)
# 8546  → EVM WebSocket
# 26657 → Tendermint RPC
# 1317  → Cosmos REST API
EXPOSE 8545 8546 26657 1317

VOLUME ["/data"]

ENTRYPOINT ["/entrypoint.sh"]
