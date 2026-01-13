# Monad 生态迁移文档

## 概述

项目从 Aave V3 (Base/Arbitrum) 迁移到 Monad 生态，使用 Curvance 作为借贷协议，并支持 Monad Native Staking。

## 迁移背景

### 原架构

- **借贷协议**: Aave V3
- **支持链**: Base Sepolia, Arbitrum Sepolia, Ethereum Sepolia
- **Swap**: 0x/1inch API

### 目标架构

- **借贷协议**: Curvance (Monad 原生)
- **支持链**: Monad Testnet
- **Swap**: Uniswap v4 (Monad)
- **质押**: Monad Native Staking

## Monad 生态介绍

### Monad 链特性

- **类型**: Layer 1 (L1) 区块链
- **兼容性**: EVM 兼容
- **特点**: 高性能、低 Gas 费
- **测试网**: Monad Testnet (Chain ID: 10143)

### Curvance 协议

- **定位**: Monad 生态的借贷协议（类似 Aave）
- **功能**: 存款赚取利息、借款、抵押
- **代币**: cToken (如 cUSDC, cMON)

### Monad Native Staking

- **类型**: 原生质押（非 Liquid Staking）
- **收益**: 直接质押 MON 获得收益
- **代币**: shMON (Staked MON)

## 迁移计划

### Phase 1: 网络层迁移

**目标**: 配置 Monad Testnet 网络

**修改文件**:
- `lib/web3/config.ts` - 链配置
- `lib/web3/tokens.ts` - 代币地址

**关键配置**:

```typescript
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://explorer.monad.xyz",
    },
  },
  testnet: true,
});
```

### Phase 2: Curvance 协议集成

**目标**: 实现 Curvance 交互逻辑

**新增文件**:
- `lib/web3/abi/curvance.ts` - Curvance 合约 ABI
- `lib/web3/curvance.ts` - Curvance 交互函数

**核心接口**:

```typescript
export async function buildSupplyTx(
  params: SupplyParams,
  userAddress: Address,
  chainId: number
): Promise<PreparedTransaction[]>;

export async function buildWithdrawTx(
  params: WithdrawParams,
  userAddress: Address,
  chainId: number
): Promise<PreparedTransaction[]>;
```

### Phase 3: AI 意图层适配

**目标**: 更新 AI 工具定义和提示词

**修改文件**:
- `lib/ai/tools.ts` - 工具定义
- `lib/ai/prompts.ts` - 系统提示词
- `app/api/chat/route.ts` - 意图映射

**关键变更**:

```typescript
// 从 supply_to_aave 改为 supply_to_curvance
{
  name: "supply_to_curvance",
  description: "Supply/deposit tokens to Curvance lending protocol on Monad to earn interest.",
  // ...
}
```

### Phase 4: 测试验证

**目标**: 更新测试用例并验证

**修改文件**:
- `test/intent-test-cases.json` - 测试用例
- `test/test-api.js` - 测试脚本

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `lib/web3/config.ts` | 修改 | 替换为 Monad 链配置 |
| `lib/web3/tokens.ts` | 修改 | 添加 Monad Token 地址 |
| `lib/web3/abi/curvance.ts` | 新增 | Curvance 合约 ABI |
| `lib/web3/curvance.ts` | 新增 | Curvance 交互模块 |
| `lib/ai/prompts.ts` | 修改 | Aave → Curvance |
| `lib/ai/tools.ts` | 修改 | 更新工具定义 |
| `app/api/chat/route.ts` | 修改 | 更新意图映射 |
| `app/api/transaction/route.ts` | 修改 | 集成 Curvance 交易构建 |
| `test/intent-test-cases.json` | 修改 | 更新测试用例 |

## 代币配置

### Monad Testnet 代币

| 代币 | 符号 | 地址 | 小数位 |
|------|------|------|--------|
| Monad | MON | Native | 18 |
| Wrapped Monad | WMON | 0x... | 18 |
| USD Coin | USDC | 0x... | 6 |
| Tether USD | USDT | 0x... | 6 |
| Dai Stablecoin | DAI | 0x... | 18 |

**注意**: 部分代币地址为占位符，需要从 Monad 测试网获取实际地址。

## 风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Curvance 合约地址/ABI 未公开 | 阻塞 Phase 2 | 先用 Mock 实现，待信息公开后替换 |
| Monad Testnet RPC 不稳定 | 影响测试 | 准备备用 RPC endpoint |
| Token 地址未知 | 阻塞交易 | 先用占位符，后续更新 |
| Uniswap v4 未部署 | 影响 Swap | 使用其他 DEX 或聚合器 |

## 待办事项

- [ ] 确认 Monad Testnet Chain ID 和 RPC URL
- [ ] 获取 Curvance 合约地址和 ABI
- [ ] 更新 Monad 测试网 Token 地址
- [ ] 确认 Uniswap v4 在 Monad 上的部署情况
- [ ] 测试 Native Staking 功能
- [ ] 更新文档和测试用例

## 参考资源

- [Monad 官方文档](https://docs.monad.xyz)
- [Curvance 协议文档](https://docs.curvance.com)
- [Monad Testnet Explorer](https://explorer.monad.xyz)
