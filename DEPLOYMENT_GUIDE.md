# 📋 Mock MONAD 合约部署指南

## 🎯 目标
在 Base Sepolia 测试网上部署 Mock MONAD 代币和收益转发质押池合约。

---

## 📝 部署步骤

### 1️⃣ 准备钱包和测试 ETH

#### 获取 Base Sepolia 测试 ETH
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **备用**: https://sepoliafaucet.com

> 需要 0.1-0.2 ETH 用于部署合约

#### 导出 MetaMask 私钥
1. 打开 MetaMask
2. 点击账户 → 账户详情
3. 点击 "导出私钥"
4. 输入密码
5. 复制私钥

⚠️ **警告**: 仅在测试网使用，永远不要在主网使用或分享此私钥！

---

### 2️⃣ 配置环境变量

编辑 `.env` 文件，添加以下内容：

```bash
# 从 MetaMask 导出的私钥（不要包含 0x 前缀）
PRIVATE_KEY=your_private_key_here

# Base Sepolia RPC
RPC_URL=https://sepolia.base.org
```

---

### 3️⃣ 部署合约

运行部署脚本：

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

#### 预期输出：

```
🚀 Deploying contracts with account: 0x...
💰 Account balance: 123456789012345678

📝 Deploying MockMonad...
✅ MockMonad deployed to: 0x...

📝 Deploying YieldForwardingStakingPool...
✅ YieldForwardingStakingPool deployed to: 0x...

💰 Adding rewards to staking pool...
✅ Minted 10,000 MONAD to staking pool for rewards

🚰 Faucet Info:
   Call mockMonad.faucet() to get 100 MONAD

✨ Deployment complete!

📋 Contract Addresses:
   MockMonad: 0x...
   YieldForwardingStakingPool: 0x...

📝 Save these addresses to your .env file:
   NEXT_PUBLIC_MONAD_TOKEN=0x...
   NEXT_PUBLIC_STAKING_POOL=0x...
```

---

### 4️⃣ 保存合约地址

将部署后返回的地址保存到 `.env`：

```bash
NEXT_PUBLIC_MONAD_TOKEN=0x部署返回的MockMonad地址
NEXT_PUBLIC_STAKING_POOL=0x部署返回的StakingPool地址
```

---

### 5️⃣ 验证部署

#### 在浏览器中验证

1. **MockMonad 合约**
   - 访问: https://sepolia.basescan.org/address/你的合约地址
   - 应该看到 "Mock Monad" 代币

2. **调用 faucet 获取代币**
   - 在 https://sepolia.basescan.org/address/你的合约地址#writeContract
   - 连接钱包
   - 调用 `faucet()` 函数
   - 应该收到 100 MONAD

---

## 🧪 测试合约功能

### 使用 Hardhat Console 测试

```bash
npx hardhat console --network baseSepolia
```

在 console 中：

```javascript
// 获取合约实例
const MockMonad = await ethers.getContractFactory("MockMonad");
const mockMonad = MockMonad.attach("你的合约地址");

// 调用 faucet
await mockMonad.faucet();

// 检查余额
const balance = await mockMonad.balanceOf("你的地址");
console.log(ethers.formatEther(balance)); // 应该显示 100.0

// 获取质押池
const StakingPool = await ethers.getContractFactory("YieldForwardingStakingPool");
const stakingPool = StakingPool.attach("质押池地址");

// 质押代币（需要先 approve）
await mockMonad.approve(stakingPool.address, ethers.parseEther("100"));
await stakingPool.stake(ethers.parseEther("100"), "朋友地址");

// 查询质押信息
const info = await stakingPool.getStakeInfo("你的地址");
console.log(info);
```

---

## ❗ 常见问题

### Q: 部署失败 "insufficient funds"
**A**: 确保钱包有 0.1+ ETH，可以在 Faucet 多领几次

### Q: "network mismatch"
**A**: 确保钱包连接到 Base Sepolia (Chain ID: 84532)

### Q: "invalid private key"
**A**: 确保私钥没有 0x 前缀，并且是完整的 64 字符十六进制字符串

### Q: 交易确认太慢
**A**: Base Sepolia 有时会拥堵，可以等待或增加 gas price

---

## 📊 部署后检查清单

- [ ] 合约部署成功
- [ ] 保存了合约地址到 .env
- [ ] 在 BaseScan 上验证了合约
- [ ] 成功调用 faucet 获取了 MONAD
- [ ] 查询代币余额确认有 100 MONAD
- [ ] 更新了前端配置（下一步）

---

## 🎯 下一步

部署成功后，运行以下命令更新前端配置：

```bash
# 前端会自动读取 .env 中的合约地址
npm run dev
```

然后继续集成到前端...
