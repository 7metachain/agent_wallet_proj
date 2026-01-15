# 🚀 Mock 合约测试 - 快速开始

## 最快的测试路径（5分钟）

### 步骤 1：部署合约（2分钟）

```bash
# 1. 配置环境
cp .env.example .env.local

# 2. 编辑 .env.local，填入私钥和 RPC
# PRIVATE_KEY=your_private_key
# RPC_URL=https://testnet-rpc.monad.xyz

# 3. 编译合约
npx hardhat compile

# 4. 部署到 Monad Testnet
npx hardhat run scripts/deploy-mock-all.ts --network monadTestnet
```

### 步骤 2：配置应用（1分钟）

将部署输出的地址复制到 `.env.local`：

```bash
NEXT_PUBLIC_MONAD_TOKEN=0x...
NEXT_PUBLIC_STAKING_POOL=0x...
NEXT_PUBLIC_MOCK_AAVE_POOL=0x...
NEXT_PUBLIC_MOCK_SWAP_ROUTER=0x...
```

重启服务器：
```bash
npm run dev
```

### 步骤 3：测试功能（2分钟）

在应用中依次测试：

```
1. Check balance
2. Swap 10 MON to USDC
3. Supply 5 MON to Aave
4. Withdraw 2 MON from Aave
5. Stake 3 MON, yield to 0x742d...
6. Transfer 1 MON to 0x742d...
```

---

## 📋 详细文档

完整文档请查看：
- **[MOCK_CONTRACT_DEPLOYMENT_GUIDE.md](./MOCK_CONTRACT_DEPLOYMENT_GUIDE.md)** - Mock 合约部署和测试完整指南

---

## 🔧 常用命令

### 部署合约
```bash
npx hardhat run scripts/deploy-mock-all.ts --network monadTestnet
```

### 测试合约交互
```bash
npx hardhat run scripts/test-interactions.ts --network monadTestnet
```

### 查询余额
```bash
npx hardhat run scripts/check-balance.ts --network monadTestnet
```

### 编译合约
```bash
npx hardhat compile
```

---

## 📊 合约功能对照表

| 功能 | 合约 | 测试命令 |
|------|------|----------|
| 获取测试币 | MockMonad | 调用 `faucet()` |
| 代币兑换 | MockSwapRouter | `Swap 10 MON to USDC` |
| 存款 | MockAavePool | `Supply 5 MON to Aave` |
| 提款 | MockAavePool | `Withdraw 2 MON from Aave` |
| 质押 | YieldForwardingStakingPool | `Stake 3 MON, yield to 0x...` |
| 转账 | - | `Transfer 1 MON to 0x...` |
| 查询余额 | - | `Check balance` |

---

## 🎯 测试网络选择

### 推荐网络：Monad Testnet
- Chain ID: 10143
- RPC: https://testnet-rpc.monad.xyz
- 浏览器: https://explorer.testnet.monad.xyz
- **优点**：专为测试设计，交易快速确认

### 备选网络：Base Sepolia
- Chain ID: 84532
- RPC: https://sepolia.base.org
- 浏览器: https://sepolia.basescan.org
- **优点**：成熟的测试网，水龙头充足

---

## ✅ 测试清单

部署并测试以下功能：

- [ ] 合约部署成功
- [ ] 获取测试币（faucet）
- [ ] 查询余额（Check balance）
- [ ] 代币兑换（Swap）
- [ ] 存款到 Aave（Supply）
- [ ] 从 Aave 提款（Withdraw）
- [ ] 质押并转发收益（Stake）
- [ ] 转账（Transfer）
- [ ] 所有交易在区块浏览器可查

---

## 🐛 遇到问题？

### 问题：部署失败
- 检查钱包是否有测试币
- 确认 RPC URL 正确
- 查看错误信息

### 问题：交易失败
- 确认已授权（approve）
- 检查代币余额
- 验证合约地址

### 问题：合约地址未生效
- 重启开发服务器：`npm run dev`
- 清除浏览器缓存
- 确认 `.env.local` 文件正确

---

**现在就开始测试吧！** 🎉
