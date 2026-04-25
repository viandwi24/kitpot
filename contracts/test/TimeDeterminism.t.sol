// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/KitpotCircle.sol";
import "../src/KitpotReputation.sol";
import "../src/KitpotAchievements.sol";
import "../src/MockUSDC.sol";
import "../src/interfaces/IKitpotReputation.sol";

contract TimeDeterminismTest is Test {
    KitpotCircle public kitpot;
    KitpotReputation public reputation;
    KitpotAchievements public achievements;
    MockUSDC public usdc;

    address public owner = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant CONTRIBUTION = 100e6;
    uint256 public constant CYCLE_DURATION = 120;
    uint256 public constant GRACE_PERIOD = 30;

    function setUp() public {
        vm.warp(10_000);
        usdc = new MockUSDC();
        reputation = new KitpotReputation();
        achievements = new KitpotAchievements(block.timestamp + 30 days);
        kitpot = new KitpotCircle(100, address(reputation));

        reputation.setAuthorized(address(kitpot), true);
        achievements.setAuthorized(address(kitpot), true);
        kitpot.setAchievements(address(achievements));

        address[3] memory accts = [owner, alice, bob];
        for (uint i = 0; i < accts.length; i++) {
            usdc.mint(accts[i], 100_000e6);
            vm.prank(accts[i]);
            usdc.approve(address(kitpot), type(uint256).max);
        }
    }

    /// @dev Late claim does not extend next cycle — deterministic start
    function test_lateClaim_deterministicNextCycle() public {
        uint256 id = _full();
        _depAll(id);

        uint256 start0 = kitpot.cycleStartTimes(id, 0);
        // Claim 30 seconds late
        vm.warp(start0 + CYCLE_DURATION + 30);
        kitpot.claimPot(id);

        uint256 start1 = kitpot.cycleStartTimes(id, 1);
        // Next cycle start should be deterministic: prev + duration, NOT block.timestamp
        assertEq(start1, start0 + CYCLE_DURATION);
    }

    /// @dev Very late claim hits the block.timestamp fallback
    function test_veryLateClaim_fallbackToNow() public {
        uint256 id = _full();
        _depAll(id);

        uint256 start0 = kitpot.cycleStartTimes(id, 0);
        // Claim so late that next cycle would already have lapsed (3x duration)
        uint256 warpTo = start0 + CYCLE_DURATION * 3;
        vm.warp(warpTo);
        kitpot.claimPot(id);

        uint256 start1 = kitpot.cycleStartTimes(id, 1);
        // Deterministic start would be start0 + CYCLE_DURATION, but that + CYCLE_DURATION
        // < block.timestamp, so fallback to block.timestamp
        assertEq(start1, warpTo);
    }

    /// @dev Normal claim: next cycle start == prev + duration
    function test_normalClaim_exactTiming() public {
        uint256 id = _full();
        _depAll(id);

        uint256 start0 = kitpot.cycleStartTimes(id, 0);
        // Claim exactly at cycle end
        vm.warp(start0 + CYCLE_DURATION);
        kitpot.claimPot(id);

        assertEq(kitpot.cycleStartTimes(id, 1), start0 + CYCLE_DURATION);
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
