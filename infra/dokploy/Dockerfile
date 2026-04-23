FROM ubuntu:22.04

# ── Build args ────────────────────────────────────────────────────────────────
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

# ── Download minitiad ─────────────────────────────────────────────────────────
RUN set -eux; \
    ARCH=$([ "$TARGETARCH" = "arm64" ] && echo "aarch64" || echo "x86_64"); \
    wget -q "https://github.com/initia-labs/minievm/releases/download/${MINITIAD_VERSION}/minievm_${MINITIAD_VERSION}_Linux_${ARCH}.tar.gz" \
        -O /tmp/minitiad.tar.gz; \
    tar -xzf /tmp/minitiad.tar.gz -C /tmp; \
    mv /tmp/minitiad /usr/local/bin/minitiad; \
    chmod +x /usr/local/bin/minitiad; \
    rm /tmp/minitiad.tar.gz

# ── Download opinitd ──────────────────────────────────────────────────────────
RUN set -eux; \
    ARCH=$([ "$TARGETARCH" = "arm64" ] && echo "aarch64" || echo "x86_64"); \
    wget -q "https://github.com/initia-labs/opinit-bots/releases/download/${OPINITD_VERSION}/opinitd_${OPINITD_VERSION}_Linux_${ARCH}.tar.gz" \
        -O /tmp/opinitd.tar.gz; \
    tar -xzf /tmp/opinitd.tar.gz -C /tmp; \
    mv /tmp/opinitd /usr/local/bin/opinitd; \
    chmod +x /usr/local/bin/opinitd; \
    rm /tmp/opinitd.tar.gz

# ── Copy scripts (build context = repo root) ─────────────────────────────────
COPY infra/dokploy/entrypoint.sh /entrypoint.sh
COPY infra/dokploy/setup.sh /setup.sh
RUN chmod +x /entrypoint.sh /setup.sh

# ── Runtime env defaults ──────────────────────────────────────────────────────
ENV MINITIA_HOME=/data/.minitia
ENV OPINIT_HOME=/data/.opinit
ENV L1_CHAIN_ID=initiation-2
ENV L1_RPC_URL=https://rpc.testnet.initia.xyz:443
ENV L1_GAS_PRICE=0.015uinit
ENV L2_CHAIN_ID=kitpot-2
ENV RUN_OPINIT=false
ENV AUTO_DEPLOY=false

# ── Ports ─────────────────────────────────────────────────────────────────────
EXPOSE 8545 8546 26657 1317

VOLUME ["/data"]

ENTRYPOINT ["/entrypoint.sh"]
