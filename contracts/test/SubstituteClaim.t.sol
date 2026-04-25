// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/KitpotCircle.sol";
import "../src/KitpotReputation.sol";
import "../src/KitpotAchievements.sol";
import "../src/MockUSDC.sol";
import "../src/interfaces/IKitpotReputation.sol";

contract SubstituteClaimTest is Test {
    KitpotCircle public kitpot;
    KitpotReputation public reputation;
    KitpotAchievements public achievements;
    MockUSDC public usdc;

    address public owner = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public keeper = makeAddr("keeper");

    uint256 public constant CONTRIBUTION = 100e6;
    uint256 public constant CYCLE_DURATION = 120;
    uint256 public constant GRACE_PERIOD = 30;

    function setUp() public {
        vm.warp(10_000);
        usdc = new MockUSDC();
        reputation = new KitpotReputation();
        achievements = new KitpotAchievements(block.timestamp + 30 days);
        kitpot = new KitpotCircle(100, address(reputation)); // 1% fee

        reputation.setAuthorized(address(kitpot), true);
        achievements.setAuthorized(address(kitpot), true);
        kitpot.setAchievements(address(achievements));

        address[4] memory accts = [owner, alice, bob, keeper];
        for (uint i = 0; i < accts.length; i++) {
            usdc.mint(accts[i], 100_000e6);
            vm.prank(accts[i]);
            usdc.approve(address(kitpot), type(uint256).max);
        }
    }

    function test_substituteClaim_dormant() public {
        uint256 id = _full();
        _depAll(id);

        uint256 cycleStart = kitpot.cycleStartTimes(id, 0);
        // Warp past cycle end + dormant grace
        vm.warp(cycleStart + CYCLE_DURATION + kitpot.DORMANT_GRACE() + 1);

        uint256 recipientBalBefore = usdc.balanceOf(owner);
        uint256 keeperBalBefore = usdc.balanceOf(keeper);

        // keeper (not a member, not recipient) calls substituteClaim
        vm.prank(keeper);
        kitpot.substituteClaim(id);

        uint256 totalPot = CONTRIBUTION * 3;
        uint256 platformFee = totalPot / 100; // 1%
        uint256 keeperReward = (totalPot * 10) / 10000; // 0.1%
        uint256 payout = totalPot - platformFee - keeperReward;

        // Pot goes to owner (recipient), keeper reward goes to keeper
        assertEq(usdc.balanceOf(owner) - recipientBalBefore, payout);
        assertEq(usdc.balanceOf(keeper) - keeperBalBefore, keeperReward);
        assertEq(kitpot.getCircle(id).currentCycle, 1);
    }

    function test_substituteClaim_revert_tooEarly() public {
        uint256 id = _full();
        _depAll(id);

        uint256 cycleStart = kitpot.cycleStartTimes(id, 0);
        // Warp past cycle end but NOT past dormant grace
        vm.warp(cycleStart + CYCLE_DURATION + 1);

        vm.expectRevert("Wait for dormant grace");
        vm.prank(keeper);
        kitpot.substituteClaim(id);
    }

    function test_substituteClaim_memberCanAlsoCall() public {
        uint256 id = _full();
        _depAll(id);

        uint256 cycleStart = kitpot.cycleStartTimes(id, 0);
        vm.warp(cycleStart + CYCLE_DURATION + kitpot.DORMANT_GRACE() + 1);

        // bob (a member but not recipient) can call substituteClaim
        uint256 bobBalBefore = usdc.balanceOf(bob);
        vm.prank(bob);
        kitpot.substituteClaim(id);

        uint256 totalPot = CONTRIBUTION * 3;
        uint256 keeperReward = (totalPot * 10) / 10000;
        assertEq(usdc.balanceOf(bob) - bobBalBefore, keeperReward);
    }

    // ── HELPERS ──

    function _full() internal returns (uint256) {
        uint256 id = kitpot.createCircle("Test","",address(usdc),CONTRIBUTION,3,CYCLE_DURATION,GRACE_PERIOD,500,false,IKitpotReputation.TrustTier.Unranked,"owner.init");
        vm.prank(alice); kitpot.joinCircle(id, "alice.init");
        vm.prank(bob); kitpot.joinCircle(id, "bob.init");
        return id;
    }

    function _depAll(uint256 id) internal {
        kitpot.deposit(id);
        vm.prank(alice); kitpot.deposit(id);
        vm.prank(bob); kitpot.deposit(id);
    }
}
