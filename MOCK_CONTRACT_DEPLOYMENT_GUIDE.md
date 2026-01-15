# 🎭 Mock 合约测试方案 - 完整指南

本指南介绍如何使用 Mock 合约在测试网上完整测试所有功能。

---

## 📋 方案概述

### 为什么使用 Mock 合约？

✅ **优点**：
- 在任何测试网部署（包括 Monad Testnet）
- 完全控制测试环境
- 无需依赖真实的 DEX 流动性
- 可以测试所有功能：Swap、Supply、Withdraw、Stake
- 无 gas 费压力（测试网 gas 很便宜）
- 快速迭代和调试

❌ **缺点**：
- 不是真实的 DeFi 协议
- 价格是模拟的（1:1 比率）
- 没有真实的收益

---

## 🏗️ Mock 合约列表

我们的工程包含以下 Mock 合约：

### 1. **MockMonad** (ERC20 Token)
- 模拟 MON 代币
- 内置水龙头：调用 `faucet()` 获取 100 MON
- 可无限铸造用于测试

### 2. **MockSwapRouter** (模拟 Uniswap V3)
- 实现 1:1 代币兑换（扣除 0.3% 手续费）
- 支持原生代币（ETH/MON）和 ERC20
- 兼容 Uniswap V3 Router 接口

### 3. **MockAavePool** (模拟 Aave V3)
- 实现存款/提款功能
- 跟踪用户存款余额
- 模拟利息计算（5% APY，仅显示）
- 支持原生代币和 ERC20

### 4. **YieldForwardingStakingPool** (质押池)
- 质押 MON 并指定收益接收地址
- 收益转发功能
- 可提取质押

---

## 🚀 部署步骤

### 第 1 步：准备环境

1. **安装依赖**：
```bash
npm install --save-dev @openzeppelin/contracts
```

2. **配置 .env 文件**：
```bash
cp .env.example .env.local
```

编辑 `.env.local`：
```bash
# 部署者私钥（要有测试币的账户）
PRIVATE_KEY=your_private_key_here

# RPC URL（选择要部署的测试网）
# Monad Testnet:
RPC_URL=https://testnet-rpc.monad.xyz

# 或 Base Sepolia:
# RPC_URL=https://sepolia.base.org
```

3. **获取测试币**：
   - **Monad Testnet**: 访问 Monad Discord 水龙头
   - **Base Sepolia**: https://sepoliafaucet.com/
   - **Ethereum Sepolia**: https://sepoliafaucet.com/

### 第 2 步：编译合约

```bash
npx hardhat compile
```

### 第 3 步：部署合约

```bash
# 部署到 Monad Testnet
npx hardhat run scripts/deploy-mock-all.ts --network monadTestnet

# 或部署到 Base Sepolia
npx hardhat run scripts/deploy-mock-all.ts --network baseSepolia
```

**部署输出示例**：
```
🚀 Deploying Mock Contracts to Testnet
=========================================

👤 Deployer: 0x...
💰 Balance: 1.5 ETH

📝 Deploying MockMonad token...
✅ MockMonad deployed to: 0x1234...

📝 Deploying MockAavePool...
✅ MockAavePool deployed to: 0x5678...

📝 Deploying MockSwapRouter...
✅ MockSwapRouter deployed to: 0xabcd...

📝 Deploying YieldForwardingStakingPool...
✅ YieldForwardingStakingPool deployed to: 0xef01...

💰 Adding rewards to staking pool...
✅ Minted 10,000 MON to staking pool

💰 Adding liquidity to MockSwapRouter...
✅ Minted 50,000 MON to swap router

💰 Adding liquidity to MockAavePool...
✅ Minted 50,000 MON to Aave pool

==================================================
✨ All Mock Contracts Deployed Successfully!
==================================================

📋 Contract Addresses:
─────────────────────────────────────────────────
  Monad Token (MON):  0x1234...
  Staking Pool:        0xef01...
  Mock Aave Pool:      0x5678...
  Mock Swap Router:    0xabcd...
  Chain ID:            10143
─────────────────────────────────────────────────

📝 Next Steps:
  1. Copy these addresses to your .env.local file

     NEXT_PUBLIC_MONAD_TOKEN=0x1234...
     NEXT_PUBLIC_STAKING_POOL=0xef01...
     NEXT_PUBLIC_MOCK_AAVE_POOL=0x5678...
     NEXT_PUBLIC_MOCK_SWAP_ROUTER=0xabcd...

  2. Update lib/web3/transaction-builder.ts
  3. Get test tokens: call mockMonad.faucet()
  4. Test operations...

💾 Deployment info saved to: deployed-contracts.json
```

### 第 4 步：更新应用配置

将部署输出的合约地址复制到 `.env.local`：

```bash
# .env.local
NEXT_PUBLIC_MONAD_TOKEN=0x1234...      # 替换为实际地址
NEXT_PUBLIC_STAKING_POOL=0xef01...      # 替换为实际地址
NEXT_PUBLIC_MOCK_AAVE_POOL=0x5678...    # 替换为实际地址
NEXT_PUBLIC_MOCK_SWAP_ROUTER=0xabcd...  # 替换为实际地址
```

### 第 5 步：重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

---

## 🧪 测试功能

### 准备工作：获取测试币

在浏览器控制台运行（或在 Etherscan 上手动调用合约）：

```javascript
// 获取 100 MON
await mockMonad.faucet()
```

或者使用部署脚本中的水龙头功能。

### 测试 1：查询余额

```
Check balance
```

**预期结果**：
- 显示当前 MON 余额
- 显示其他代币余额（如果有）

### 测试 2：代币兑换 (Swap)

```
Swap 10 MON to USDC
```

**预期流程**：
1. AI 识别为 `swap_tokens` 意图
2. 显示交易卡片：`Swap 10 MON → USDC`
3. 点击 Execute
4. MetaMask 签名交易
5. 交易成功，获得 ~9.97 USDC（扣除 0.3% 手续费）

### 测试 3：存款到 Aave (Supply)

```
Supply 5 MON to Aave
```

**预期流程**：
1. AI 识别为 `supply_to_aave` 意图
2. 显示交易卡片：`Supply 5 MON to Aave`
3. 点击 Execute
4. MetaMask 签名交易
5. 5 MON 被存入 Mock Aave Pool
6. 可以查询 Aave 合约确认存款余额

### 测试 4：从 Aave 提款 (Withdraw)

```
Withdraw 2 MON from Aave
```

**预期流程**：
1. AI 识别为 `withdraw_from_aave` 意图
2. 显示交易卡片：`Withdraw 2 MON from Aave`
3. 点击 Execute
4. MetaMask 签名交易
5. 2 MON 从 Mock Aave Pool 返回到钱包

### 测试 5：质押并转发收益 (Stake)

```
Stake 3 MON, yield to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**预期流程**：
1. AI 识别为 `stake_with_yield_recipient` 意图
2. 显示交易卡片：`Stake 3 MON → Yield to 0x742d...`
3. 点击 Execute
4. MetaMask 签名交易
5. 3 MON 被质押到 StakingPool
6. 收益将发送到指定地址

### 测试 6：转账 (Transfer)

```
Transfer 1 MON to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**预期流程**：
1. AI 识别为 `transfer_token` 意图
2. 显示交易卡片：`Transfer 1 MON to 0x742d...`
3. 点击 Execute
4. MetaMask 签名交易
5. 1 MON 转账到目标地址

---

## 🔍 验证合约功能

### 方法 1：使用区块浏览器

1. 访问对应的区块浏览器：
   - Monad: https://explorer.testnet.monad.xyz
   - Base Sepolia: https://sepolia.basescan.org
   - Ethereum Sepolia: https://sepolia.etherscan.io

2. 搜索部署的合约地址
3. 点击 "Write Contract" → "Connect to Web3"
4. 测试合约函数：

**MockMonad**：
- `faucet()` - 获取 100 MON
- `mint(address to, uint256 amount)` - 铸造代币
- `balanceOf(address account)` - 查询余额

**MockAavePool**：
- `supply(address token, uint256 amount, address onBehalfOf, uint16 referralCode)`
- `withdraw(address token, uint256 amount, address to)`
- `getUserSupplyBalance(address user, address token)`

**MockSwapRouter**：
- `exactInputSingle((...))` - 执行兑换

**YieldForwardingStakingPool**：
- `stake(uint256 amount, address yieldRecipient)`
- `collectYield(address staker)`
- `getStakeInfo(address user)`

### 方法 2：使用 Hardhat 脚本

创建测试脚本 `scripts/test-interactions.ts`：

```typescript
import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const mockMonad = await ethers.getContractAt(
    "MockMonad",
    process.env.NEXT_PUBLIC_MONAD_TOKEN!
  );

  // 获取代币
  console.log("Calling faucet...");
  await mockMonad.faucet();
  console.log("Received 100 MON!");

  // 查询余额
  const balance = await mockMonad.balanceOf(signer.address);
  console.log("Balance:", ethers.formatEther(balance), "MON");
}

main();
```

运行测试：
```bash
npx hardhat run scripts/test-interactions.ts --network monadTestnet
```

---

## 📊 合约地址管理

### 查看已部署的合约地址

```bash
cat deployed-contracts.json
```

### 多网络部署

可以在不同测试网部署相同合约：

```bash
# Monad Testnet
npx hardhat run scripts/deploy-mock-all.ts --network monadTestnet

# Base Sepolia
npx hardhat run scripts/deploy-mock-all.ts --network baseSepolia

# Ethereum Sepolia
npx hardhat run scripts/deploy-mock-all.ts --network sepolia
```

每个网络的部署信息会保存在 `deployed-contracts.json`。

---

## 🐛 故障排除

### 问题 1：部署失败 "insufficient funds"

**解决**：确保部署钱包有足够的测试币

```bash
# 检查余额
npx hardhat run scripts/check-balance.ts --network monadTestnet
```

### 问题 2：合约地址未生效

**解决**：
1. 确认 `.env.local` 文件已更新
2. **重启开发服务器**：`npm run dev`
3. 清除浏览器缓存并刷新页面

### 问题 3：交易失败 "execution reverted"

**可能原因**：
- 未授权合约使用代币（需要先 approve）
- 代币余额不足
- 合约地址错误

**解决**：
1. 检查合约调用是否需要先 approve
2. 验证代币余额
3. 确认合约地址正确

### 问题 4：找不到 Mock 合约地址

**解决**：
1. 检查 `deployed-contracts.json` 文件
2. 在区块浏览器搜索合约地址
3. 重新运行部署脚本

---

## 🎯 完整测试流程示例

### 场景：完整的 DeFi 操作流程

```bash
# 1. 部署合约
npx hardhat run scripts/deploy-mock-all.ts --network monadTestnet

# 2. 更新 .env.local 并重启服务器
# 3. 在浏览器中打开应用

# 4. 获取测试币（在控制台运行）
await mockMonad.faucet()

# 5. 查询余额
用户输入: Check balance

# 6. 兑换代币
用户输入: Swap 10 MON to USDC

# 7. 存款到 Aave
用户输入: Supply 5 MON to Aave

# 8. 从 Aave 提款
用户输入: Withdraw 2 MON from Aave

# 9. 质押并转发收益
用户输入: Stake 3 MON, yield to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# 10. 转账
用户输入: Transfer 1 MON to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

---

## 📈 下一步

### 测试完成后

1. **验证所有功能正常**
   - Swap ✅
   - Supply ✅
   - Withdraw ✅
   - Stake ✅
   - Transfer ✅
   - Check Balance ✅

2. **准备生产环境**
   - 审计智能合约
   - 替换为真实的 DEX 协议
   - 添加前端错误处理
   - 优化 Gas 费用

3. **部署到主网**
   - 使用生产级 RPC
   - 配置监控和报警
   - 准备足够的流动性

---

## 🔗 有用链接

- **Hardhat Docs**: https://hardhat.org/docs
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts
- **Viem Docs**: https://viem.sh/
- **Wagmi Docs**: https://wagmi.sh/

---

**现在就试试吧！** 🚀

1. 部署 Mock 合约到测试网
2. 配置应用使用部署的合约
3. 开始完整的端到端测试！
