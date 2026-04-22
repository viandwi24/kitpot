// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IKitpotReputation.sol";

/// @title KitpotReputation — On-chain reputation registry for savings circle members
/// @notice Tracks payment behavior, calculates trust tiers, gates access to circles
contract KitpotReputation is IKitpotReputation, Ownable {

    // ============================================================
    //                     STATE VARIABLES
    // ============================================================

    /// @notice Authorized callers (KitpotCircle contract)
    mapping(address => bool) public authorized;

    /// @notice Reputation data per member
    mapping(address => MemberReputation) internal _reputations;

    /// @notice Track which circles a member has been recorded for (prevent double-counting)
    mapping(address => mapping(uint256 => bool)) public circleJoinRecorded;
    mapping(address => mapping(uint256 => bool)) public circleCompleteRecorded;

    // ============================================================
    //                         EVENTS
    // ============================================================

    event PaymentRecorded(address indexed member, uint256 indexed circleId, uint256 cycle, bool onTime);
    event MissedPaymentRecorded(address indexed member, uint256 indexed circleId, uint256 cycle);
    event CircleJoinedRecorded(address indexed member, uint256 indexed circleId);
    event CircleCompletedRecorded(address indexed member, uint256 indexed circleId);
    event TierUpdated(address indexed member, TrustTier oldTier, TrustTier newTier);
    event AuthorizedCaller(address indexed caller, bool status);

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

    /// @notice Record a payment (on-time or late)
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
        } else {
            // Late but still paid — reset streak
            rep.consecutiveOnTime = 0;
        }

        _recalculateTier(member);
        emit PaymentRecorded(member, circleId, cycleNumber, onTime);
    }

    /// @notice Record a completely missed payment
    function recordMissedPayment(
        address member,
        uint256 circleId,
        uint256 cycleNumber
    ) external onlyAuthorized {
        MemberReputation storage rep = _reputations[member];

        rep.totalCyclesMissed++;
        rep.consecutiveOnTime = 0;
        rep.lastActivityTimestamp = block.timestamp;

        _recalculateTier(member);
        emit MissedPaymentRecorded(member, circleId, cycleNumber);
    }

    /// @notice Record member joining a circle
    function recordCircleJoined(address member, uint256 circleId) external onlyAuthorized {
        if (circleJoinRecorded[member][circleId]) return; // idempotent
        circleJoinRecorded[member][circleId] = true;

        _reputations[member].totalCirclesJoined++;
        _reputations[member].lastActivityTimestamp = block.timestamp;

        emit CircleJoinedRecorded(member, circleId);
    }

    /// @notice Record member completing a circle
    function recordCircleCompleted(address member, uint256 circleId) external onlyAuthorized {
        if (circleCompleteRecorded[member][circleId]) return; // idempotent
        circleCompleteRecorded[member][circleId] = true;

        _reputations[member].totalCirclesCompleted++;
        _reputations[member].lastActivityTimestamp = block.timestamp;

        _recalculateTier(member);
        emit CircleCompletedRecorded(member, circleId);
    }

    /// @notice Record pot received amount
    function recordPotReceived(address member, uint256 amount) external onlyAuthorized {
        _reputations[member].totalPotReceived += amount;
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

        // Diamond: 10+ circles, 99%+ on-time, 0 missed
        if (completed >= 10 && onTimeRate >= 99 && rep.totalCyclesMissed == 0) {
            return TrustTier.Diamond;
        }
        // Gold: 5+ circles, 95%+ on-time
        if (completed >= 5 && onTimeRate >= 95) {
            return TrustTier.Gold;
        }
        // Silver: 3+ circles, 85%+ on-time
        if (completed >= 3 && onTimeRate >= 85) {
            return TrustTier.Silver;
        }
        // Bronze: 1+ circles, 70%+ on-time
        if (completed >= 1 && onTimeRate >= 70) {
            return TrustTier.Bronze;
        }

        return TrustTier.Unranked;
    }

    function _getOnTimeRate(MemberReputation storage rep) internal view returns (uint256) {
        uint256 totalRelevant = rep.totalCyclesOnTime + rep.totalCyclesMissed;
        if (totalRelevant == 0) return 100; // no data = assume perfect
        return (rep.totalCyclesOnTime * 100) / totalRelevant;
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

    function getOnTimeRate(address member) external view returns (uint256) {
        return _getOnTimeRate(_reputations[member]);
    }

    function getStreak(address member) external view returns (uint256 current, uint256 longest) {
        MemberReputation storage rep = _reputations[member];
        return (rep.consecutiveOnTime, rep.longestStreak);
    }
}
