# 钱包交互层使用指南

本文档介绍如何使用钱包交互层来执行区块链交易和查询余额。

## 📁 文件结构

<!-- Overview inserted by assistant: key files, responsibilities, and call relationships -->

**文件关联概览（快速参考）**

- `lib/web3/config.ts` : 应用的链与钱包配置（RainbowKit + wagmi），定义支持网络与传输。
- `lib/web3/tokens.ts` : 代币元数据表与查询工具，按 `chainId` 组织 `TOKENS`。
- `lib/web3/abi/*` : 合约 ABI（ERC20、Uniswap V3 Router、Aave V3 Pool），供构建交易和读取数据使用。
- `lib/web3/balance-checker.ts` : 封装原生币与 ERC20 的读取逻辑（余额、allowance、钱包摘要、格式化）。
- `lib/web3/transaction-builder.ts` : 将高层 `Intent` 翻译为 `PreparedTransaction[]`（approve、swap、supply、withdraw、transfer 等）。
- `hooks/useWalletInteractions.ts` : Hook 层，负责：
  - 调用 `transaction-builder` 构建交易；
  - 使用 wagmi 的 `sendTransactionAsync` 发送交易并用 `publicClient` 等待确认；
  - 提供余额查询封装给 UI 使用并维护 `txState`。
- `types/intent.ts` : 定义 `Intent`、`PreparedTransaction`、`TransactionType`、`ExecutionResult` 等类型契约。
- `components/*` : UI 层（例如 `TransactionCard.tsx`、聊天组件）负责生成或触发 `Intent` 并展示 `txState`。

**简化调用流程**

1. UI（TransactionCard / Chat）构建或触发一个 `Intent`。
2. 调用 `useWalletInteractions.executeIntent(intent)`。
3. Hook 使用 `transaction-builder` 生成 `PreparedTransaction[]`。
4. Hook 将每个 `PreparedTransaction` 通过 wagmi 发送（`sendTransactionAsync`），并通过 `publicClient.waitForTransactionReceipt` 等待确认，期间更新 `txState`。
5. 读操作（余额/allowance）由 `lib/web3/balance-checker.ts` 提供，或通过 wagmi 的 `useReadContract`/`useBalance`。

将上述概览放在文档顶部，可以快速定位文件职责与调用关系，便于学习和改动代码时参考。


```
lib/web3/
├── abi/
│   ├── erc20.ts              # ERC20 Token ABI
│   ├── uniswap-v3-router.ts  # Uniswap V3 Router ABI
│   └── aave-v3-pool.ts       # Aave V3 Pool ABI
├── config.ts                 # Wagmi 配置
├── tokens.ts                 # Token 配置
├── transaction-builder.ts    # 交易构建器
└── balance-checker.ts        # 余额查询工具

hooks/
└── useWalletInteractions.ts  # 钱包交互 Hook
```

##

## 🚀 核心功能

### 1. 使用 Hook 执行交易

```typescript
import { useWalletInteractions } from "@/hooks/useWalletInteractions";

function MyComponent() {
  const { executeIntent, txState, isConnected } = useWalletInteractions();

  const handleSwap = async () => {
    const intent: SwapIntent = {
      id: "swap-1",
      type: "swap",
      status: "pending",
      createdAt: Date.now(),
      params: {
        fromToken: "USDC",
        toToken: "ETH",
        amount: "100",
        slippage: 0.5,
      },
    };

    const result = await executeIntent(intent);

    if (result.success) {
      console.log("交易成功!", result.txHashes);
    } else {
      console.error("交易失败:", result.error);
    }
  };

  return (
    <button onClick={handleSwap} disabled={!isConnected || txState.isExecuting}>
      {txState.isExecuting ? "执行中..." : "执行 Swap"}
    </button>
  );
}
```

### 2. 批量执行交易

```typescript
const { executeTransactions } = useWalletInteractions();

const transactions: PreparedTransaction[] = [
  {
    id: "approve-1",
    type: "approve",
    to: "0x...",
    data: "0x...",
    value: 0n,
    description: "Approve USDC",
  },
  {
    id: "swap-1",
    type: "swap",
    to: "0x...",
    data: "0x...",
    value: 0n,
    description: "Swap USDC to ETH",
  },
];

const result = await executeTransactions(transactions);
```

### 3. 查询余额

```typescript
import { getWalletSummary, getTokenBalance } from "@/lib/web3/balance-checker";

// 查询钱包摘要
const summary = await getWalletSummary(publicClient, chainId, address);
console.log("ETH 余额:", summary.nativeBalance);
console.log("代币余额:", summary.tokenBalances);

// 查询单个代币余额
const usdcBalance = await getTokenBalance(publicClient, chainId, "USDC", address);
console.log("USDC 余额:", usdcBalance.formatted);
```

### 4. 使用 TransactionCard 组件

```typescript
import { TransactionCard } from "@/components/transaction/TransactionCard";

function TransactionList({ intents }: { intents: Intent[] }) {
  return (
    <div>
      {intents.map((intent) => (
        <TransactionCard
          key={intent.id}
          intent={intent}
          onExecutionComplete={(success, txHashes) => {
            if (success) {
              console.log("交易完成:", txHashes);
            }
          }}
        />
      ))}
    </div>
  );
}
```

## 🔧 交易构建器

交易构建器提供了构建各类交易的方法：

### Swap 交易

```typescript
import { buildSwapTransaction } from "@/lib/web3/transaction-builder";

const transactions = await buildSwapTransaction(
  intent,
  walletAddress,
  chainId
);

// 返回的交易数组:
// 1. Approve 交易 (如果需要)
// 2. Swap 交易
```

### Supply 交易 (Aave)

```typescript
import { buildSupplyTransaction } from "@/lib/web3/transaction-builder";

const transactions = await buildSupplyTransaction(
  intent,
  walletAddress,
  chainId
);

// 返回的交易数组:
// 1. Approve 交易 (如果需要)
// 2. Supply 交易
```

### Withdraw 交易 (Aave)

```typescript
import { buildWithdrawTransaction } from "@/lib/web3/transaction-builder";

const transactions = await buildWithdrawTransaction(
  intent,
  walletAddress,
  chainId
);
```

### Transfer 交易

```typescript
import { buildTransferTransaction } from "@/lib/web3/transaction-builder";

const transactions = await buildTransferTransaction(
  intent,
  walletAddress,
  chainId
);
```

## 📊 余额查询工具

### 主要函数

```typescript
// 查询原生代币余额
const balance = await getNativeBalance(publicClient, address);

// 查询 ERC20 代币余额
const balance = await getERC20Balance(publicClient, tokenAddress, ownerAddress);

// 查询单个代币余额（带格式化）
const balanceInfo = await getTokenBalance(publicClient, chainId, "USDC", address);

// 查询所有代币余额
const balances = await getAllTokenBalances(publicClient, chainId, address);

// 查询授权额度
const allowance = await getAllowance(publicClient, tokenAddress, ownerAddress, spenderAddress);

// 检查授权额度是否足够
const hasEnough = await hasSufficientAllowance(
  publicClient,
  tokenAddress,
  ownerAddress,
  spenderAddress,
  requiredAmount
);

// 查询钱包摘要
const summary = await getWalletSummary(publicClient, chainId, address);
```

## 🎯 支持的交易类型

1. **Swap** - 通过 Uniswap V3 进行代币兑换
2. **Supply** - 存入代币到 Aave V3
3. **Withdraw** - 从 Aave V3 取出代币
4. **Transfer** - 转账代币到其他地址
5. **Check Balance** - 查询余额（无需交易）

## 🔗 支持的网络

- Ethereum Sepolia (11155111)
- Base Sepolia (84532)
- Arbitrum Sepolia (421614)

## ⚙️ 配置

### 添加新的 Token

在 `lib/web3/tokens.ts` 中添加：

```typescript
export const TOKENS: Record<number, Record<string, TokenInfo>> = {
  11155111: {
    YOUR_TOKEN: {
      symbol: "TOKEN",
      name: "Your Token",
      decimals: 18,
      address: "0x..." as Address,
    },
  },
};
```

### 添加新的网络

在 `lib/web3/config.ts` 和 `lib/web3/transaction-builder.ts` 中添加网络配置。

## 🛡️ 安全注意事项

1. **永远不要在交易数据中硬编码私钥**
2. **所有敏感操作都需要用户在钱包中确认**
3. **使用 `maxUint256` 授权时要谨慎**
4. **在主网使用前务必在测试网充分测试**
5. **验证所有合约地址**

## 📝 示例：完整的交易流程

```typescript
import { useWalletInteractions } from "@/hooks/useWalletInteractions";

function TradingExample() {
  const { executeIntent, txState } = useWalletInteractions();

  const executeTrade = async () => {
    // 1. 定义意图
    const intent: SwapIntent = {
      id: "swap-1",
      type: "swap",
      status: "pending",
      createdAt: Date.now(),
      params: {
        fromToken: "USDC",
        toToken: "ETH",
        amount: "100",
        slippage: 0.5,
      },
    };

    // 2. 执行交易
    const result = await executeIntent(intent);

    // 3. 处理结果
    if (result.success) {
      console.log("✅ 交易成功!");
      console.log("交易哈希:", result.txHashes);
    } else {
      console.error("❌ 交易失败:", result.error);
    }
  };

  return (
    <div>
      <div>状态: {txState.isExecuting ? "执行中..." : "就绪"}</div>
      <div>当前步骤: {txState.currentStep} / {txState.totalSteps}</div>
      {txState.error && <div>错误: {txState.error}</div>}
      <button onClick={executeTrade}>执行交易</button>
    </div>
  );
}
```

## 🐛 调试技巧

1. **使用测试网**: 在 Sepolia、Base Sepolia 等测试网测试
2. **查看交易哈希**: 在区块浏览器中查看交易详情
3. **检查授权额度**: 确认代币授权是否正确
4. **验证 Gas 限制**: 确保有足够的 ETH 支付 Gas
5. **测试小额交易**: 先用小额测试，确保逻辑正确

## 📚 相关资源

- [wagmi 文档](https://wagmi.sh)
- [viem 文档](https://viem.sh)
- [RainbowKit 文档](https://www.rainbowkit.com)
- [Uniswap V3 文档](https://docs.uniswap.org)
- [Aave V3 文档](https://docs.aave.com)
