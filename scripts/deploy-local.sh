#!/bin/bash
set -e

PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC=http://localhost:8545
ENV_FILE="$(dirname "$0")/../apps/web/.env.local"

echo "Deploying contracts to local Anvil..."
OUTPUT=$(cd "$(dirname "$0")/../contracts" && PRIVATE_KEY=$PRIVATE_KEY forge script script/Deploy.s.sol --rpc-url $RPC --broadcast 2>&1)

echo "$OUTPUT" | grep -E "(MockUSDC|KitpotReputation|KitpotAchievements|KitpotCircle):"

USDC=$(echo "$OUTPUT" | grep "MockUSDC:" | awk '{print $2}')
REPUTATION=$(echo "$OUTPUT" | grep "KitpotReputation:" | awk '{print $2}')
ACHIEVEMENTS=$(echo "$OUTPUT" | grep "KitpotAchievements:" | awk '{print $2}')
CIRCLE=$(echo "$OUTPUT" | grep "KitpotCircle:" | awk '{print $2}')

if [ -z "$CIRCLE" ]; then
  echo "Deploy failed"
  exit 1
fi

sed -i '' "s|NEXT_PUBLIC_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_CONTRACT_ADDRESS=$CIRCLE|" "$ENV_FILE"
sed -i '' "s|NEXT_PUBLIC_USDC_ADDRESS=.*|NEXT_PUBLIC_USDC_ADDRESS=$USDC|" "$ENV_FILE"
sed -i '' "s|NEXT_PUBLIC_REPUTATION_ADDRESS=.*|NEXT_PUBLIC_REPUTATION_ADDRESS=$REPUTATION|" "$ENV_FILE"
sed -i '' "s|NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS=.*|NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS=$ACHIEVEMENTS|" "$ENV_FILE"

echo ""
echo ".env.local updated. Restart dev server to apply."
