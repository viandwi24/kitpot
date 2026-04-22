// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/KitpotCircle.sol";
import "../src/KitpotReputation.sol";
import "../src/KitpotAchievements.sol";

/// @notice Deploy full Kitpot protocol: MockUSDC + Reputation + Achievements + Circle
/// Usage: forge script script/Deploy.s.sol --rpc-url $KITPOT_RPC_URL --broadcast
contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        // 1. Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC:", address(usdc));

        // 2. Deploy KitpotReputation
        KitpotReputation reputation = new KitpotReputation();
        console.log("KitpotReputation:", address(reputation));

        // 3. Deploy KitpotAchievements (early adopter deadline: 30 days from now)
        KitpotAchievements achievements = new KitpotAchievements(block.timestamp + 30 days);
        console.log("KitpotAchievements:", address(achievements));

        // 4. Deploy KitpotCircle (1% fee, link reputation)
        KitpotCircle kitpot = new KitpotCircle(100, address(reputation));
        console.log("KitpotCircle:", address(kitpot));

        // 5. Authorize KitpotCircle to write to Reputation and Achievements
        reputation.setAuthorized(address(kitpot), true);
        achievements.setAuthorized(address(kitpot), true);

        // 6. Set achievements address on circle contract
        kitpot.setAchievements(address(achievements));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Add these to .env:");
        console.log("NEXT_PUBLIC_CONTRACT_ADDRESS=", address(kitpot));
        console.log("NEXT_PUBLIC_USDC_ADDRESS=", address(usdc));
        console.log("NEXT_PUBLIC_REPUTATION_ADDRESS=", address(reputation));
        console.log("NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS=", address(achievements));
    }
}
