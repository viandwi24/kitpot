// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IKitpotReputation.sol";

interface IKitpotAchievements {
    enum AchievementType {
        FirstCircleJoined, FirstPotReceived, CircleCompleted, PerfectCircle,
        Streak3, Streak10, Streak25, CircleCreator, HighRoller, Veteran, DiamondTier, EarlyAdopter
    }
    function award(address member, AchievementType aType, uint256 circleId) external;
    function has(address member, AchievementType aType) external view returns (bool);
}

/// @title KitpotCircle — Trustless Rotating Savings Circle (ROSCA) on Initia
/// @notice Full-featured savings circles with reputation gating,
///         collateral, late penalties, and public discovery.
///         Pot distribution uses pull model: recipient calls claimPot() after cycle end;
///         if dormant past DORMANT_GRACE, anyone can call substituteClaim() (pot still
///         goes to recipient, caller earns KEEPER_REWARD_BPS).
///         Auto-signing is handled natively via InterwovenKit (Cosmos authz+feegrant).
contract KitpotCircle is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================================
    //                          ENUMS
    // ============================================================

    enum CircleStatus {
        Forming,
        Active,
        Completed
    }

    // ============================================================
    //                         STRUCTS
    // ============================================================

    struct Circle {
        uint256 id;
        string name;
        string description;             // for public discovery
        address creator;
        address tokenAddress;
        uint256 contributionAmount;
        uint256 maxMembers;
        uint256 totalCycles;            // = maxMembers
        uint256 currentCycle;
        uint256 cycleDuration;          // seconds
        uint256 gracePeriod;            // seconds after cycle start before late penalty
        uint256 startTime;
        uint256 memberCount;
        uint256 latePenaltyBps;         // penalty for late payment (e.g., 500 = 5%)
        CircleStatus status;
        bool isPublic;                  // visible in discovery
        IKitpotReputation.TrustTier minimumTier;  // tier gate
    }

    struct Member {
        address addr;
        string initUsername;
        uint256 joinedAt;
        bool hasReceivedPot;
        uint256 turnOrder;
        uint256 missedPayments;
    }

    struct CycleTiming {
        uint256 cycleStart;
        uint256 cycleEnd;
        uint256 dormantDeadline;
        uint256 nowTs;
        bool    canRecipientClaim;
        bool    canSubstituteClaim;
        address recipient;
    }

    // ============================================================
    //                        CONSTANTS
    // ============================================================

    uint256 public constant DORMANT_GRACE = 7 days;
    uint256 public constant KEEPER_REWARD_BPS = 10; // 0.1% of pot

    // ============================================================
    //                     STATE VARIABLES
    // ============================================================

    uint256 public nextCircleId;

    mapping(uint256 => Circle) internal _circles;
    mapping(uint256 => Member[]) internal _circleMembers;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(address => uint256)) public memberIndex;

    // Payment tracking
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasPaid;
    mapping(uint256 => mapping(uint256 => address)) public cycleRecipient;

    // Collateral: circleId => member => remaining collateral
    mapping(uint256 => mapping(address => uint256)) public collateralBalance;

    // Platform fee
    uint256 public platformFeeBps;
    uint256 public constant MAX_FEE_BPS = 500;
    uint256 public constant MAX_LATE_PENALTY_BPS = 1000; // max 10%
    mapping(address => uint256) public accumulatedFees;

    // Actual per-cycle start times: circleId => cycleIndex => startTimestamp
    mapping(uint256 => mapping(uint256 => uint256)) public cycleStartTimes;

    // External contracts
    IKitpotReputation public reputation;
    IKitpotAchievements public achievements;

    // ============================================================
    //                         EVENTS
    // ============================================================

    event CircleCreated(uint256 indexed circleId, address indexed creator, string name, uint256 contributionAmount, uint256 maxMembers);
    event MemberJoined(uint256 indexed circleId, address indexed member, string initUsername, uint256 turnOrder);
    event CircleActivated(uint256 indexed circleId, uint256 startTime);
    event CircleCompleted(uint256 indexed circleId);

    event DepositMade(uint256 indexed circleId, address indexed member, uint256 cycleNumber, uint256 amount);
    event PotDistributed(uint256 indexed circleId, uint256 cycleNumber, address indexed recipient, uint256 potAmount, uint256 feeAmount);
    event PotClaimed(uint256 indexed circleId, uint256 indexed cycleIndex, address indexed recipient, uint256 payout, uint256 fee);
    event SubstituteClaimed(uint256 indexed circleId, uint256 indexed cycleIndex, address indexed recipient, address keeper, uint256 payout, uint256 platformFee, uint256 keeperReward);
    event CycleAdvanced(uint256 indexed circleId, uint256 newCycleNumber);

    event CollateralDeposited(uint256 indexed circleId, address indexed member, uint256 amount);
    event LatePenaltyApplied(uint256 indexed circleId, address indexed member, uint256 penalty);
    event CollateralUsedForPayment(uint256 indexed circleId, address indexed member, uint256 amount);
    event MemberDefaulted(uint256 indexed circleId, address indexed member, uint256 slashedAmount);
    event CollateralReturned(uint256 indexed circleId, address indexed member, uint256 amount);

    event FeesWithdrawn(address indexed token, uint256 amount);
    event PlatformFeeUpdated(uint256 newFeeBps);

    // ============================================================
    //                       MODIFIERS
    // ============================================================

    modifier onlyCircleStatus(uint256 circleId, CircleStatus expected) {
        require(_circles[circleId].status == expected, "Invalid circle status");
        _;
    }

    modifier onlyMember(uint256 circleId) {
        require(isMember[circleId][msg.sender], "Not a member");
        _;
    }

    // ============================================================
    //                      CONSTRUCTOR
    // ============================================================

    constructor(uint256 _platformFeeBps, address _reputation) Ownable(msg.sender) {
        require(_platformFeeBps <= MAX_FEE_BPS, "Fee too high");
        platformFeeBps = _platformFeeBps;
        reputation = IKitpotReputation(_reputation);
    }

    // ============================================================
    //                  CIRCLE CREATION & JOINING
    // ============================================================

    /// @notice Create a new savings circle with full configuration
    function createCircle(
        string calldata name,
        string calldata description,
        address tokenAddress,
        uint256 contributionAmount,
        uint256 maxMembers,
        uint256 cycleDuration,
        uint256 gracePeriod,
        uint256 latePenaltyBps,
        bool isPublic,
        IKitpotReputation.TrustTier minimumTier,
        string calldata initUsername
    ) external whenNotPaused returns (uint256 circleId) {
        require(bytes(name).length > 0 && bytes(name).length <= 64, "Bad name length");
        require(tokenAddress != address(0), "Invalid token");
        require(contributionAmount > 0, "Contribution > 0");
        require(maxMembers >= 3 && maxMembers <= 20, "Members 3-20");
        require(cycleDuration >= 60, "Cycle too short (min 60s)");
        require(cycleDuration <= 365 days, "Cycle too long");
        require(gracePeriod > 0, "Grace must be > 0");
        require(gracePeriod < cycleDuration, "Grace must be < cycle");
        require(latePenaltyBps <= MAX_LATE_PENALTY_BPS, "Penalty too high");
        require(bytes(initUsername).length > 0, "Username required");

        circleId = nextCircleId++;

        Circle storage c = _circles[circleId];
        c.id = circleId;
        c.name = name;
        c.description = description;
        c.creator = msg.sender;
        c.tokenAddress = tokenAddress;
        c.contributionAmount = contributionAmount;
        c.maxMembers = maxMembers;
        c.totalCycles = maxMembers;
        c.cycleDuration = cycleDuration;
        c.gracePeriod = gracePeriod;
        c.latePenaltyBps = latePenaltyBps;
        c.isPublic = isPublic;
        c.minimumTier = minimumTier;
        c.status = CircleStatus.Forming;

        // Creator joins + deposits collateral
        _addMember(circleId, msg.sender, initUsername);
        _depositCollateral(circleId, msg.sender, tokenAddress, contributionAmount);

        // Award creator achievements
        if (address(achievements) != address(0)) {
            if (!achievements.has(msg.sender, IKitpotAchievements.AchievementType.FirstCircleJoined)) {
                try achievements.award(msg.sender, IKitpotAchievements.AchievementType.FirstCircleJoined, circleId) {} catch {}
            }
            if (!achievements.has(msg.sender, IKitpotAchievements.AchievementType.CircleCreator)) {
                try achievements.award(msg.sender, IKitpotAchievements.AchievementType.CircleCreator, circleId) {} catch {}
            }
        }

        emit CircleCreated(circleId, msg.sender, name, contributionAmount, maxMembers);
    }

    /// @notice Join a forming circle. Requires collateral deposit.
    function joinCircle(uint256 circleId, string calldata initUsername)
        external
        whenNotPaused
        onlyCircleStatus(circleId, CircleStatus.Forming)
    {
        Circle storage c = _circles[circleId];
        require(!isMember[circleId][msg.sender], "Already a member");
        require(c.memberCount < c.maxMembers, "Circle is full");

        // Tier gate check
        if (c.minimumTier != IKitpotReputation.TrustTier.Unranked) {
            require(
                reputation.meetsMinimumTier(msg.sender, c.minimumTier),
                "Trust tier too low"
            );
        }

        _addMember(circleId, msg.sender, initUsername);
        _depositCollateral(circleId, msg.sender, c.tokenAddress, c.contributionAmount);

        // Record in reputation
        reputation.recordCircleJoined(msg.sender, circleId);

        // Award first join achievement
        if (address(achievements) != address(0) && !achievements.has(msg.sender, IKitpotAchievements.AchievementType.FirstCircleJoined)) {
            try achievements.award(msg.sender, IKitpotAchievements.AchievementType.FirstCircleJoined, circleId) {} catch {}
        }

        // Auto-activate when full
        if (c.memberCount == c.maxMembers) {
            c.status = CircleStatus.Active;
            c.startTime = block.timestamp;
            cycleStartTimes[circleId][0] = block.timestamp;
            emit CircleActivated(circleId, block.timestamp);
        }
    }

    function _addMember(uint256 circleId, address addr, string memory initUsername) internal {
        Circle storage c = _circles[circleId];
        uint256 turnOrder = c.memberCount;

        _circleMembers[circleId].push(Member({
            addr: addr,
            initUsername: initUsername,
            joinedAt: block.timestamp,
            hasReceivedPot: false,
            turnOrder: turnOrder,
            missedPayments: 0
        }));

        isMember[circleId][addr] = true;
        memberIndex[circleId][addr] = turnOrder;
        c.memberCount++;

        emit MemberJoined(circleId, addr, initUsername, turnOrder);
    }

    function _depositCollateral(uint256 circleId, address member, address token, uint256 amount) internal {
        IERC20(token).safeTransferFrom(member, address(this), amount);
        collateralBalance[circleId][member] = amount;
        emit CollateralDeposited(circleId, member, amount);
    }

    // ============================================================
    //                  PAYMENTS & DISTRIBUTION
    // ============================================================

    /// @notice Deposit contribution for current cycle
    function deposit(uint256 circleId)
        external
        nonReentrant
        whenNotPaused
        onlyCircleStatus(circleId, CircleStatus.Active)
        onlyMember(circleId)
    {
        _depositFor(circleId, msg.sender);
    }

    /// @notice Recipient claims their pot after cycle duration elapses.
    function claimPot(uint256 circleId)
        external
        nonReentrant
        whenNotPaused
        onlyCircleStatus(circleId, CircleStatus.Active)
    {
        _claimPotInternal(circleId);
    }

    /// @notice Permissionless substitute claim after dormant grace.
    ///         Pot goes to the actual recipient; caller earns keeper reward.
    function substituteClaim(uint256 circleId)
        external
        nonReentrant
        whenNotPaused
        onlyCircleStatus(circleId, CircleStatus.Active)
    {
        _substituteClaimInternal(circleId);
    }

    /// @dev DEPRECATED — use claimPot() or substituteClaim().
    ///      Kept as routing alias for backward compat during migration.
    function advanceCycle(uint256 circleId)
        external
        nonReentrant
        whenNotPaused
        onlyCircleStatus(circleId, CircleStatus.Active)
    {
        Circle storage c = _circles[circleId];
        Member[] storage members = _circleMembers[circleId];
        address recipient = members[c.currentCycle].addr;
        uint256 cycleStart = cycleStartTimes[circleId][c.currentCycle];
        uint256 cycleEnd = cycleStart + c.cycleDuration;

        if (msg.sender == recipient && block.timestamp >= cycleEnd && block.timestamp < cycleEnd + DORMANT_GRACE) {
            _claimPotInternal(circleId);
        } else if (block.timestamp >= cycleEnd + DORMANT_GRACE) {
            _substituteClaimInternal(circleId);
        } else if (block.timestamp >= cycleEnd) {
            // Cycle elapsed but caller is not recipient — allow recipient-style claim
            // for backward compat (old UI lets anyone call advanceCycle)
            _claimPotInternal(circleId);
        } else {
            revert("Cycle not elapsed");
        }
    }

    // ============================================================
    //               INTERNAL CLAIM LOGIC
    // ============================================================

    function _claimPotInternal(uint256 circleId) internal {
        Circle storage c = _circles[circleId];
        Member[] storage members = _circleMembers[circleId];

        address recipient = members[c.currentCycle].addr;
        uint256 cycleStart = cycleStartTimes[circleId][c.currentCycle];
        require(cycleStart > 0, "Cycle not started");
        require(block.timestamp >= cycleStart + c.cycleDuration, "Cycle not elapsed");

        _processMissedPayments(circleId);

        uint256 totalPot = c.contributionAmount * c.maxMembers;
        uint256 fee = (totalPot * platformFeeBps) / 10000;
        uint256 payout = totalPot - fee;

        IERC20(c.tokenAddress).safeTransfer(recipient, payout);
        if (fee > 0) accumulatedFees[c.tokenAddress] += fee;

        cycleRecipient[circleId][c.currentCycle] = recipient;
        members[c.currentCycle].hasReceivedPot = true;

        reputation.recordPotReceived(recipient, payout);
        _maybeAwardFirstPot(recipient, circleId);

        emit PotClaimed(circleId, c.currentCycle, recipient, payout, fee);
        emit PotDistributed(circleId, c.currentCycle, recipient, payout, fee);

        _advanceToNextCycle(circleId);
    }

    function _substituteClaimInternal(uint256 circleId) internal {
        Circle storage c = _circles[circleId];
        Member[] storage members = _circleMembers[circleId];

        address recipient = members[c.currentCycle].addr;
        uint256 cycleStart = cycleStartTimes[circleId][c.currentCycle];
        require(cycleStart > 0, "Cycle not started");
        require(
            block.timestamp >= cycleStart + c.cycleDuration + DORMANT_GRACE,
            "Wait for dormant grace"
        );

        _processMissedPayments(circleId);

        uint256 totalPot = c.contributionAmount * c.maxMembers;
        uint256 pFee = (totalPot * platformFeeBps) / 10000;
        uint256 keeperReward = (totalPot * KEEPER_REWARD_BPS) / 10000;
        uint256 payout = totalPot - pFee - keeperReward;

        IERC20 token = IERC20(c.tokenAddress);
        token.safeTransfer(recipient, payout);
        if (keeperReward > 0) token.safeTransfer(msg.sender, keeperReward);
        if (pFee > 0) accumulatedFees[c.tokenAddress] += pFee;

        cycleRecipient[circleId][c.currentCycle] = recipient;
        members[c.currentCycle].hasReceivedPot = true;

        reputation.recordPotReceived(recipient, payout);
        _maybeAwardFirstPot(recipient, circleId);

        emit SubstituteClaimed(circleId, c.currentCycle, recipient, msg.sender, payout, pFee, keeperReward);

        _advanceToNextCycle(circleId);
    }

    function _advanceToNextCycle(uint256 circleId) internal {
        Circle storage c = _circles[circleId];
        Member[] storage members = _circleMembers[circleId];

        uint256 nextCycle = c.currentCycle + 1;

        if (nextCycle < c.totalCycles) {
            // Deterministic: use previous cycle end, NOT block.timestamp
            uint256 prevCycleStart = cycleStartTimes[circleId][c.currentCycle];
            uint256 nextStart = prevCycleStart + c.cycleDuration;
            // Guard: if claim was so late that next cycle already lapsed, reset to now
            if (block.timestamp > nextStart + c.cycleDuration) {
                nextStart = block.timestamp;
            }
            cycleStartTimes[circleId][nextCycle] = nextStart;
        }

        c.currentCycle = nextCycle;

        if (c.currentCycle >= c.totalCycles) {
            c.status = CircleStatus.Completed;
            for (uint256 i = 0; i < members.length; i++) {
                address m = members[i].addr;
                reputation.recordCircleCompleted(m, circleId);
                _maybeAwardCompletionAchievements(m, members[i].missedPayments, circleId);
            }
            emit CircleCompleted(circleId);
        } else {
            emit CycleAdvanced(circleId, c.currentCycle);
        }
    }

    // ============================================================
    //               EXTRACTED INTERNAL HELPERS
    // ============================================================

    function _processMissedPayments(uint256 circleId) internal {
        Circle storage c = _circles[circleId];
        Member[] storage members = _circleMembers[circleId];
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i].addr;
            if (!hasPaid[circleId][c.currentCycle][member]) {
                _handleMissedPayment(circleId, member);
            }
        }
    }

    function _maybeAwardFirstPot(address recipient, uint256 circleId) internal {
        if (address(achievements) != address(0) && !achievements.has(recipient, IKitpotAchievements.AchievementType.FirstPotReceived)) {
            try achievements.award(recipient, IKitpotAchievements.AchievementType.FirstPotReceived, circleId) {} catch {}
        }
    }

    function _maybeAwardCompletionAchievements(address member, uint256 missedPayments, uint256 circleId) internal {
        if (address(achievements) != address(0)) {
            if (!achievements.has(member, IKitpotAchievements.AchievementType.CircleCompleted)) {
                try achievements.award(member, IKitpotAchievements.AchievementType.CircleCompleted, circleId) {} catch {}
            }
            if (missedPayments == 0 && !achievements.has(member, IKitpotAchievements.AchievementType.PerfectCircle)) {
                try achievements.award(member, IKitpotAchievements.AchievementType.PerfectCircle, circleId) {} catch {}
            }
        }
    }

    function _depositFor(uint256 circleId, address member) internal {
        Circle storage c = _circles[circleId];
        require(!hasPaid[circleId][c.currentCycle][member], "Already paid this cycle");

        // Check if late
        uint256 cycleStart = cycleStartTimes[circleId][c.currentCycle];
        bool isLate = block.timestamp > (cycleStart + c.gracePeriod);

        // Apply late penalty from collateral
        if (isLate && c.latePenaltyBps > 0) {
            uint256 penalty = (c.contributionAmount * c.latePenaltyBps) / 10000;
            uint256 available = collateralBalance[circleId][member];
            uint256 actualPenalty = penalty > available ? available : penalty;
            if (actualPenalty > 0) {
                collateralBalance[circleId][member] -= actualPenalty;
                accumulatedFees[c.tokenAddress] += actualPenalty;
                emit LatePenaltyApplied(circleId, member, actualPenalty);
            }
        }

        // Transfer contribution
        IERC20(c.tokenAddress).safeTransferFrom(member, address(this), c.contributionAmount);
        hasPaid[circleId][c.currentCycle][member] = true;

        // Record in reputation
        reputation.recordPayment(member, circleId, c.currentCycle, !isLate);

        emit DepositMade(circleId, member, c.currentCycle, c.contributionAmount);
    }

    function _handleMissedPayment(uint256 circleId, address member) internal {
        Circle storage c = _circles[circleId];
        uint256 collateral = collateralBalance[circleId][member];

        if (collateral >= c.contributionAmount) {
            // Use collateral as payment
            collateralBalance[circleId][member] -= c.contributionAmount;
            hasPaid[circleId][c.currentCycle][member] = true;
            emit CollateralUsedForPayment(circleId, member, c.contributionAmount);
        } else {
            // Insufficient collateral — slash all remaining
            if (collateral > 0) {
                accumulatedFees[c.tokenAddress] += collateral;
                collateralBalance[circleId][member] = 0;
            }
            // Mark as paid anyway (collateral covered what it could)
            hasPaid[circleId][c.currentCycle][member] = true;
            emit MemberDefaulted(circleId, member, collateral);
        }

        // Record missed in reputation + track on member
        reputation.recordMissedPayment(member, circleId, c.currentCycle);
        Member[] storage mlist = _circleMembers[circleId];
        for (uint256 i = 0; i < mlist.length; i++) {
            if (mlist[i].addr == member) {
                mlist[i].missedPayments++;
                break;
            }
        }
    }

    /// @notice Claim collateral after circle completion
    function claimCollateral(uint256 circleId) external onlyMember(circleId) {
        require(_circles[circleId].status == CircleStatus.Completed, "Circle not completed");
        uint256 amount = collateralBalance[circleId][msg.sender];
        require(amount > 0, "No collateral");

        collateralBalance[circleId][msg.sender] = 0;
        IERC20(_circles[circleId].tokenAddress).safeTransfer(msg.sender, amount);

        emit CollateralReturned(circleId, msg.sender, amount);
    }

    // ============================================================
    //                     VIEW FUNCTIONS
    // ============================================================

    function getCircle(uint256 circleId) external view returns (Circle memory) {
        return _circles[circleId];
    }

    function getMembers(uint256 circleId) external view returns (Member[] memory) {
        return _circleMembers[circleId];
    }

    function getMemberByAddress(uint256 circleId, address addr) external view returns (Member memory) {
        require(isMember[circleId][addr], "Not a member");
        return _circleMembers[circleId][memberIndex[circleId][addr]];
    }

    function getCircleCount() external view returns (uint256) {
        return nextCircleId;
    }

    function allMembersPaid(uint256 circleId) external view returns (bool) {
        return _allMembersPaid(circleId);
    }

    function getCycleRecipient(uint256 circleId, uint256 cycleNumber) external view returns (address) {
        require(cycleNumber < _circles[circleId].totalCycles, "Invalid cycle");
        return _circleMembers[circleId][cycleNumber].addr;
    }

    function getCyclePaymentStatus(uint256 circleId)
        external view returns (address[] memory members, bool[] memory paid)
    {
        Circle storage c = _circles[circleId];
        Member[] storage memberList = _circleMembers[circleId];
        uint256 len = memberList.length;
        members = new address[](len);
        paid = new bool[](len);
        for (uint256 i = 0; i < len; i++) {
            members[i] = memberList[i].addr;
            paid[i] = hasPaid[circleId][c.currentCycle][memberList[i].addr];
        }
    }

    function getCurrentCycleInfo(uint256 circleId)
        external view
        returns (
            uint256 cycleNumber, uint256 cycleStartTime, uint256 cycleEndTime,
            address recipient, bool allPaid, bool canAdvance
        )
    {
        Circle storage c = _circles[circleId];
        cycleNumber = c.currentCycle;
        if (c.status == CircleStatus.Active) {
            cycleStartTime = cycleStartTimes[circleId][c.currentCycle];
            cycleEndTime = cycleStartTime + c.cycleDuration;
            recipient = _circleMembers[circleId][c.currentCycle].addr;
            allPaid = _allMembersPaid(circleId);
            canAdvance = block.timestamp >= cycleEndTime;
        }
    }

    /// @notice Returns timing info for the current cycle, used by frontend countdowns.
    function getCycleTiming(uint256 circleId) external view returns (CycleTiming memory timing) {
        Circle storage c = _circles[circleId];
        if (c.status != CircleStatus.Active || c.currentCycle >= c.totalCycles) {
            return timing; // zero-valued
        }
        timing.cycleStart = cycleStartTimes[circleId][c.currentCycle];
        timing.cycleEnd = timing.cycleStart + c.cycleDuration;
        timing.dormantDeadline = timing.cycleEnd + DORMANT_GRACE;
        timing.nowTs = block.timestamp;
        timing.recipient = _circleMembers[circleId][c.currentCycle].addr;
        timing.canRecipientClaim = block.timestamp >= timing.cycleEnd;
        timing.canSubstituteClaim = block.timestamp >= timing.dormantDeadline;
    }

    function getCollateral(uint256 circleId, address member) external view returns (uint256) {
        return collateralBalance[circleId][member];
    }

    function _allMembersPaid(uint256 circleId) internal view returns (bool) {
        Circle storage c = _circles[circleId];
        Member[] storage members = _circleMembers[circleId];
        for (uint256 i = 0; i < members.length; i++) {
            if (!hasPaid[circleId][c.currentCycle][members[i].addr]) return false;
        }
        return true;
    }

    // ============================================================
    //                    ADMIN FUNCTIONS
    // ============================================================

    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }

    function setReputation(address _reputation) external onlyOwner {
        reputation = IKitpotReputation(_reputation);
    }

    function setAchievements(address _achievements) external onlyOwner {
        achievements = IKitpotAchievements(_achievements);
    }

    function withdrawFees(address token) external onlyOwner {
        uint256 amount = accumulatedFees[token];
        require(amount > 0, "No fees");
        accumulatedFees[token] = 0;
        IERC20(token).safeTransfer(owner(), amount);
        emit FeesWithdrawn(token, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
