export const REPUTATION_ABI = [
  // ── Views ──
  {
    type: "function",
    name: "getReputation",
    inputs: [{ name: "member", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "totalCirclesJoined", type: "uint256" },
          { name: "totalCirclesCompleted", type: "uint256" },
          { name: "totalCyclesPaid", type: "uint256" },
          { name: "totalCyclesMissed", type: "uint256" },
          { name: "totalCyclesOnTime", type: "uint256" },
          { name: "totalPotReceived", type: "uint256" },
          { name: "totalContributed", type: "uint256" },
          { name: "consecutiveOnTime", type: "uint256" },
          { name: "longestStreak", type: "uint256" },
          { name: "lastActivityTimestamp", type: "uint256" },
          { name: "tier", type: "uint8" },
          { name: "xp", type: "uint256" },
          { name: "questStreakDays", type: "uint256" },
          { name: "lastQuestClaimDay", type: "uint256" },
          { name: "referrer", type: "address" },
          { name: "referralRewarded", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTier",
    inputs: [{ name: "member", type: "address" }],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLevel",
    inputs: [{ name: "member", type: "address" }],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "xpForNextLevel",
    inputs: [{ name: "member", type: "address" }],
    outputs: [
      { name: "needed", type: "uint256" },
      { name: "total", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOnTimeRate",
    inputs: [{ name: "member", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStreak",
    inputs: [{ name: "member", type: "address" }],
    outputs: [
      { name: "current", type: "uint256" },
      { name: "longest", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "meetsMinimumTier",
    inputs: [
      { name: "member", type: "address" },
      { name: "required", type: "uint8" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  // ── Mutations ──
  {
    type: "function",
    name: "claimDailyQuest",
    inputs: [],
    outputs: [{ name: "xpAwarded", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setReferrer",
    inputs: [
      { name: "member", type: "address" },
      { name: "referrer", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rewardReferral",
    inputs: [{ name: "referee", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ── Events ──
  {
    type: "event",
    name: "XPAwarded",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "reason", type: "string", indexed: false },
      { name: "newTotal", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "LevelUp",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "oldLevel", type: "uint8", indexed: false },
      { name: "newLevel", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DailyQuestClaimed",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "streakDays", type: "uint256", indexed: false },
      { name: "xpAwarded", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ReferralRegistered",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "referrer", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "ReferralRewarded",
    inputs: [
      { name: "referee", type: "address", indexed: true },
      { name: "referrer", type: "address", indexed: true },
      { name: "xpEach", type: "uint256", indexed: false },
    ],
  },
] as const;
