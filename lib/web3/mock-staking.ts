/**
 * Mock Staking Pool Interactions
 * 用于模拟��押池交互，无需真实部署合约
 */

import { Address } from "viem";

export interface MockStakePosition {
  amount: string;
  token: string;
  yieldRecipient: string;
  timestamp: number;
  totalYieldSent: string;
}

// 模拟的质押数据存储
const mockStakes = new Map<string, MockStakePosition>();

export function mockStake(
  userAddress: Address,
  token: string,
  amount: string,
  yieldRecipient: Address
): { success: boolean; txHash?: string; position?: MockStakePosition } {
  console.log("🎭 [Mock Staking] Executing stake:");
  console.log("  User:", userAddress);
  console.log("  Token:", token);
  console.log("  Amount:", amount);
  console.log("  Yield Recipient:", yieldRecipient);

  const position: MockStakePosition = {
    amount,
    token,
    yieldRecipient,
    timestamp: Date.now(),
    totalYieldSent: "0",
  };

  mockStakes.set(`${userAddress}-${token}`, position);

  // 模拟交易延迟
  return {
    success: true,
    txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
    position,
  };
}

export function mockCollectYield(
  userAddress: Address,
  token: string
): { success: boolean; txHash?: string; yieldAmount?: string } {
  const key = `${userAddress}-${token}`;
  const position = mockStakes.get(key);

  if (!position) {
    return { success: false };
  }

  // 模拟收益：质押金额的 1%
  const yieldAmount = (parseFloat(position.amount) * 0.01).toString();
  position.totalYieldSent = (parseFloat(position.totalYieldSent) + parseFloat(yieldAmount)).toString();
  mockStakes.set(key, position);

  console.log("🎭 [Mock Staking] Collecting yield:");
  console.log("  From:", userAddress);
  console.log("  To:", position.yieldRecipient);
  console.log("  Yield Amount:", yieldAmount);

  return {
    success: true,
    txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
    yieldAmount,
  };
}

export function mockUnstake(
  userAddress: Address,
  token: string,
  amount: string
): { success: boolean; txHash?: string } {
  const key = `${userAddress}-${token}`;
  const position = mockStakes.get(key);

  if (!position) {
    return { success: false };
  }

  console.log("🎭 [Mock Staking] Unstaking:");
  console.log("  User:", userAddress);
  console.log("  Token:", token);
  console.log("  Amount:", amount);

  // 更新质押金额
  const newAmount = (parseFloat(position.amount) - parseFloat(amount)).toString();
  if (parseFloat(newAmount) < 0) {
    return { success: false };
  }

  position.amount = newAmount;
  mockStakes.set(key, position);

  return {
    success: true,
    txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
  };
}

export function mockGetStakeInfo(
  userAddress: Address,
  token: string
): MockStakePosition | null {
  return mockStakes.get(`${userAddress}-${token}`) || null;
}

export function mockCallFaucet(
  userAddress: Address
): { success: boolean; txHash?: string; amount?: string } {
  console.log("🎭 [Mock Faucet] Calling faucet for MONAD:");
  console.log("  To:", userAddress);
  console.log("  Amount: 100 MONAD");

  return {
    success: true,
    txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
    amount: "100",
  };
}
