export const ACHIEVEMENTS_ABI = [
  {
    type: "function",
    name: "getAchievements",
    inputs: [{ name: "member", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "achievementCount",
    inputs: [{ name: "member", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "has",
    inputs: [
      { name: "member", type: "address" },
      { name: "aType", type: "uint8" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "achievements",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "achievementType", type: "uint8" },
      { name: "holder", type: "address" },
      { name: "earnedAt", type: "uint256" },
      { name: "circleId", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "achievementNames",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimEarlyAdopter",
    inputs: [{ name: "member", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
] as const;
