// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/KitpotCircle.sol";
import "../src/KitpotReputation.sol";
import "../src/KitpotAchievements.sol";
import "../src/MockUSDC.sol";
import "../src/interfaces/IKitpotReputation.sol";

contract KitpotCircleTest is Test {
    KitpotCircle public kitpot;
    KitpotReputation public reputation;
    KitpotAchievements public achievements;
    MockUSDC public usdc;

    address public owner = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");
    address public dave = makeAddr("dave");

    uint256 public constant CONTRIBUTION = 100e6;
    uint256 public constant CYCLE_DURATION = 60;
    uint256 public constant GRACE_PERIOD = 30;
    uint256 public constant LATE_PENALTY_BPS = 500; // 5%

    function setUp() public {
        usdc = new MockUSDC();
        reputation = new KitpotReputation();
        achievements = new KitpotAchievements(block.timestamp + 30 days);
        kitpot = new KitpotCircle(100, address(reputation));

        // Authorize
        reputation.setAuthorized(address(kitpot), true);
        achievements.setAuthorized(address(kitpot), true);
        kitpot.setAchievements(address(achievements));

        // Mint & approve for all test accounts
        address[4] memory accounts = [owner, alice, bob, charlie];
        for (uint i = 0; i < accounts.length; i++) {
            usdc.mint(accounts[i], 100_000e6);
            vm.prank(accounts[i]);
            usdc.approve(address(kitpot), type(uint256).max);
        }
    }

    // ================================================================
    //                     CIRCLE CREATION
    // ================================================================

    function test_createCircle() public {
        uint256 circleId = _createCircle(3, false);
        KitpotCircle.Circle memory c = kitpot.getCircle(circleId);

        assertEq(c.name, "Test Circle");
        assertEq(c.creator, owner);
        assertEq(c.contributionAmount, CONTRIBUTION);
        assertEq(c.maxMembers, 3);
        assertEq(c.memberCount, 1);
        assertEq(uint(c.status), uint(KitpotCircle.CircleStatus.Forming));
        assertEq(c.gracePeriod, GRACE_PERIOD);
        assertEq(c.latePenaltyBps, LATE_PENALTY_BPS);
    }

    function test_createCircle_collateralDeposited() public {
        uint256 balBefore = usdc.balanceOf(owner);
        uint256 circleId = _createCircle(3, false);
        uint256 balAfter = usdc.balanceOf(owner);

        // Creator deposits collateral = contributionAmount
        assertEq(balBefore - balAfter, CONTRIBUTION);
        assertEq(kitpot.getCollateral(circleId, owner), CONTRIBUTION);
    }

    function test_createCircle_revert_invalidMembers() public {
        vm.expectRevert("Members: 3-20");
        kitpot.createCircle("Bad", "", address(usdc), CONTRIBUTION, 2, CYCLE_DURATION, GRACE_PERIOD, LATE_PENALTY_BPS, false, IKitpotReputation.TrustTier.Unranked);
    }

    function test_createCircle_revert_zeroAmount() public {
        vm.expectRevert("Amount must be > 0");
        kitpot.createCircle("Bad", "", address(usdc), 0, 3, CYCLE_DURATION, GRACE_PERIOD, LATE_PENALTY_BPS, false, IKitpotReputation.TrustTier.Unranked);
    }

    // ================================================================
    //                       JOIN CIRCLE
    // ================================================================

    function test_joinCircle() public {
        uint256 circleId = _createCircle(3, false);

        vm.prank(alice);
        kitpot.joinCircle(circleId, "alice.init");

        KitpotCircle.Member[] memory members = kitpot.getMembers(circleId);
        assertEq(members.length, 2);
        assertEq(members[1].addr, alice);
        assertEq(kitpot.getCollateral(circleId, alice), CONTRIBUTION);
    }

    function test_joinCircle_activatesWhenFull() public {
        uint256 circleId = _createCircle(3, false);
        vm.prank(alice);
        kitpot.joinCircle(circleId, "alice.init");
        vm.prank(bob);
        kitpot.joinCircle(circleId, "bob.init");

        KitpotCircle.Circle memory c = kitpot.getCircle(circleId);
        assertEq(uint(c.status), uint(KitpotCircle.CircleStatus.Active));
        assertGt(c.startTime, 0);
    }

    function test_joinCircle_revert_alreadyMember() public {
        uint256 circleId = _createCircle(3, false);
        vm.prank(alice);
        kitpot.joinCircle(circleId, "alice.init");
        vm.expectRevert("Already a member");
        vm.prank(alice);
        kitpot.joinCircle(circleId, "alice2.init");
    }

    function test_joinCircle_revert_tierGate() public {
        // Create Gold-gated circle
        uint256 circleId = kitpot.createCircle(
            "Gated", "", address(usdc), CONTRIBUTION, 3, CYCLE_DURATION, GRACE_PERIOD,
            LATE_PENALTY_BPS, false, IKitpotReputation.TrustTier.Gold
        );
        // Alice has no reputation → revert
        vm.expectRevert("Trust tier too low");
        vm.prank(alice);
        kitpot.joinCircle(circleId, "alice.init");
    }

    // ================================================================
    //                        DEPOSITS
    // ================================================================

    function test_deposit() public {
        uint256 circleId = _createFullCircle();
        kitpot.deposit(circleId);
        assertTrue(kitpot.hasPaid(circleId, 0, owner));
    }

    function test_deposit_revert_doublePay() public {
        uint256 circleId = _createFullCircle();
        kitpot.deposit(circleId);
        vm.expectRevert("Already paid this cycle");
        kitpot.deposit(circleId);
    }

    function test_deposit_latePenalty() public {
        uint256 circleId = _createFullCircle();

        // Warp past grace period
        vm.warp(block.timestamp + GRACE_PERIOD + 1);

        uint256 collateralBefore = kitpot.getCollateral(circleId, owner);
        kitpot.deposit(circleId);
        uint256 collateralAfter = kitpot.getCollateral(circleId, owner);

        // 5% penalty on 100 USDC = 5 USDC
        uint256 expectedPenalty = (CONTRIBUTION * LATE_PENALTY_BPS) / 10000;
        assertEq(collateralBefore - collateralAfter, expectedPenalty);
    }

    // ================================================================
    //                     ADVANCE CYCLE
    // ================================================================

    function test_advanceCycle() public {
        uint256 circleId = _createFullCircle();
        _depositAll(circleId);

        uint256 balBefore = usdc.balanceOf(owner);
        kitpot.advanceCycle(circleId);

        uint256 totalPot = CONTRIBUTION * 3;
        uint256 fee = totalPot / 100;
        assertEq(usdc.balanceOf(owner) - balBefore, totalPot - fee);

        KitpotCircle.Circle memory c = kitpot.getCircle(circleId);
        assertEq(c.currentCycle, 1);
    }

    function test_advanceCycle_missedPayment_usesCollateral() public {
        uint256 circleId = _createFullCircle();

        // Only owner and alice deposit, bob doesn't
        kitpot.deposit(circleId);
        vm.prank(alice);
        kitpot.deposit(circleId);
        // Bob misses!

        kitpot.advanceCycle(circleId);

        // Bob's collateral should be reduced
        assertEq(kitpot.getCollateral(circleId, bob), 0); // 100 collateral - 100 contribution = 0
        // Payment still counted (covered by collateral)
        assertTrue(kitpot.hasPaid(circleId, 0, bob));
    }

    function test_advanceCycle_revert_tooEarly() public {
        // Set a known timestamp first, then create circle
        vm.warp(1000);
        uint256 circleId = _createCircle(3, false);
        vm.prank(alice);
        kitpot.joinCircle(circleId, "alice.init");
        vm.prank(bob);
        kitpot.joinCircle(circleId, "bob.init");
        // Circle now active, startTime = 1000

        // Deposit all at cycle 0 (timestamp 1000)
        kitpot.deposit(circleId);
        vm.prank(alice);
        kitpot.deposit(circleId);
        vm.prank(bob);
        kitpot.deposit(circleId);

        // Still at timestamp 1000, cycle 1 starts at 1000+60=1060
        // advanceCycle for cycle 0 should work (we're >= startTime + 0*60 = 1000)
        kitpot.advanceCycle(circleId);

        // Now at cycle 1 — deposit all again
        kitpot.deposit(circleId);
        vm.prank(alice);
        kitpot.deposit(circleId);
        vm.prank(bob);
        kitpot.deposit(circleId);

        // Try advance at timestamp 1000, but cycle 1 needs timestamp >= 1060
        vm.expectRevert("Cycle not elapsed");
        kitpot.advanceCycle(circleId);
    }

    // ================================================================
    //                   AUTO-SIGNING SESSIONS
    // ================================================================

    function test_authorizeSession() public {
        uint256 circleId = _createFullCircle();
        address operator = makeAddr("operator");

        kitpot.authorizeSession(operator, circleId, CONTRIBUTION, block.timestamp + 1 hours);
        assertTrue(kitpot.isSessionValid(owner, operator, circleId));
    }

    function test_depositOnBehalf() public {
        uint256 circleId = _createFullCircle();
        address operator = makeAddr("operator");

        kitpot.authorizeSession(operator, circleId, CONTRIBUTION, block.timestamp + 1 hours);
        vm.prank(operator);
        kitpot.depositOnBehalf(circleId, owner);

        assertTrue(kitpot.hasPaid(circleId, 0, owner));
    }

    function test_batchDeposit() public {
        uint256 circleId = _createFullCircle();
        address operator = makeAddr("operator");

        // All authorize operator
        kitpot.authorizeSession(operator, circleId, CONTRIBUTION, block.timestamp + 1 hours);
        vm.prank(alice);
        kitpot.authorizeSession(operator, circleId, CONTRIBUTION, block.timestamp + 1 hours);
        vm.prank(bob);
        kitpot.authorizeSession(operator, circleId, CONTRIBUTION, block.timestamp + 1 hours);

        // Operator batch deposits
        vm.prank(operator);
        kitpot.batchDeposit(circleId);

        assertTrue(kitpot.hasPaid(circleId, 0, owner));
        assertTrue(kitpot.hasPaid(circleId, 0, alice));
        assertTrue(kitpot.hasPaid(circleId, 0, bob));
    }

    function test_batchDeposit_skipsInsufficientBalance() public {
        uint256 circleId = _createFullCircle();
        address operator = makeAddr("operator");
        address broke = makeAddr("broke");

        // Give broke no USDC but somehow they're a member (use owner instead for this test)
        // Test with owner who authorized but then we drain their USDC
        kitpot.authorizeSession(operator, circleId, CONTRIBUTION, block.timestamp + 1 hours);
        vm.prank(alice);
        kitpot.authorizeSession(operator, circleId, CONTRIBUTION, block.timestamp + 1 hours);

        // Drain owner's USDC approval
        vm.prank(owner);
        usdc.approve(address(kitpot), 0); // revoke approval

        // batchDeposit should NOT revert — just skip owner
        vm.prank(operator);
        kitpot.batchDeposit(circleId);

        assertFalse(kitpot.hasPaid(circleId, 0, owner)); // skipped
        assertTrue(kitpot.hasPaid(circleId, 0, alice));   // succeeded
    }

    function test_revokeSession() public {
        uint256 circleId = _createFullCircle();
        address operator = makeAddr("operator");

        kitpot.authorizeSession(operator, circleId, CONTRIBUTION, block.timestamp + 1 hours);
        kitpot.revokeSession(operator);
        assertFalse(kitpot.isSessionValid(owner, operator, circleId));
    }

    function test_session_expiry() public {
        uint256 circleId = _createFullCircle();
        address operator = makeAddr("operator");

        kitpot.authorizeSession(operator, circleId, CONTRIBUTION, block.timestamp + 1 hours);
        vm.warp(block.timestamp + 2 hours); // past expiry
        assertFalse(kitpot.isSessionValid(owner, operator, circleId));
    }

    // ================================================================
    //                      COLLATERAL
    // ================================================================

    function test_claimCollateral_afterComplete() public {
        vm.warp(1000);
        uint256 circleId = _createFullCircle();

        for (uint256 i = 0; i < 3; i++) {
            vm.warp(1000 + i * CYCLE_DURATION);
            _depositAll(circleId);
            vm.warp(1000 + (i + 1) * CYCLE_DURATION);
            kitpot.advanceCycle(circleId);
        }

        uint256 collateral = kitpot.getCollateral(circleId, owner);
        assertEq(collateral, CONTRIBUTION);

        uint256 balBefore = usdc.balanceOf(owner);
        kitpot.claimCollateral(circleId);
        assertEq(usdc.balanceOf(owner) - balBefore, CONTRIBUTION);
    }

    function test_claimCollateral_revert_beforeComplete() public {
        uint256 circleId = _createFullCircle();
        vm.expectRevert("Circle not completed");
        kitpot.claimCollateral(circleId);
    }

    // ================================================================
    //                      REPUTATION
    // ================================================================

    function test_reputation_recorded_onDeposit() public {
        uint256 circleId = _createFullCircle();
        kitpot.deposit(circleId);

        IKitpotReputation.MemberReputation memory rep = reputation.getReputation(owner);
        assertEq(rep.totalCyclesPaid, 1);
        assertEq(rep.totalCyclesOnTime, 1);
        assertEq(rep.consecutiveOnTime, 1);
    }

    function test_reputation_missedPayment_recorded() public {
        uint256 circleId = _createFullCircle();
        // Owner and Alice deposit, Bob doesn't
        kitpot.deposit(circleId);
        vm.prank(alice);
        kitpot.deposit(circleId);
        kitpot.advanceCycle(circleId);

        IKitpotReputation.MemberReputation memory rep = reputation.getReputation(bob);
        assertEq(rep.totalCyclesMissed, 1);
    }

    function test_reputation_circleCompleted_recorded() public {
        vm.warp(1000);
        uint256 circleId = _createFullCircle();

        for (uint256 i = 0; i < 3; i++) {
            vm.warp(1000 + i * CYCLE_DURATION);
            _depositAll(circleId);
            vm.warp(1000 + (i + 1) * CYCLE_DURATION);
            kitpot.advanceCycle(circleId);
        }

        IKitpotReputation.MemberReputation memory rep = reputation.getReputation(owner);
        assertEq(rep.totalCirclesCompleted, 1);
    }

    // ================================================================
    //                    FULL LIFECYCLE
    // ================================================================

    function test_fullCircleLifecycle() public {
        vm.warp(1000); // fixed start time
        uint256 circleId = _createFullCircle();
        // startTime = 1000

        for (uint256 cycle = 0; cycle < 3; cycle++) {
            // Warp to cycle start
            vm.warp(1000 + cycle * CYCLE_DURATION);
            _depositAll(circleId);
            // Warp past cycle end for advanceCycle
            vm.warp(1000 + (cycle + 1) * CYCLE_DURATION);
            kitpot.advanceCycle(circleId);
        }

        KitpotCircle.Circle memory c = kitpot.getCircle(circleId);
        assertEq(uint(c.status), uint(KitpotCircle.CircleStatus.Completed));
    }

    function test_fullLifecycle_withLatePenalties() public {
        vm.warp(1000);
        uint256 circleId = _createFullCircle();

        // Cycle 0: owner pays late (after grace period)
        vm.warp(1000 + GRACE_PERIOD + 1);
        kitpot.deposit(circleId);
        vm.prank(alice);
        kitpot.deposit(circleId);
        vm.prank(bob);
        kitpot.deposit(circleId);
        vm.warp(1000 + CYCLE_DURATION);
        kitpot.advanceCycle(circleId);

        uint256 penalty = (CONTRIBUTION * LATE_PENALTY_BPS) / 10000;
        assertEq(kitpot.getCollateral(circleId, owner), CONTRIBUTION - penalty);

        // Remaining cycles on time
        for (uint256 i = 1; i < 3; i++) {
            vm.warp(1000 + i * CYCLE_DURATION);
            _depositAll(circleId);
            vm.warp(1000 + (i + 1) * CYCLE_DURATION);
            kitpot.advanceCycle(circleId);
        }

        KitpotCircle.Circle memory c = kitpot.getCircle(circleId);
        assertEq(uint(c.status), uint(KitpotCircle.CircleStatus.Completed));
    }

    // ================================================================
    //                      ADMIN
    // ================================================================

    function test_setPlatformFee() public {
        kitpot.setPlatformFee(200);
        assertEq(kitpot.platformFeeBps(), 200);
    }

    function test_setPlatformFee_revert_tooHigh() public {
        vm.expectRevert("Fee too high");
        kitpot.setPlatformFee(600);
    }

    function test_withdrawFees() public {
        uint256 circleId = _createFullCircle();
        _depositAll(circleId);
        kitpot.advanceCycle(circleId);

        uint256 expectedFee = (CONTRIBUTION * 3) / 100; // 1% of 300
        uint256 balBefore = usdc.balanceOf(owner);
        kitpot.withdrawFees(address(usdc));
        assertEq(usdc.balanceOf(owner) - balBefore, expectedFee);
    }

    function test_pause() public {
        kitpot.pause();
        vm.expectRevert();
        kitpot.createCircle("X", "", address(usdc), CONTRIBUTION, 3, CYCLE_DURATION, GRACE_PERIOD, LATE_PENALTY_BPS, false, IKitpotReputation.TrustTier.Unranked);
    }

    // ================================================================
    //                       HELPERS
    // ================================================================

    function _createCircle(uint256 members, bool isPublic) internal returns (uint256) {
        return kitpot.createCircle(
            "Test Circle", "A test circle", address(usdc), CONTRIBUTION, members,
            CYCLE_DURATION, GRACE_PERIOD, LATE_PENALTY_BPS, isPublic,
            IKitpotReputation.TrustTier.Unranked
        );
    }

    function _createFullCircle() internal returns (uint256) {
        uint256 circleId = _createCircle(3, false);
        vm.prank(alice);
        kitpot.joinCircle(circleId, "alice.init");
        vm.prank(bob);
        kitpot.joinCircle(circleId, "bob.init");
        return circleId;
    }

    function _depositAll(uint256 circleId) internal {
        kitpot.deposit(circleId);
        vm.prank(alice);
        kitpot.deposit(circleId);
        vm.prank(bob);
        kitpot.deposit(circleId);
    }
}
