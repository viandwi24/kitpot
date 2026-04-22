// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/KitpotCircle.sol";
import "../src/interfaces/IKitpotReputation.sol";

/// @notice Setup demo scenario: mint USDC, create circle, join members.
/// Usage: forge script script/SetupDemo.s.sol --rpc-url $KITPOT_RPC_URL --broadcast
contract SetupDemoScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address usdcAddr = vm.envAddress("USDC_ADDRESS");
        address kitpotAddr = vm.envAddress("KITPOT_ADDRESS");

        MockUSDC usdc = MockUSDC(usdcAddr);
        KitpotCircle kitpot = KitpotCircle(kitpotAddr);

        vm.startBroadcast(deployerKey);

        address deployer = vm.addr(deployerKey);

        // 1. Mint 10,000 USDC to deployer
        usdc.mint(deployer, 10_000 * 1e6);

        // 2. Approve KitpotCircle to spend deployer's USDC
        usdc.approve(kitpotAddr, type(uint256).max);

        // 3. Create demo circle: "Alumni Savings", 100 USDC, 3 members, 60s cycle
        uint256 circleId = kitpot.createCircle(
            "Alumni Savings",              // name
            "Monthly savings for demo",    // description
            usdcAddr,                      // token
            100 * 1e6,                     // 100 USDC contribution
            3,                             // 3 members
            60,                            // 60s cycle duration
            30,                            // 30s grace period
            500,                           // 5% late penalty
            true,                          // public
            IKitpotReputation.TrustTier.Unranked, // no tier gate
            "creator.init"                 // creator username
        );

        vm.stopBroadcast();

        console.log("=== DEMO SETUP COMPLETE ===");
        console.log("Circle ID:", circleId);
    }
}
