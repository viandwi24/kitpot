// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/MockUSDe.sol";

/// @notice Single-purpose script to deploy MockUSDe alongside the existing contracts.
/// Does NOT touch MockUSDC or KitpotCircle. Run after the main Deploy.s.sol.
/// Usage: forge script script/DeployMockUSDe.s.sol --rpc-url $KITPOT_RPC_URL --broadcast
contract DeployMockUSDeScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        MockUSDe usde = new MockUSDe();

        vm.stopBroadcast();

        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("MockUSDe:", address(usde));
        console.log("");
        console.log("Add to .env / Vercel:");
        console.log("NEXT_PUBLIC_USDE_ADDRESS=", address(usde));
    }
}
