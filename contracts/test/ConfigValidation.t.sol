// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/KitpotCircle.sol";
import "../src/KitpotReputation.sol";
import "../src/MockUSDC.sol";
import "../src/interfaces/IKitpotReputation.sol";

contract ConfigValidationTest is Test {
    KitpotCircle public kitpot;
    KitpotReputation public reputation;
    MockUSDC public usdc;

    function setUp() public {
        usdc = new MockUSDC();
        reputation = new KitpotReputation();
        kitpot = new KitpotCircle(100, address(reputation));

        usdc.mint(address(this), 100_000e6);
        usdc.approve(address(kitpot), type(uint256).max);
    }

    function test_revert_cycleTooShort() public {
        vm.expectRevert("Cycle too short (min 60s)");
        kitpot.createCircle("X","",address(usdc),100e6,3,0,1,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_cycleTooShort_59s() public {
        vm.expectRevert("Cycle too short (min 60s)");
        kitpot.createCircle("X","",address(usdc),100e6,3,59,1,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_cycleTooLong() public {
        vm.expectRevert("Cycle too long");
        kitpot.createCircle("X","",address(usdc),100e6,3,366 days,1,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_graceZero() public {
        vm.expectRevert("Grace must be > 0");
        kitpot.createCircle("X","",address(usdc),100e6,3,120,0,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_graceEqualsCycle() public {
        vm.expectRevert("Grace must be < cycle");
        kitpot.createCircle("X","",address(usdc),100e6,3,120,120,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_graceExceedsCycle() public {
        vm.expectRevert("Grace must be < cycle");
        kitpot.createCircle("X","",address(usdc),100e6,3,120,200,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_membersTooFew() public {
        vm.expectRevert("Members 3-20");
        kitpot.createCircle("X","",address(usdc),100e6,2,120,30,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_membersTooMany() public {
        vm.expectRevert("Members 3-20");
        kitpot.createCircle("X","",address(usdc),100e6,21,120,30,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_emptyName() public {
        vm.expectRevert("Bad name length");
        kitpot.createCircle("","",address(usdc),100e6,3,120,30,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_nameTooLong() public {
        // 65-char name
        string memory longName = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        vm.expectRevert("Bad name length");
        kitpot.createCircle(longName,"",address(usdc),100e6,3,120,30,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_emptyUsername() public {
        vm.expectRevert("Username required");
        kitpot.createCircle("X","",address(usdc),100e6,3,120,30,500,false,IKitpotReputation.TrustTier.Unranked,"");
    }

    function test_revert_penaltyTooHigh() public {
        vm.expectRevert("Penalty too high");
        kitpot.createCircle("X","",address(usdc),100e6,3,120,30,1001,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    function test_revert_contributionZero() public {
        vm.expectRevert("Contribution > 0");
        kitpot.createCircle("X","",address(usdc),0,3,120,30,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    /// @dev Exact boundary: 60s cycle should succeed
    function test_pass_minCycle() public {
        kitpot.createCircle("X","",address(usdc),100e6,3,60,1,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }

    /// @dev Grace = cycle-1 should succeed
    function test_pass_graceMaxValid() public {
        kitpot.createCircle("X","",address(usdc),100e6,3,120,119,500,false,IKitpotReputation.TrustTier.Unranked,"u");
    }
}
