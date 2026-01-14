import { Intent } from "./intent";

// 交易历史记录
export interface TransactionHistory {
  id: string;
  intent: Intent;
  txHash?: `0x${string}`;
  status: "pending" | "success" | "failed";
  timestamp: number;
  chainId: number;
  walletAddress: string;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
}

// 历史记录存储键
const STORAGE_KEY = "tx_history";
const MAX_HISTORY = 100; // 最多保存100条记录

// 保存交易历史
export function saveTransactionHistory(history: TransactionHistory): void {
  if (typeof window === "undefined") return;

  try {
    const histories = getTransactionHistory();
    // 检查是否已存在（通过 id）
    const existingIndex = histories.findIndex((h) => h.id === history.id);
    
    if (existingIndex >= 0) {
      // 更新现有记录
      histories[existingIndex] = history;
    } else {
      // 添加新记录（插入到开头）
      histories.unshift(history);
    }
    
    // 只保留最近 MAX_HISTORY 条
    const limited = histories.slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error("Failed to save transaction history:", error);
  }
}

// 获取交易历史
export function getTransactionHistory(): TransactionHistory[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get transaction history:", error);
    return [];
  }
}

// 根据钱包地址过滤历史记录
export function getTransactionHistoryByWallet(
  walletAddress: string
): TransactionHistory[] {
  return getTransactionHistory().filter(
    (h) => h.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
}

// 清除历史记录
export function clearTransactionHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// 更新交易状态
export function updateTransactionStatus(
  id: string,
  updates: Partial<Pick<TransactionHistory, "status" | "txHash" | "error" | "gasUsed" | "blockNumber">>
): void {
  const histories = getTransactionHistory();
  const index = histories.findIndex((h) => h.id === id);
  
  if (index >= 0) {
    histories[index] = { ...histories[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
  }
}
