# Mock Swap 完整部署指南

## 概述

为了实现真正的代币交换，需要部署：
1. **MockUSDC** - 模拟 USDC 代币
2. **MockDEXV2** - 支持真实转账的 DEX

## 步骤 1: 部署 MockUSDC

1. 打开 Remix: https://remix.ethereum.org
2. 创建文件 `MockUSDC.sol`，复制 `contracts/MockUSDC.sol` 内容
3. 编译合约 (Solidity 0.8.20+)
4. **Deploy & Run**:
   - Environment: **Injected Provider - MetaMask**
   - 确保网络是 **Monad Testnet (10143)**
   - 点击 **Deploy**
5. **记录 MockUSDC 地址**: `__________________`

## 步骤 2: 部署 MockDEXV2

1. 创建文件 `MockDEXV2.sol`，复制 `contracts/MockDEXV2.sol` 内容
2. 编译并部署 (同上)
3. **记录 MockDEXV2 地址**: `__________________`

## 步骤 3: 添加流动性

### 3.1 给 DEX 转入 USDC

在 MockUSDC 合约中：
1. 展开 **transfer** 函数
2. 填写参数：
   - `to`: MockDEXV2 的地址
   - `amount`: `100000000000` (100,000 USDC，6位小数)
3. 点击 **transact**

### 3.2 给 DEX 添加 MON 流动性

在 MockDEXV2 合约中：
1. 在 **Value** 输入框填写: `10` (或更多)
2. 单位选择: **Ether** (即 MON)
3. 点击 **addLiquidity**

## 步骤 4: 验证流动性

在 MockDEXV2 中调用 `getTokenBalance`:
- 输入 MockUSDC 地址 → 应该返回 100000000000
- 输入 `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` → 应该返回 MON 数量

## 步骤 5: 测试领取 USDC

用户可以调用 MockUSDC 的 `faucet()` 函数领取 1000 USDC 测试代币

## 步骤 6: 更新项目配置

部署完成后，把两个地址告诉 AI 助手，会自动更新配置：
- MockUSDC 地址
- MockDEXV2 地址

---

## 汇率说明

默认汇率 (可通过 setRate 调整)：
- 1 MON = 100 USDC
- 100 USDC = 1 MON

## 合约功能

### MockUSDC
- `faucet()` - 领取 1000 测试 USDC
- `transfer(to, amount)` - 转账
- `approve(spender, amount)` - 授权
- `balanceOf(account)` - 查询余额

### MockDEXV2
- `swapNativeForToken(toToken, minOut, recipient)` - MON → USDC
- `swapTokenForNative(fromToken, amountIn, minOut, recipient)` - USDC → MON
- `getAmountOut(from, to, amountIn)` - 预估输出
- `addLiquidity()` - 添加 MON 流动性
- `setRate(from, to, rate)` - 设置汇率 (owner only)
