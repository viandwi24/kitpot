// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IKitpotReputation {
    enum TrustTier {
        Unranked,   // no history
        Bronze,     // 1+ circles, 70%+ on-time
        Silver,     // 3+ circles, 85%+ on-time
        Gold,       // 5+ circles, 95%+ on-time
        Diamond     // 10+ circles, 99%+ on-time, 0 missed
    }

    struct MemberReputation {
        uint256 totalCirclesJoined;
        uint256 totalCirclesCompleted;
        uint256 totalCyclesPaid;
        uint256 totalCyclesMissed;
        uint256 totalCyclesOnTime;
        uint256 totalPotReceived;
        uint256 totalContributed;
        uint256 consecutiveOnTime;
        uint256 longestStreak;
        uint256 lastActivityTimestamp;
        TrustTier tier;
    }

    function recordPayment(address member, uint256 circleId, uint256 cycleNumber, bool onTime) external;
    function recordMissedPayment(address member, uint256 circleId, uint256 cycleNumber) external;
    function recordCircleJoined(address member, uint256 circleId) external;
    function recordCircleCompleted(address member, uint256 circleId) external;
    function recordPotReceived(address member, uint256 amount) external;
    function meetsMinimumTier(address member, TrustTier required) external view returns (bool);
    function getReputation(address member) external view returns (MemberReputation memory);
    function getTier(address member) external view returns (TrustTier);
}
