export const REPUTATION_ABI = [
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
] as const;
