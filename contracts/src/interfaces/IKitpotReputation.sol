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

    enum Level {
        Novice,      // 0 – 99 XP
        Apprentice,  // 100 – 499 XP
        Saver,       // 500 – 1499 XP
        Expert,      // 1500 – 3999 XP
        Master,      // 4000 – 9999 XP
        Legendary    // 10000+ XP
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
        // XP / gamification
        uint256 xp;
        uint256 questStreakDays;
        uint256 lastQuestClaimDay;
        address referrer;
        bool referralRewarded;
    }

    function recordPayment(address member, uint256 circleId, uint256 cycleNumber, bool onTime) external;
    function recordMissedPayment(address member, uint256 circleId, uint256 cycleNumber) external;
    function recordCircleJoined(address member, uint256 circleId) external;
    function recordCircleCompleted(address member, uint256 circleId) external;
    function recordPotReceived(address member, uint256 amount) external;
    function meetsMinimumTier(address member, TrustTier required) external view returns (bool);
    function getReputation(address member) external view returns (MemberReputation memory);
    function getTier(address member) external view returns (TrustTier);
    function getLevel(address member) external view returns (Level);
    function xpForNextLevel(address member) external view returns (uint256 needed, uint256 total);
    function claimDailyQuest() external returns (uint256 xpAwarded);
    function setReferrer(address member, address referrer) external;
    function rewardReferral(address referee) external;
}
