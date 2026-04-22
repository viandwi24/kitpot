// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/KitpotReputation.sol";
import "../src/interfaces/IKitpotReputation.sol";

contract KitpotReputationTest is Test {
    KitpotReputation public rep;

    address public caller = makeAddr("caller");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    uint256 constant DAY = 86400;
    uint256 constant BASE_TIME = 1_700_000_000; // realistic timestamp

    function setUp() public {
        vm.warp(BASE_TIME); // start at a realistic time so daily quest logic works
        rep = new KitpotReputation();
        rep.setAuthorized(caller, true);
    }

    // ── XP ACCRUAL ──

    function test_xp_onTimePayment() public {
        vm.prank(caller); rep.recordPayment(alice, 0, 0, true);
        assertEq(rep.getReputation(alice).xp, 10);
    }

    function test_xp_latePayment() public {
        vm.prank(caller); rep.recordPayment(alice, 0, 0, false);
        assertEq(rep.getReputation(alice).xp, 3);
    }

    function test_xp_circleJoined() public {
        vm.prank(caller); rep.recordCircleJoined(alice, 0);
        assertEq(rep.getReputation(alice).xp, 20);
    }

    function test_xp_potReceived() public {
        vm.prank(caller); rep.recordPotReceived(alice, 1000e6);
        assertEq(rep.getReputation(alice).xp, 100);
    }

    function test_xp_circleCompleted_perfect() public {
        vm.prank(caller); rep.recordCircleCompleted(alice, 0);
        assertEq(rep.getReputation(alice).xp, 200);
    }

    function test_xp_circleCompleted_withMiss() public {
        vm.startPrank(caller);
        rep.recordMissedPayment(alice, 0, 0);
        rep.recordCircleCompleted(alice, 0);
        vm.stopPrank();
        assertEq(rep.getReputation(alice).xp, 100);
    }

    function test_xp_circleCompleted_idempotent() public {
        vm.startPrank(caller);
        rep.recordCircleCompleted(alice, 0);
        rep.recordCircleCompleted(alice, 0); // no-op
        vm.stopPrank();
        assertEq(rep.getReputation(alice).xp, 200);
    }

    // ── LEVELS ──

    function test_level_novice_default() public view {
        assertEq(uint8(rep.getLevel(alice)), uint8(IKitpotReputation.Level.Novice));
    }

    function test_level_apprentice_at_100xp() public {
        vm.startPrank(caller);
        for (uint256 i = 0; i < 10; i++) rep.recordPayment(alice, 0, i, true);
        vm.stopPrank();
        assertEq(rep.getReputation(alice).xp, 100);
        assertEq(uint8(rep.getLevel(alice)), uint8(IKitpotReputation.Level.Apprentice));
    }

    function test_level_saver_at_500xp() public {
        vm.startPrank(caller);
        rep.recordCircleJoined(alice, 0);       // +20
        rep.recordCircleCompleted(alice, 1);    // +200
        for (uint256 i = 0; i < 28; i++) rep.recordPayment(alice, 2, i, true); // +280
        vm.stopPrank();
        assertEq(rep.getReputation(alice).xp, 500);
        assertEq(uint8(rep.getLevel(alice)), uint8(IKitpotReputation.Level.Saver));
    }

    function test_xpForNextLevel() public {
        vm.prank(caller); rep.recordCircleJoined(alice, 0); // 20 XP
        (uint256 needed, uint256 total) = rep.xpForNextLevel(alice);
        assertEq(total, 100);
        assertEq(needed, 80);
    }

    function test_xpForNextLevel_legendary() public {
        vm.startPrank(caller);
        for (uint256 i = 0; i < 50; i++) rep.recordCircleCompleted(alice, i);
        vm.stopPrank();
        assertEq(uint8(rep.getLevel(alice)), uint8(IKitpotReputation.Level.Legendary));
        (uint256 needed,) = rep.xpForNextLevel(alice);
        assertEq(needed, 0);
    }

    function test_levelUp_event_emitted() public {
        vm.startPrank(caller);
        for (uint256 i = 0; i < 9; i++) rep.recordPayment(alice, 0, i, true);
        vm.expectEmit(true, false, false, true);
        emit KitpotReputation.LevelUp(alice, IKitpotReputation.Level.Novice, IKitpotReputation.Level.Apprentice);
        rep.recordPayment(alice, 0, 9, true);
        vm.stopPrank();
    }

    // ── TRUST TIERS ──

    function test_tier_unranked_default() public view {
        assertEq(uint8(rep.getTier(alice)), uint8(IKitpotReputation.TrustTier.Unranked));
    }

    function test_tier_bronze_after_completion() public {
        vm.startPrank(caller);
        for (uint256 i = 0; i < 3; i++) rep.recordPayment(alice, 0, i, true); // 70%+ on-time
        rep.recordCircleCompleted(alice, 0); // 1 circle
        vm.stopPrank();
        assertEq(uint8(rep.getTier(alice)), uint8(IKitpotReputation.TrustTier.Bronze));
    }

    function test_tier_meetsMinimum() public {
        vm.startPrank(caller);
        for (uint256 i = 0; i < 3; i++) rep.recordPayment(alice, 0, i, true);
        rep.recordCircleCompleted(alice, 0);
        vm.stopPrank();
        assertTrue(rep.meetsMinimumTier(alice, IKitpotReputation.TrustTier.Bronze));
        assertFalse(rep.meetsMinimumTier(alice, IKitpotReputation.TrustTier.Silver));
    }

    // ── STREAK ──

    function test_streak_increments() public {
        vm.startPrank(caller);
        rep.recordPayment(alice, 0, 0, true);
        rep.recordPayment(alice, 0, 1, true);
        rep.recordPayment(alice, 0, 2, true);
        vm.stopPrank();
        assertEq(rep.getReputation(alice).consecutiveOnTime, 3);
        assertEq(rep.getReputation(alice).longestStreak, 3);
    }

    function test_streak_resets_on_late() public {
        vm.startPrank(caller);
        rep.recordPayment(alice, 0, 0, true);
        rep.recordPayment(alice, 0, 1, true);
        rep.recordPayment(alice, 0, 2, false); // late
        vm.stopPrank();
        assertEq(rep.getReputation(alice).consecutiveOnTime, 0);
        assertEq(rep.getReputation(alice).longestStreak, 2); // preserved
    }

    function test_streak_resets_on_miss() public {
        vm.startPrank(caller);
        rep.recordPayment(alice, 0, 0, true);
        rep.recordMissedPayment(alice, 0, 1);
        vm.stopPrank();
        assertEq(rep.getReputation(alice).consecutiveOnTime, 0);
    }

    // ── DAILY QUEST ──

    function test_dailyQuest_awards25xp() public {
        vm.prank(alice);
        uint256 xp = rep.claimDailyQuest();
        assertEq(xp, 25);
        assertEq(rep.getReputation(alice).xp, 25);
        assertEq(rep.getReputation(alice).questStreakDays, 1);
    }

    function test_dailyQuest_revert_claimTwiceSameDay() public {
        vm.startPrank(alice);
        rep.claimDailyQuest();
        vm.expectRevert("Already claimed today");
        rep.claimDailyQuest();
        vm.stopPrank();
    }

    function test_dailyQuest_streakIncrements_nextDay() public {
        vm.prank(alice);
        rep.claimDailyQuest();

        vm.warp(block.timestamp + DAY);
        vm.prank(alice);
        rep.claimDailyQuest();

        assertEq(rep.getReputation(alice).questStreakDays, 2);
        assertEq(rep.getReputation(alice).xp, 50);
    }

    function test_dailyQuest_streakResets_afterGap() public {
        vm.prank(alice);
        rep.claimDailyQuest();

        vm.warp(block.timestamp + 2 * DAY); // skip a day
        vm.prank(alice);
        rep.claimDailyQuest();

        assertEq(rep.getReputation(alice).questStreakDays, 1); // reset
    }

    function test_dailyQuest_streakContinues_exactNextDay() public {
        uint256 dayStart = (block.timestamp / DAY) * DAY;

        vm.warp(dayStart);
        vm.prank(alice); rep.claimDailyQuest();

        vm.warp(dayStart + DAY);
        vm.prank(alice); rep.claimDailyQuest();

        vm.warp(dayStart + 2 * DAY);
        vm.prank(alice); rep.claimDailyQuest();

        assertEq(rep.getReputation(alice).questStreakDays, 3);
    }

    // ── REFERRAL ──

    function test_referral_set() public {
        vm.prank(caller); rep.setReferrer(alice, bob);
        assertEq(rep.getReputation(alice).referrer, bob);
    }

    function test_referral_cannotSetSelf() public {
        vm.prank(caller); rep.setReferrer(alice, alice);
        assertEq(rep.getReputation(alice).referrer, address(0));
    }

    function test_referral_cannotOverwrite() public {
        vm.startPrank(caller);
        rep.setReferrer(alice, bob);
        rep.setReferrer(alice, charlie);
        vm.stopPrank();
        assertEq(rep.getReputation(alice).referrer, bob);
    }

    function test_referral_reward_onFirstOntime() public {
        vm.startPrank(caller);
        rep.setReferrer(alice, bob);
        rep.recordPayment(alice, 0, 0, true);
        vm.stopPrank();
        assertEq(rep.getReputation(alice).xp, 60); // 10 + 50
        assertEq(rep.getReputation(bob).xp, 50);
    }

    function test_referral_reward_firesOnlyOnce() public {
        vm.startPrank(caller);
        rep.setReferrer(alice, bob);
        rep.recordPayment(alice, 0, 0, true); // triggers
        rep.recordPayment(alice, 0, 1, true); // no second trigger
        vm.stopPrank();
        assertEq(rep.getReputation(alice).xp, 70); // 10+50+10
        assertEq(rep.getReputation(bob).xp, 50);   // only once
    }

    function test_referral_notTriggered_latePayment() public {
        vm.startPrank(caller);
        rep.setReferrer(alice, bob);
        rep.recordPayment(alice, 0, 0, false); // late
        vm.stopPrank();
        assertEq(rep.getReputation(alice).xp, 3);
        assertEq(rep.getReputation(bob).xp, 0);
        assertFalse(rep.getReputation(alice).referralRewarded);
    }

    // ── ACCESS CONTROL ──

    function test_revert_recordPayment_unauthorized() public {
        vm.prank(alice);
        vm.expectRevert("Not authorized");
        rep.recordPayment(bob, 0, 0, true);
    }

    function test_revert_setReferrer_unauthorized() public {
        vm.prank(alice);
        vm.expectRevert("Not authorized");
        rep.setReferrer(bob, charlie);
    }

    function test_revert_recordCircleJoined_unauthorized() public {
        vm.prank(alice);
        vm.expectRevert("Not authorized");
        rep.recordCircleJoined(bob, 0);
    }

    function test_revert_recordCircleCompleted_unauthorized() public {
        vm.prank(alice);
        vm.expectRevert("Not authorized");
        rep.recordCircleCompleted(bob, 0);
    }

    function test_setAuthorized_onlyOwner() public {
        vm.expectRevert();
        vm.prank(alice);
        rep.setAuthorized(charlie, true);
    }
}
