// Monad Staking Precompile ABI
// Contract Address: 0x0000000000000000000000000000000000001000
// Documentation: https://docs.monad.xyz/developer-essentials/staking/staking-precompile

export const monadStakingAbi = [
  // Delegate stake to a validator
  {
    type: "function",
    name: "delegate",
    stateMutability: "payable",
    inputs: [
      {
        name: "validator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
  },
  // Undelegate stake from a validator
  {
    type: "function",
    name: "undelegate",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "validator",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
  },
  // Withdraw undelegated stake (after unbonding period)
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "validator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
  },
  // Claim staking rewards
  {
    type: "function",
    name: "claimRewards",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "validator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
  },
  // Compound rewards (automatically restake)
  {
    type: "function",
    name: "compoundRewards",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "validator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
  },
  // Get delegator info
  {
    type: "function",
    name: "getDelegatorInfo",
    stateMutability: "view",
    inputs: [
      {
        name: "delegator",
        type: "address",
        internalType: "address",
      },
      {
        name: "validator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "stakedAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "pendingRewards",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
] as const;

// Monad Staking Precompile Contract Address
export const MONAD_STAKING_ADDRESS = "0x0000000000000000000000000000000000001000" as const;

// Default validator (you can update this with a trusted validator)
export const DEFAULT_VALIDATOR_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
