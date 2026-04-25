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

    uint256 public constant CONTRIBUTION = 100e6;
    uint256 public constant CYCLE_DURATION = 120;
    uint256 public constant GRACE_PERIOD = 30;
    uint256 public constant LATE_PENALTY_BPS = 500;
    uint256 public constant T0 = 10_000; // base timestamp

    function setUp() public {
        vm.warp(T0);

        usdc = new MockUSDC();
        reputation = new KitpotReputation();
        achievements = new KitpotAchievements(block.timestamp + 30 days);
        kitpot = new KitpotCircle(100, address(reputation));

        reputation.setAuthorized(address(kitpot), true);
        achievements.setAuthorized(address(kitpot), true);
        kitpot.setAchievements(address(achievements));

        address[4] memory accounts = [owner, alice, bob, charlie];
        for (uint i = 0; i < accounts.length; i++) {
            usdc.mint(accounts[i], 100_000e6);
            vm.prank(accounts[i]);
            usdc.approve(address(kitpot), type(uint256).max);
        }
    }

    // ── CIRCLE CREATION ──

    function test_createCircle() public {
        uint256 id = _createCircle(3, false);
        KitpotCircle.Circle memory c = kitpot.getCircle(id);
        assertEq(c.name, "Test Circle");
        assertEq(c.creator, owner);
        assertEq(c.memberCount, 1);
        assertEq(uint(c.status), uint(KitpotCircle.CircleStatus.Forming));
    }

    function test_createCircle_collateral() public {
        uint256 bal = usdc.balanceOf(owner);
        uint256 id = _createCircle(3, false);
        assertEq(bal - usdc.balanceOf(owner), CONTRIBUTION);
        assertEq(kitpot.getCollateral(id, owner), CONTRIBUTION);
    }

    function test_createCircle_public() public {
        uint256 id = _createCircle(3, true);
        assertTrue(kitpot.getCircle(id).isPublic);
    }

    function test_createCircle_revert_tooFewMembers() public {
        vm.expectRevert("Members 3-20");
        _raw(2);
    }

    function test_createCircle_revert_tooManyMembers() public {
        vm.expectRevert("Members 3-20");
        _raw(21);
    }

    function test_createCircle_revert_zeroAmount() public {
        vm.expectRevert("Contribution > 0");
        kitpot.createCircle("X","",address(usdc),0,3,CYCLE_DURATION,GRACE_PERIOD,LATE_PENALTY_BPS,false,IKitpotReputation.TrustTier.Unranked,"test.init");
    }

    function test_createCircle_revert_graceExceedsCycle() public {
        vm.expectRevert("Grace must be < cycle");
        kitpot.createCircle("X","",address(usdc),CONTRIBUTION,3,120,120,LATE_PENALTY_BPS,false,IKitpotReputation.TrustTier.Unranked,"test.init");
    }

    // ── JOIN ──

    function test_joinCircle() public {
        uint256 id = _createCircle(3, false);
        vm.prank(alice);
        kitpot.joinCircle(id, "alice.init");
        assertEq(kitpot.getMembers(id).length, 2);
        assertEq(kitpot.getCollateral(id, alice), CONTRIBUTION);
    }

    function test_joinCircle_activates() public {
        uint256 id = _full();
        assertEq(uint(kitpot.getCircle(id).status), uint(KitpotCircle.CircleStatus.Active));
    }

    function test_joinCircle_revert_already() public {
        uint256 id = _createCircle(3, false);
        vm.prank(alice); kitpot.joinCircle(id, "a");
        vm.expectRevert("Already a member");
        vm.prank(alice); kitpot.joinCircle(id, "b");
    }

    function test_joinCircle_revert_afterFull() public {
        uint256 id = _full(); // becomes Active when 3rd member joins
        vm.expectRevert("Invalid circle status"); // Active, not Forming
        vm.prank(charlie); kitpot.joinCircle(id, "c");
    }

    function test_joinCircle_revert_tierGate() public {
        uint256 id = kitpot.createCircle("G","",address(usdc),CONTRIBUTION,3,CYCLE_DURATION,GRACE_PERIOD,LATE_PENALTY_BPS,false,IKitpotReputation.TrustTier.Gold,"test.init");
        vm.expectRevert("Trust tier too low");
        vm.prank(alice); kitpot.joinCircle(id, "a");
    }

    function test_joinCircle_revert_afterActive() public {
        uint256 id = _full();
        vm.expectRevert("Invalid circle status");
        vm.prank(charlie); kitpot.joinCircle(id, "c");
    }

    // ── DEPOSITS ──

    function test_deposit() public {
        uint256 id = _full();
        kitpot.deposit(id);
        assertTrue(kitpot.hasPaid(id, 0, owner));
    }

    function test_deposit_revert_double() public {
        uint256 id = _full();
        kitpot.deposit(id);
        vm.expectRevert("Already paid this cycle");
        kitpot.deposit(id);
    }

    function test_deposit_revert_notMember() public {
        uint256 id = _full();
        vm.expectRevert("Not a member");
        vm.prank(charlie); kitpot.deposit(id);
    }

    function test_deposit_latePenalty() public {
        uint256 id = _full();
        vm.warp(block.timestamp + GRACE_PERIOD + 1);
        uint256 c1 = kitpot.getCollateral(id, owner);
        kitpot.deposit(id);
        uint256 penalty = (CONTRIBUTION * LATE_PENALTY_BPS) / 10000;
        assertEq(c1 - kitpot.getCollateral(id, owner), penalty);
    }

    function test_deposit_onTime_noPenalty() public {
        uint256 id = _full();
        uint256 c1 = kitpot.getCollateral(id, owner);
        kitpot.deposit(id);
        assertEq(kitpot.getCollateral(id, owner), c1);
    }

    // ── ADVANCE CYCLE ──

    function test_advanceCycle() public {
        uint256 id = _full();
        _depAll(id);
        vm.warp(block.timestamp + CYCLE_DURATION);
        uint256 bal = usdc.balanceOf(owner);
        kitpot.advanceCycle(id);
        uint256 pot = CONTRIBUTION * 3;
        assertEq(usdc.balanceOf(owner) - bal, pot - pot/100);
        assertEq(kitpot.getCircle(id).currentCycle, 1);
    }

    function test_advanceCycle_missedUsesCollateral() public {
        uint256 id = _full();
        kitpot.deposit(id);
        vm.prank(alice); kitpot.deposit(id);
        vm.warp(block.timestamp + CYCLE_DURATION);
        kitpot.advanceCycle(id);
        assertEq(kitpot.getCollateral(id, bob), 0);
        assertTrue(kitpot.hasPaid(id, 0, bob));
    }

    function test_advanceCycle_revert_tooEarly() public {
        uint256 id = _full();
        _depAll(id);
        vm.expectRevert("Cycle not elapsed");
        kitpot.advanceCycle(id);
    }

    // ── COLLATERAL ──

    function test_claimCollateral_afterComplete() public {
        uint256 id = _run();
        uint256 collateral = kitpot.getCollateral(id, owner);
        assertGt(collateral, 0); // has collateral to claim
        uint256 bal = usdc.balanceOf(owner);
        kitpot.claimCollateral(id);
        assertEq(usdc.balanceOf(owner) - bal, collateral);
        assertEq(kitpot.getCollateral(id, owner), 0);
    }

    function test_claimCollateral_revert_notComplete() public {
        uint256 id = _full();
        vm.expectRevert("Circle not completed");
        kitpot.claimCollateral(id);
    }

    function test_claimCollateral_revert_doubleClaim() public {
        uint256 id = _run();
        kitpot.claimCollateral(id);
        vm.expectRevert("No collateral");
        kitpot.claimCollateral(id);
    }

    // ── REPUTATION INTEGRATION ──

    function test_rep_deposit() public {
        uint256 id = _full();
        kitpot.deposit(id);
        IKitpotReputation.MemberReputation memory r = reputation.getReputation(owner);
        assertEq(r.totalCyclesPaid, 1);
        assertGt(r.xp, 0);
    }

    function test_rep_missed() public {
        uint256 id = _full();
        kitpot.deposit(id);
        vm.prank(alice); kitpot.deposit(id);
        vm.warp(block.timestamp + CYCLE_DURATION);
        kitpot.advanceCycle(id);
        assertEq(reputation.getReputation(bob).totalCyclesMissed, 1);
    }

    function test_rep_completed() public {
        uint256 id = _run();
        assertEq(reputation.getReputation(owner).totalCirclesCompleted, 1);
    }

    function test_rep_joined() public {
        uint256 id = _createCircle(3, false);
        vm.prank(alice); kitpot.joinCircle(id, "a");
        assertEq(reputation.getReputation(alice).totalCirclesJoined, 1);
    }

    // ── LIFECYCLE ──

    function test_fullLifecycle() public {
        uint256 id = _run();
        assertEq(uint(kitpot.getCircle(id).status), uint(KitpotCircle.CircleStatus.Completed));
    }

    function test_fullLifecycle_withLate() public {
        uint256 id = _full();
        // Circle activated at T0=10000. cycleStartTimes[0] = 10000.

        // Cycle 0: owner pays late (after grace)
        vm.warp(T0 + GRACE_PERIOD + 1); // 10031
        kitpot.deposit(id);
        vm.prank(alice); kitpot.deposit(id);
        vm.prank(bob); kitpot.deposit(id);
        vm.warp(T0 + CYCLE_DURATION + 1); // 10061 — past cycle 0 end
        kitpot.advanceCycle(id);
        // cycleStartTimes[1] = 10061

        uint256 penalty = (CONTRIBUTION * LATE_PENALTY_BPS) / 10000;
        assertEq(kitpot.getCollateral(id, owner), CONTRIBUTION - penalty);

        // Cycle 1: on time
        vm.warp(T0 + CYCLE_DURATION + 2); // 10062 — in cycle 1 window
        _depAll(id);
        vm.warp(T0 + 2 * CYCLE_DURATION + 2); // 10122 — past cycle 1 end
        kitpot.advanceCycle(id);
        // cycleStartTimes[2] = 10122

        // Cycle 2: on time
        vm.warp(T0 + 2 * CYCLE_DURATION + 3); // 10123 — in cycle 2 window
        _depAll(id);
        vm.warp(T0 + 3 * CYCLE_DURATION + 3); // 10183 — past cycle 2 end
        kitpot.advanceCycle(id);

        assertEq(uint(kitpot.getCircle(id).status), uint(KitpotCircle.CircleStatus.Completed));
    }

    function test_fullLifecycle_allReceived() public {
        uint256 id = _run();
        KitpotCircle.Member[] memory m = kitpot.getMembers(id);
        for (uint i = 0; i < m.length; i++) assertTrue(m[i].hasReceivedPot);
    }

    // ── ADMIN ──

    function test_setPlatformFee() public { kitpot.setPlatformFee(200); assertEq(kitpot.platformFeeBps(), 200); }
    function test_setPlatformFee_revert() public { vm.expectRevert("Fee too high"); kitpot.setPlatformFee(600); }

    function test_withdrawFees() public {
        uint256 id = _full();
        _depAll(id);
        vm.warp(block.timestamp + CYCLE_DURATION);
        kitpot.advanceCycle(id);
        uint256 bal = usdc.balanceOf(owner);
        kitpot.withdrawFees(address(usdc));
        assertEq(usdc.balanceOf(owner) - bal, (CONTRIBUTION * 3) / 100);
    }

    function test_withdrawFees_revert_none() public { vm.expectRevert("No fees"); kitpot.withdrawFees(address(usdc)); }
    function test_pause() public { kitpot.pause(); vm.expectRevert(); _raw(3); }
    function test_unpause() public { kitpot.pause(); kitpot.unpause(); _createCircle(3, false); }
    function test_pause_revert_notOwner() public { vm.expectRevert(); vm.prank(alice); kitpot.pause(); }

    // ── VIEWS ──

    function test_getCircleCount() public { assertEq(kitpot.getCircleCount(), 0); _createCircle(3,false); assertEq(kitpot.getCircleCount(), 1); }

    function test_getCyclePaymentStatus() public {
        uint256 id = _full();
        kitpot.deposit(id);
        (, bool[] memory p) = kitpot.getCyclePaymentStatus(id);
        assertTrue(p[0]); assertFalse(p[1]); assertFalse(p[2]);
    }

    function test_getCurrentCycleInfo() public {
        uint256 id = _full();
        (uint256 cn,,, address r, bool ap, bool ca) = kitpot.getCurrentCycleInfo(id);
        assertEq(cn, 0); assertEq(r, owner); assertFalse(ap); assertFalse(ca);
    }

    function test_getMemberByAddress() public {
        uint256 id = _full();
        KitpotCircle.Member memory m = kitpot.getMemberByAddress(id, alice);
        assertEq(m.addr, alice); assertEq(m.turnOrder, 1);
    }

    // ── HELPERS ──

    function _raw(uint256 n) internal returns (uint256) {
        return kitpot.createCircle("Test Circle","desc",address(usdc),CONTRIBUTION,n,CYCLE_DURATION,GRACE_PERIOD,LATE_PENALTY_BPS,false,IKitpotReputation.TrustTier.Unranked,"creator.init");
    }
    function _createCircle(uint256 n, bool pub) internal returns (uint256) {
        return kitpot.createCircle("Test Circle","desc",address(usdc),CONTRIBUTION,n,CYCLE_DURATION,GRACE_PERIOD,LATE_PENALTY_BPS,pub,IKitpotReputation.TrustTier.Unranked,"creator.init");
    }
    function _full() internal returns (uint256) {
        uint256 id = _createCircle(3, false);
        vm.prank(alice); kitpot.joinCircle(id, "alice.init");
        vm.prank(bob); kitpot.joinCircle(id, "bob.init");
        return id;
    }
    function _depAll(uint256 id) internal {
        kitpot.deposit(id);
        vm.prank(alice); kitpot.deposit(id);
        vm.prank(bob); kitpot.deposit(id);
    }
    function _run() internal returns (uint256) {
        uint256 id = _full();
        uint256 start = block.timestamp;
        for (uint256 i = 0; i < 3; i++) {
            // Warp to within cycle window (after cycle start, deposits are valid)
            vm.warp(start + i * CYCLE_DURATION + 1);
            _depAll(id);
            // Warp past cycle end
            vm.warp(start + (i + 1) * CYCLE_DURATION + 1);
            kitpot.advanceCycle(id);
        }
        return id;
    }
}
