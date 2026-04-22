// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IKitpotReputation.sol";

/// @title KitpotReputation — On-chain reputation registry for savings circle members
/// @notice Tracks payment behavior, trust tiers, XP/levels, daily quests, referrals
contract KitpotReputation is IKitpotReputation, Ownable {

    // ============================================================
    //                     STATE VARIABLES
    // ============================================================

    mapping(address => bool) public authorized;
    mapping(address => MemberReputation) internal _reputations;

    mapping(address => mapping(uint256 => bool)) public circleJoinRecorded;
    mapping(address => mapping(uint256 => bool)) public circleCompleteRecorded;

    // Tracks whether a member missed any payment in a given circle (for perfect-completion bonus)
    mapping(address => mapping(uint256 => bool)) public hadMissInCircle;

    // ============================================================
    //                         EVENTS
    // ============================================================

    event PaymentRecorded(address indexed member, uint256 indexed circleId, uint256 cycle, bool onTime);
    event MissedPaymentRecorded(address indexed member, uint256 indexed circleId, uint256 cycle);
    event CircleJoinedRecorded(address indexed member, uint256 indexed circleId);
    event CircleCompletedRecorded(address indexed member, uint256 indexed circleId);
    event TierUpdated(address indexed member, TrustTier oldTier, TrustTier newTier);
    event AuthorizedCaller(address indexed caller, bool status);

    event XPAwarded(address indexed member, uint256 amount, string reason, uint256 newTotal);
    event LevelUp(address indexed member, Level oldLevel, Level newLevel);
    event DailyQuestClaimed(address indexed member, uint256 streakDays, uint256 xpAwarded);
    event ReferralRegistered(address indexed member, address indexed referrer);
    event ReferralRewarded(address indexed referee, address indexed referrer, uint256 xpEach);

    // ============================================================
    //                       MODIFIERS
    // ============================================================

    modifier onlyAuthorized() {
        require(authorized[msg.sender], "Not authorized");
        _;
    }

    // ============================================================
    //                      CONSTRUCTOR
    // ============================================================

    constructor() Ownable(msg.sender) {}

    // ============================================================
    //                    ADMIN FUNCTIONS
    // ============================================================

    function setAuthorized(address caller, bool status) external onlyOwner {
        authorized[caller] = status;
        emit AuthorizedCaller(caller, status);
    }

    // ============================================================
    //                   RECORDING FUNCTIONS
    // ============================================================

    function recordPayment(
        address member,
        uint256 circleId,
        uint256 cycleNumber,
        bool onTime
    ) external onlyAuthorized {
        MemberReputation storage rep = _reputations[member];

        rep.totalCyclesPaid++;
        rep.lastActivityTimestamp = block.timestamp;

        if (onTime) {
            rep.totalCyclesOnTime++;
            rep.consecutiveOnTime++;
            if (rep.consecutiveOnTime > rep.longestStreak) {
                rep.longestStreak = rep.consecutiveOnTime;
            }
            _awardXP(member, 10, "On-time payment");
        } else {
            rep.consecutiveOnTime = 0;
            _awardXP(member, 3, "Late payment");
        }

        // Referral reward: fires once on referee's first on-time deposit
        if (onTime && rep.referrer != address(0) && !rep.referralRewarded) {
            rep.referralRewarded = true;
            _awardXP(member, 50, "Referral bonus");
            _awardXP(rep.referrer, 50, "Referral bonus");
            emit ReferralRewarded(member, rep.referrer, 50);
        }

        _recalculateTier(member);
        emit PaymentRecorded(member, circleId, cycleNumber, onTime);
    }

    function recordMissedPayment(
        address member,
        uint256 circleId,
        uint256 cycleNumber
    ) external onlyAuthorized {
        MemberReputation storage rep = _reputations[member];

        rep.totalCyclesMissed++;
        rep.consecutiveOnTime = 0;
        rep.lastActivityTimestamp = block.timestamp;
        hadMissInCircle[member][circleId] = true;

        _recalculateTier(member);
        emit MissedPaymentRecorded(member, circleId, cycleNumber);
    }

    function recordCircleJoined(address member, uint256 circleId) external onlyAuthorized {
        if (circleJoinRecorded[member][circleId]) return;
        circleJoinRecorded[member][circleId] = true;

        _reputations[member].totalCirclesJoined++;
        _reputations[member].lastActivityTimestamp = block.timestamp;

        _awardXP(member, 20, "Circle joined");
        emit CircleJoinedRecorded(member, circleId);
    }

    function recordCircleCompleted(address member, uint256 circleId) external onlyAuthorized {
        if (circleCompleteRecorded[member][circleId]) return;
        circleCompleteRecorded[member][circleId] = true;

        _reputations[member].totalCirclesCompleted++;
        _reputations[member].lastActivityTimestamp = block.timestamp;

        // Perfect completion = no misses → +200 XP, otherwise +100 XP
        uint256 xpAmount = hadMissInCircle[member][circleId] ? 100 : 200;
        _awardXP(member, xpAmount, "Circle completed");

        _recalculateTier(member);
        emit CircleCompletedRecorded(member, circleId);
    }

    function recordPotReceived(address member, uint256 amount) external onlyAuthorized {
        _reputations[member].totalPotReceived += amount;
        _awardXP(member, 100, "Pot received");
    }

    // ============================================================
    //                   DAILY QUEST
    // ============================================================

    function claimDailyQuest() external returns (uint256 xpAwarded) {
        MemberReputation storage rep = _reputations[msg.sender];
        uint256 today = block.timestamp / 1 days;
        require(today > rep.lastQuestClaimDay, "Already claimed today");

        if (today == rep.lastQuestClaimDay + 1) {
            rep.questStreakDays++;
        } else {
            rep.questStreakDays = 1;
        }
        rep.lastQuestClaimDay = today;

        xpAwarded = 25;
        _awardXP(msg.sender, xpAwarded, "Daily quest");
        emit DailyQuestClaimed(msg.sender, rep.questStreakDays, xpAwarded);
    }

    // ============================================================
    //                   REFERRAL
    // ============================================================

    function setReferrer(address member, address referrer) external onlyAuthorized {
        MemberReputation storage rep = _reputations[member];
        if (rep.referrer != address(0)) return; // already set
        if (referrer == address(0) || referrer == member) return;

        rep.referrer = referrer;
        emit ReferralRegistered(member, referrer);
    }

    /// @notice Explicit external trigger (kept for interface compat, referral auto-fires in recordPayment)
    function rewardReferral(address referee) external onlyAuthorized {
        MemberReputation storage rep = _reputations[referee];
        if (rep.referrer == address(0) || rep.referralRewarded) return;

        rep.referralRewarded = true;
        _awardXP(referee, 50, "Referral bonus");
        _awardXP(rep.referrer, 50, "Referral bonus");
        emit ReferralRewarded(referee, rep.referrer, 50);
    }

    // ============================================================
    //                   TIER CALCULATION
    // ============================================================

    function _recalculateTier(address member) internal {
        MemberReputation storage rep = _reputations[member];
        TrustTier oldTier = rep.tier;
        TrustTier newTier = _calculateTier(rep);

        if (newTier != oldTier) {
            rep.tier = newTier;
            emit TierUpdated(member, oldTier, newTier);
        }
    }

    function _calculateTier(MemberReputation storage rep) internal view returns (TrustTier) {
        uint256 completed = rep.totalCirclesCompleted;
        uint256 onTimeRate = _getOnTimeRate(rep);

        if (completed >= 10 && onTimeRate >= 99 && rep.totalCyclesMissed == 0) {
            return TrustTier.Diamond;
        }
        if (completed >= 5 && onTimeRate >= 95) {
            return TrustTier.Gold;
        }
        if (completed >= 3 && onTimeRate >= 85) {
            return TrustTier.Silver;
        }
        if (completed >= 1 && onTimeRate >= 70) {
            return TrustTier.Bronze;
        }

        return TrustTier.Unranked;
    }

    function _getOnTimeRate(MemberReputation storage rep) internal view returns (uint256) {
        uint256 totalRelevant = rep.totalCyclesOnTime + rep.totalCyclesMissed;
        if (totalRelevant == 0) return 100;
        return (rep.totalCyclesOnTime * 100) / totalRelevant;
    }

    // ============================================================
    //                   XP & LEVEL INTERNALS
    // ============================================================

    function _awardXP(address member, uint256 amount, string memory reason) internal {
        MemberReputation storage rep = _reputations[member];
        Level oldLevel = _calcLevel(rep.xp);
        rep.xp += amount;
        Level newLevel = _calcLevel(rep.xp);

        emit XPAwarded(member, amount, reason, rep.xp);

        if (newLevel != oldLevel) {
            emit LevelUp(member, oldLevel, newLevel);
        }
    }

    function _calcLevel(uint256 xp) internal pure returns (Level) {
        if (xp >= 10000) return Level.Legendary;
        if (xp >= 4000) return Level.Master;
        if (xp >= 1500) return Level.Expert;
        if (xp >= 500) return Level.Saver;
        if (xp >= 100) return Level.Apprentice;
        return Level.Novice;
    }

    // ============================================================
    //                    VIEW FUNCTIONS
    // ============================================================

    function meetsMinimumTier(address member, TrustTier required) external view returns (bool) {
        if (required == TrustTier.Unranked) return true;
        return uint8(_reputations[member].tier) >= uint8(required);
    }

    function getReputation(address member) external view returns (MemberReputation memory) {
        return _reputations[member];
    }

    function getTier(address member) external view returns (TrustTier) {
        return _reputations[member].tier;
    }

    function getLevel(address member) external view returns (Level) {
        return _calcLevel(_reputations[member].xp);
    }

    function xpForNextLevel(address member) external view returns (uint256 needed, uint256 total) {
        uint256 xp = _reputations[member].xp;
        Level lvl = _calcLevel(xp);
        uint256[6] memory thresholds = [uint256(0), 100, 500, 1500, 4000, 10000];
        uint256 nextIdx = uint8(lvl) + 1;
        if (nextIdx >= 6) {
            return (0, thresholds[5]); // already Legendary
        }
        total = thresholds[nextIdx];
        needed = total > xp ? total - xp : 0;
    }

    function getOnTimeRate(address member) external view returns (uint256) {
        return _getOnTimeRate(_reputations[member]);
    }

    function getStreak(address member) external view returns (uint256 current, uint256 longest) {
        MemberReputation storage rep = _reputations[member];
        return (rep.consecutiveOnTime, rep.longestStreak);
    }
}
