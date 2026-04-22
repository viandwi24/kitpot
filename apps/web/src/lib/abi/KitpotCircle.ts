/// ABI for KitpotCircle contract.
/// NOTE: Replace with compiled ABI from contracts/out/ after `forge build` in Plan 10.
export const KITPOT_ABI = [
  // Circle Creation & Joining
  {
    type: "function",
    name: "createCircle",
    inputs: [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "tokenAddress", type: "address" },
      { name: "contributionAmount", type: "uint256" },
      { name: "maxMembers", type: "uint256" },
      { name: "cycleDuration", type: "uint256" },
      { name: "gracePeriod", type: "uint256" },
      { name: "latePenaltyBps", type: "uint256" },
      { name: "isPublic", type: "bool" },
      { name: "minimumTier", type: "uint8" },
    ],
    outputs: [{ name: "circleId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "joinCircle",
    inputs: [
      { name: "circleId", type: "uint256" },
      { name: "initUsername", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // Payments & Distribution
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "circleId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "advanceCycle",
    inputs: [{ name: "circleId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // Auto-Signing Sessions
  {
    type: "function",
    name: "authorizeSession",
    inputs: [
      { name: "operator", type: "address" },
      { name: "circleId", type: "uint256" },
      { name: "maxAmountPerCycle", type: "uint256" },
      { name: "expiry", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeSession",
    inputs: [{ name: "operator", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositOnBehalf",
    inputs: [
      { name: "circleId", type: "uint256" },
      { name: "member", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "batchDeposit",
    inputs: [{ name: "circleId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // View Functions
  {
    type: "function",
    name: "getCircle",
    inputs: [{ name: "circleId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "creator", type: "address" },
          { name: "tokenAddress", type: "address" },
          { name: "contributionAmount", type: "uint256" },
          { name: "maxMembers", type: "uint256" },
          { name: "totalCycles", type: "uint256" },
          { name: "currentCycle", type: "uint256" },
          { name: "cycleDuration", type: "uint256" },
          { name: "gracePeriod", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "memberCount", type: "uint256" },
          { name: "latePenaltyBps", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "isPublic", type: "bool" },
          { name: "minimumTier", type: "uint8" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMembers",
    inputs: [{ name: "circleId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "addr", type: "address" },
          { name: "initUsername", type: "string" },
          { name: "joinedAt", type: "uint256" },
          { name: "hasReceivedPot", type: "bool" },
          { name: "turnOrder", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCircleCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allMembersPaid",
    inputs: [{ name: "circleId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCycleRecipient",
    inputs: [
      { name: "circleId", type: "uint256" },
      { name: "cycleNumber", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCyclePaymentStatus",
    inputs: [{ name: "circleId", type: "uint256" }],
    outputs: [
      { name: "members", type: "address[]" },
      { name: "paid", type: "bool[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurrentCycleInfo",
    inputs: [{ name: "circleId", type: "uint256" }],
    outputs: [
      { name: "cycleNumber", type: "uint256" },
      { name: "cycleStartTime", type: "uint256" },
      { name: "cycleEndTime", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "allPaid", type: "bool" },
      { name: "canAdvance", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCollateral",
    inputs: [
      { name: "circleId", type: "uint256" },
      { name: "member", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimCollateral",
    inputs: [{ name: "circleId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "hasPaid",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isMember",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isSessionValid",
    inputs: [
      { name: "member", type: "address" },
      { name: "operator", type: "address" },
      { name: "circleId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sessions",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    outputs: [
      { name: "circleId", type: "uint256" },
      { name: "maxAmountPerCycle", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextCircleId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformFeeBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  // Events
  {
    type: "event",
    name: "CircleCreated",
    inputs: [
      { name: "circleId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "contributionAmount", type: "uint256", indexed: false },
      { name: "maxMembers", type: "uint256", indexed: false },
      { name: "cycleDuration", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MemberJoined",
    inputs: [
      { name: "circleId", type: "uint256", indexed: true },
      { name: "member", type: "address", indexed: true },
      { name: "initUsername", type: "string", indexed: false },
      { name: "turnOrder", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CircleActivated",
    inputs: [
      { name: "circleId", type: "uint256", indexed: true },
      { name: "startTime", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DepositMade",
    inputs: [
      { name: "circleId", type: "uint256", indexed: true },
      { name: "member", type: "address", indexed: true },
      { name: "cycleNumber", type: "uint256", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PotDistributed",
    inputs: [
      { name: "circleId", type: "uint256", indexed: true },
      { name: "cycleNumber", type: "uint256", indexed: false },
      { name: "recipient", type: "address", indexed: true },
      { name: "potAmount", type: "uint256", indexed: false },
      { name: "feeAmount", type: "uint256", indexed: false },
    ],
  },
] as const;
