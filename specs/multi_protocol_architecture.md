# 多协议架构设计文档

## 概述

支持多个 DeFi 协议（Aave、Curvance、Monad Native Staking）的统一架构，通过协议抽象层实现协议间的无缝切换和组合。

## 架构设计

### 整体架构

```
Intent Bot
├── 意图层 (统一)
│   ├── swap_tokens
│   ├── supply          ← 统一意图
│   ├── withdraw        ← 统一意图
│   ├── transfer_token
│   └── check_balance
│
├── 协议路由层 (新增)
│   └── 根据 chain/protocol 参数分发
│
└── 协议适配层
    ├── Curvance (Monad)
    ├── Aave V3 (Ethereum/Base/Arbitrum)
    ├── Native Staking (Monad)
    └── 未来可扩展...
```

## 协议抽象层 (PAL)

### 核心接口

**文件**: `lib/protocols/types.ts`

```typescript
export interface ProtocolAdapter {
  name: string;
  supportedChains: number[];
  
  // 统一方法签名
  supply(params: SupplyParams): Promise<PreparedTransaction[]>;
  withdraw(params: WithdrawParams): Promise<PreparedTransaction[]>;
  getYield(token: string, chainId: number): Promise<number>;
  getBalance(userAddress: Address, token: string, chainId: number): Promise<string>;
}
```

### 协议适配器实现

#### Curvance 适配器

**文件**: `lib/protocols/curvance/adapter.ts`

```typescript
export const curvanceAdapter: ProtocolAdapter = {
  name: "curvance",
  supportedChains: [10143], // Monad
  
  async supply(params) {
    return buildCurvanceSupplyTx(params);
  },
  
  async withdraw(params) {
    return buildCurvanceWithdrawTx(params);
  },
  
  async getYield(token, chainId) {
    // 查询 Curvance APY
  },
  
  async getBalance(userAddress, token, chainId) {
    // 查询 Curvance 余额
  },
};
```

#### Aave 适配器

**文件**: `lib/protocols/aave/adapter.ts`

```typescript
export const aaveAdapter: ProtocolAdapter = {
  name: "aave",
  supportedChains: [1, 8453, 42161], // ETH, Base, Arbitrum
  
  async supply(params) {
    return buildAaveSupplyTx(params);
  },
  
  async withdraw(params) {
    return buildAaveWithdrawTx(params);
  },
  
  async getYield(token, chainId) {
    // 查询 Aave APY
  },
  
  async getBalance(userAddress, token, chainId) {
    // 查询 Aave 余额
  },
};
```

## 协议路由层

### 路由逻辑

**文件**: `lib/protocols/router.ts`

```typescript
export async function routeSupply(params: SupplyParams) {
  const { protocol, chain, token, amount } = params;
  
  // 自动选择最优协议
  if (protocol === "auto") {
    const bestOption = await findBestYield(token, amount, chain);
    return routeToProtocol(bestOption);
  }
  
  // 手动指定协议
  switch (protocol) {
    case "curvance":
      return curvanceAdapter.supply(params);
    case "aave":
      return aaveAdapter.supply(params);
    case "native_staking":
      return nativeStakingAdapter.stake(params);
    default:
      throw new Error(`Unknown protocol: ${protocol}`);
  }
}
```

### 收益对比功能

```typescript
export async function compareYields(
  token: string,
  amount: string,
  chains: number[]
): Promise<YieldComparison[]> {
  const comparisons: YieldComparison[] = [];
  
  for (const chainId of chains) {
    // 查询各协议收益
    const aaveYield = await aaveAdapter.getYield(token, chainId);
    const curvanceYield = await curvanceAdapter.getYield(token, chainId);
    
    comparisons.push({
      chain: chainId,
      protocols: [
        { name: "aave", apy: aaveYield },
        { name: "curvance", apy: curvanceYield },
      ],
    });
  }
  
  return comparisons;
}
```

## 统一意图定义

### 更新后的工具定义

**文件**: `lib/ai/tools.ts`

```typescript
{
  name: "supply",
  description: "存入借贷协议赚取收益",
  parameters: {
    type: "object",
    properties: {
      token: { type: "string" },
      amount: { type: "string" },
      protocol: { 
        type: "string",
        enum: ["curvance", "aave", "auto"],
        description: "目标协议，auto 表示自动选择最优"
      },
      chain: {
        type: "string", 
        enum: ["monad", "ethereum", "base", "arbitrum"],
        description: "目标链"
      }
    },
    required: ["token", "amount"]
  }
}
```

## 目录结构

```
lib/
├── ai/
│   ├── tools.ts          # 统一的意图定义
│   └── prompts.ts        # 统一的提示词
│
├── protocols/
│   ├── router.ts         # 协议路由
│   ├── types.ts          # 统一接口定义
│   │
│   ├── curvance/         # Curvance 适配器
│   │   ├── adapter.ts
│   │   ├── abi.ts
│   │   └── config.ts
│   │
│   ├── aave/             # Aave 适配器
│   │   ├── adapter.ts
│   │   ├── abi.ts
│   │   └── config.ts
│   │
│   └── native-staking/   # Native Staking 适配器
│       ├── adapter.ts
│       └── config.ts
│
└── web3/
    ├── config.ts         # 多链配置
    └── tokens.ts         # 多链代币
```

## 合并策略

### Git 合并流程

1. **创建合并分支**
   ```bash
   git checkout -b feature/multi-protocol
   ```

2. **合并同事的 Aave 分支**
   ```bash
   git merge origin/feature/aave-adapter
   ```

3. **解决冲突**
   - 主要在 `tools.ts`, `prompts.ts`
   - 统一意图定义格式

4. **测试验证**
   - 运行完整测试套件
   - 验证多协议路由

### 代码合并检查清单

- [ ] 统一 `ProtocolAdapter` 接口定义
- [ ] 创建 `lib/protocols/` 目录结构
- [ ] 迁移 Curvance 代码到 adapter 模式
- [ ] 迁移 Aave 代码到 adapter 模式
- [ ] 实现协议路由层
- [ ] 更新 AI tools 和 prompts
- [ ] 合并测试用例
- [ ] 更新文档

## 用户体验示例

### 自动选择最优协议

```
User: "把 1000 USDC 存到收益最高的地方"

Bot: 📊 收益对比：
     • Curvance (Monad): 5.8% APY
     • Aave (Base): 4.1% APY
     • Aave (Arbitrum): 3.5% APY
     
     建议存入 Curvance，预计年化 $58
     需要先跨链到 Monad (费用约 $2.5)
     
     确认执行？
```

### 手动指定协议

```
User: "把 Base 上的 USDC 存到 Aave"

Bot: 📋 交易计划：
     1. 存入 Aave V3 (Base)
     2. 获得 aUSDC，APY 4.1%
     
     确认执行？
```

## 优势

1. **可扩展性**: 新增协议只需实现 `ProtocolAdapter` 接口
2. **统一体验**: 用户无需关心底层协议差异
3. **智能路由**: 自动选择最优收益方案
4. **代码复用**: 共享基础架构和工具函数

## 未来扩展

- [ ] 支持 Compound 协议
- [ ] 支持 Lido (Liquid Staking)
- [ ] 支持更多链（Polygon, Optimism）
- [ ] 跨协议组合策略（如：Aave 借款 + Curvance 存款套利）
