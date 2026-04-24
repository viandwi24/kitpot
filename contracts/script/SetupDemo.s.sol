// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/KitpotCircle.sol";
import "../src/interfaces/IKitpotReputation.sol";

/// @notice Seed the rollup with demo data so judges land on a non-empty UI.
/// Creates one public circle in "Forming" state where the judge can immediately
/// join as the 2nd member and experience the full deposit + auto-sign flow.
///
/// Usage:
///   export PRIVATE_KEY=<operator key>
///   export KITPOT_ADDRESS=0x...
///   export USDC_ADDRESS=0x...
///   forge script script/SetupDemo.s.sol --rpc-url <rpc> --broadcast --gas-limit 30000000
///
/// See plan 19 §4 Bucket F.
contract SetupDemoScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address usdcAddr = vm.envAddress("USDC_ADDRESS");
        address kitpotAddr = vm.envAddress("KITPOT_ADDRESS");

        MockUSDC usdc = MockUSDC(usdcAddr);
        KitpotCircle kitpot = KitpotCircle(kitpotAddr);

        vm.startBroadcast(deployerKey);

        address deployer = vm.addr(deployerKey);

        // 1. Mint 10,000 USDC to the deployer so it can seed circles.
        usdc.mint(deployer, 10_000 * 1e6);

        // 2. Approve KitpotCircle as a spender (creator pays collateral on create).
        usdc.approve(kitpotAddr, type(uint256).max);

        // 3. Create one public demo circle in "Forming" state.
        //    - 3 members so judges can fill the second slot quickly.
        //    - 120s cycle duration per plan 19 §9 decision #2 (gives judges
        //      time to see "waiting for cycle" state before tapping Distribute).
        //    - Public, no tier gate so any new wallet can join.
        uint256 circleId = kitpot.createCircle(
            "Arisan Demo Hackathon",
            "Demo circle for INITIATE judges. Join, deposit, toggle auto-sign.",
            usdcAddr,
            100 * 1e6,                              // 100 USDC per cycle
            3,                                      // 3 members total
            120,                                    // 120s cycle
            60,                                     // 60s grace period
            500,                                    // 5% late penalty
            true,                                   // public (discoverable)
            IKitpotReputation.TrustTier.Unranked,   // no tier gate
            "creator.init"                          // display username
        );

        vm.stopBroadcast();

        console.log("=== DEMO SETUP COMPLETE ===");
        console.log("Circle ID:", circleId);
        console.log("Status: Forming (1 of 3 members - judges can join slots 2 and 3)");
        console.log("");
        console.log("To test a completed flow, have a second wallet join + deposit,");
        console.log("or run the optional SetupDemoCompleted script after this one.");
    }
}
