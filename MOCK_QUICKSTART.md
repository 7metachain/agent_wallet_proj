# 🎭 Mock 合约测试方案 - 快速开始

## ✅ 已完成配置

1. **package.json** - 已添加 `"type": "module"` 支持 Hardhat 3.x ESM
2. **hardhat.config.ts** - 已配置为 Hardhat 3.x 格式，支持 Monad Testnet 和 Base Sepolia
3. **Mock 合约** - 已创建 4 个 Mock 合约
4. **部署脚本** - 已创建 `deploy-mock-all.ts`

## 🚀 快速开始

### 第 1 步：配置环境

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入私钥和 RPC
# PRIVATE_KEY=your_wallet_private_key_here
# RPC_URL=https://testnet-rpc.monad.xyz
```

### 第 2 步：编译合约

```bash
npx hardhat compile
```

预期输出：
```
Compiled 4 Solidity files successfully
```

### 第 3 步：部署合约

```bash
# 部署到 Monad Testnet
npx hardhat run scripts/deploy-mock-all.ts --network monadTestnet
```

预期输出：
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
  1. Copy these addresses to your .env.local file:

     NEXT_PUBLIC_MONAD_TOKEN=0x1234...
     NEXT_PUBLIC_STAKING_POOL=0xef01...
     NEXT_PUBLIC_MOCK_AAVE_POOL=0x5678...
     NEXT_PUBLIC_MOCK_SWAP_ROUTER=0xabcd...

  2. Update lib/web3/transaction-builder.ts with the new addresses
  3. Get test tokens: call mockMonad.faucet() to get 100 MON
  4. Test swap: 'Swap 10 MON to MONAD'
  5. Test supply: 'Supply 5 MON to Aave'
  6. Test withdraw: 'Withdraw 2 MON from Aave'
  7. Test stake: 'Stake 3 MON, yield to 0x...'

💾 Deployment info saved to: deployed-contracts.json
```

### 第 4 步：配置应用

将部署输出的地址复制到 `.env.local`：

```bash
NEXT_PUBLIC_MONAD_TOKEN=0x...      # 替换为实际地址
NEXT_PUBLIC_STAKING_POOL=0x...      # 替换为实际地址
NEXT_PUBLIC_MOCK_AAVE_POOL=0x...    # 替换为实际地址
NEXT_PUBLIC_MOCK_SWAP_ROUTER=0x...  # 替换为实际地址
```

### 第 5 步：重启并测试

```bash
# 重启开发服务器
npm run dev
```

在应用中测试：
```
Check balance
Swap 10 MON to USDC
Supply 5 MON to Aave
Withdraw 2 MON from Aave
Stake 3 MON, yield to 0x...
Transfer 1 MON to 0x...
```

---

## 📚 详细文档

- **[MOCK_CONTRACT_DEPLOYMENT_GUIDE.md](MOCK_CONTRACT_DEPLOYMENT_GUIDE.md)** - 完整部署和测试指南
- **[QUICK_START.md](QUICK_START.md)** - 快速开始指南
- **[MOCK_SETUP_SUMMARY.md](MOCK_SETUP_SUMMARY.md)** - 修改内容总结

---

## 🎯 支持的功能

| 功能 | AI 命令示例 | 使用的合约 |
|------|------------|-----------|
| 查询余额 | `Check balance` | MockMonad |
| 代币兑换 | `Swap 10 MON to USDC` | MockSwapRouter |
| 存款 | `Supply 5 MON to Aave` | MockAavePool |
| 提款 | `Withdraw 2 MON from Aave` | MockAavePool |
| 质押 | `Stake 3 MON, yield to 0x...` | YieldForwardingStakingPool |
| 转账 | `Transfer 1 MON to 0x...` | MockMonad |

---

## 🔧 故障排除

### 编译失败
```bash
npx hardhat compile
```
应该显示：`Compiled 4 Solidity files successfully`

### 部署失败
- 确保钱包有足够的测试币
- 确认 RPC URL 正确
- 检查私钥格式

### 交易失败
- 确认已授权（approve）
- 检查代币余额
- 验证合约地址

---

**现在就开始测试吧！** 🚀
