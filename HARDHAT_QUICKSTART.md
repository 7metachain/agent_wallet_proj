# Hardhat 本地网络快速启动

## 🚀 快速开始（3 个终端）

### 终端 1: 启动 Hardhat 网络

```bash
# 确保在项目根目录
cd /Users/lpp/Downloads/myCode/bak/agent_wallet_proj

# 启动 Hardhat 本地网络
npx hardhat node
```

你会看到类似这样的输出：

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========

WARNING! These accounts are meant for testing purposes only. Do not use these accounts on Mainnet or other live networks.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...
```

**重要**: 复制第一个账户的 Private Key，稍后需要在 MetaMask 中导入。

---

### 终端 2: 部署合约

**打开新终端**，运行：

```bash
cd /Users/lpp/Downloads/myCode/bak/agent_wallet_proj
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

📋 Contract Addresses:
==================================================
NEXT_PUBLIC_MONAD_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_STAKING_POOL=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_MOCK_AAVE_POOL=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_MOCK_SWAP_ROUTER=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
==================================================

💡 Copy these to your .env.local file
```

**复制上面输出的合约地址**，然后更新 `.env.local` 文件。

---

### 终端 3: 启动应用

**更新 .env.local**:

```bash
# 打开 .env.local 文件
nano .env.local
# 或使用任何编辑器
```

**更新这些行**（使用上面复制的地址）：

```bash
NEXT_PUBLIC_MONAD_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_STAKING_POOL=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_MOCK_AAVE_POOL=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_MOCK_SWAP_ROUTER=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

**启动应用**:

```bash
npm run dev
```

---

## 🦊 配置 MetaMask

### 1. 添加 Hardhat Local 网络

在 MetaMask 中：
1. 点击网络下拉菜单
2. 点击"添加网络" → "手动添加网络"
3. 填入以下信息：
   - **网络名称**: `Hardhat Local`
   - **新的 RPC URL**: `http://127.0.0.1:8545`
   - **链 ID**: `31337`
   - **货币符号**: `ETH`
   - **区块浏览器 URL**: (可选) `http://127.0.0.1:8545`

### 2. 导入测试账户

1. 点击 MetaMask 右上角的账户图标
2. 点击"导入账户"
3. 粘贴之前复制的 Private Key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
4. 点击"导入"

你应该看到账户有 **10000 ETH** 余额！

---

## 🧪 开始测试

访问 `http://localhost:3000`，你会看到应用默认连接到 **Hardhat Local** 网络。

### 测试命令：

1. **查询余额**:
   ```
   check balance
   ```

2. **转账**:
   ```
   transfer 1 ETH to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   ```

3. **Supply 到 Aave**:
   ```
   supply 1 ETH to Aave
   ```

4. **质押并发送收益**:
   ```
   stake 1 ETH, yield to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   ```

5. **Swap**:
   ```
   swap 1 ETH to MONAD
   ```

所有操作都在 **2-3 秒**内完成！⚡

---

## 🔄 重置网络

如果需要重新开始：

1. **停止 Hardhat** (在终端 1 按 Ctrl+C)
2. **重启 Hardhat**:
   ```bash
   npx hardhat node
   ```
3. **重新部署合约** (在终端 2):
   ```bash
   npx hardhat run scripts/deploy-local.js --network localhost
   ```
4. **更新 .env.local** (使用新的合约地址)
5. **刷新浏览器**

---

## 💡 提示

- Hardhat 本地网络运行在内存中，停止后会丢失所有数据
- 每次重启都需要重新部署合约
- 有 20 个测试账户可用，每个都有 10000 ETH
- 交易会自动确认，无需等待

---

## 🐛 常见问题

**Q: MetaMask 无法连接？**
A: 确保 Hardhat 正在运行，并且 RPC URL 是 `http://127.0.0.1:8545`

**Q: 合约地址错误？**
A: 每次重启 Hardhat 都需要重新部署合约并更新地址

**Q: 交易失败？**
A: 检查合约地址是否正确，确保已经部署

**Q: 余额为 0？**
A: 确保导入了正确的测试账户私钥

---

祝测试顺利！🚀
