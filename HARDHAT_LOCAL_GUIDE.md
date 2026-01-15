# Hardhat 本地网络快速测试指南

## 🚀 优势

使用 Hardhat 本地网络进行测试：

- ⚡ **超快速度**: 交易秒级确认，无需等待 RPC
- 💰 **免费测试**: 本地运行，不需要真实 Gas 费
- 🔄 **可重置**: 随时重置网络状态，重新开始测试
- 🎮 **完全控制**: 自己挖矿、控制区块时间
- 🎯 **真实体验**: 有真实的 MetaMask 弹窗和链上交互

## 📋 快速开始

### 步骤 1: 启动 Hardhat 本地网络

打开**新终端**，运行：

```bash
# 方式 1: 使用脚本
./scripts/start-hardhat.sh

# 方式 2: 直接运行
npx hardhat node
```

你会看到：

```
🚀 Starting Hardhat Local Network...
📍 Network: http://127.0.0.1:8545
🔗 Chain ID: 31337

💰 Accounts (use these private keys in MetaMask):

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...
```

### 步骤 2: 配置 MetaMask

1. **添加网络**:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **导入测试账户**:
   - ���制上面输出的第一个 Private Key
   - 在 MetaMask 中导入账户
   - 你应该看到 10000 ETH 余额

### 步骤 3: 部署合约

打开**另一个新终端**，运行：

```bash
npx hardhat run scripts/deploy-local.js --network localhost
```

你会看到：

```
🚀 Starting deployment to Hardhat Local Network...

📍 Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Account balance: 10000000000000000000000

1️⃣  Deploying MockMonad...
✅ MockMonad deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

2️⃣  Deploying YieldForwardingStakingPool...
✅ YieldForwardingStakingPool deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

3️⃣  Deploying MockAavePoolSimple...
✅ MockAavePoolSimple deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

4️⃣  Deploying MockSwapRouter...
✅ MockSwapRouter deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

🎉 All contracts deployed successfully!
```

### 步骤 4: 更新 .env.local

复制上面输出的合约地址到 `.env.local`:

```bash
NEXT_PUBLIC_MONAD_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_STAKING_POOL=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_MOCK_AAVE_POOL=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_MOCK_SWAP_ROUTER=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

### 步骤 5: 启动应用

```bash
npm run dev
```

访问 `http://localhost:3000`，连接 MetaMask（确保连接到 Hardhat Local 网络）。

## 🧪 测试功能

### 1. Check Balance
```
输入: "check balance"
结果: 显示 10000 ETH 余额
速度: 1 秒
```

### 2. Transfer
```
输入: "transfer 1 ETH to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
结果: MetaMask 弹窗 → 确认 → 秒级完成
速度: 2-3 秒
```

### 3. Supply to Aave
```
输入: "supply 1 ETH to Aave"
结果: 真实链上交互
速度: 2-3 秒
```

### 4. Stake with Yield
```
输入: "stake 1 ETH, yield to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
结果: 真实质押到合约
速度: 2-3 秒
```

### 5. Swap
```
输入: "swap 1 ETH to MONAD"
结果: 真实链上交换
速度: 2-3 秒
```

## 🔧 常用命令

### 重置网络
如果需要重新开始：

1. **停止 Hardhat** (Ctrl+C)
2. **重启 Hardhat**:
   ```bash
   npx hardhat node
   ```
3. **重新部署合约**:
   ```bash
   npx hardhat run scripts/deploy-local.js --network localhost
   ```

### 挖矿
Hardhat 默认会自动挖矿。如需手动挖矿：

```bash
# 在 Hardhat 控制台执行
npx hardhat console --network localhost

# 然后执行
await ethers.provider.send("evm_mine")
```

### 查看账户余额
```bash
npx hardhat console --network localhost

# 然后执行
const balance = await ethers.provider.getBalance("0x...")
console.log(ethers.utils.formatEther(balance))
```

## 💡 测试技巧

### 1. 使用多个账户
Hardhat 提供了 20 个测试账户，每个都有 10000 ETH：
- Account #0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Account #1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Account #2: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- ...

可以在不同账户之间转账、质押等。

### 2. 测试失败场景
```bash
# 发送超过余额的金额
输入: "transfer 99999 ETH to 0x..."

# 应该看到交易失败的错误信息
```

### 3. 查看交易回执
在 MetaMask 中点击交易哈希，会跳转到 Hardhat 的区块浏览器（`http://127.0.0.1:8545`），可以看到详细的交易信息。

### 4. 自动化测试
创建测试脚本：
```javascript
// scripts/test-all.js
async function testAll() {
  // 1. Check balance
  // 2. Transfer
  // 3. Supply
  // 4. Stake
  // 5. Swap
}
```

## 🐛 常见问题

**Q: MetaMask 显示"Could not fetch chain id"**
A: 确保 Hardhat 正在运行，并且 RPC URL 是 `http://127.0.0.1:8545`

**Q: 交易一直pending**
A: 在 Hardhat 控制台中，交易会自动确认。如果没有，检查 Hardhat 是否正在运行。

**Q: 余额显示为 0**
A: 确保导入了正确的测试账户私钥，并且网络选择正确。

**Q: 合约交互失败**
A: 确保合约已部署，并且 .env.local 中的地址正确。

**Q: 如何查看合约事件？**
A: 使用 Hardhat console:
```bash
npx hardhat console --network localhost
const contract = await ethers.getContractAt("ContractName", "0x...")
contract.on("EventName", (args) => console.log(args))
```

## 🎯 Hackathon 演示建议

### 使用 Hardhat 本地网络的优势：

1. **流畅的演示**: 交易秒级确认，不会卡顿
2. **真实交互**: MetaMask 弹窗，展示真实用户体验
3. **可控环境**: 可以提前准备好账户状态
4. **快速重置**: 如果出错，立即重置重新演示

### 演示流程：

1. **展示多账户**: 在 2-3 个测试账户之间转账
2. **展示 DeFi 功能**: Supply、Stake、Swap
3. **展示余额更新**: 实时查看余额变化
4. **强调技术**: AI 意图识别、真实链上交互

---

## 📚 相关文件

- **Hardhat 配置**: `hardhat.config.ts`
- **部署脚本**: `scripts/deploy-local.js`
- **启动脚本**: `scripts/start-hardhat.sh`
- **合约代码**: `contracts/`

祝测试顺利！🚀
