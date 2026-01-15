# 🔥 Hardhat 本地网络启动步骤

## 前提条件

确保你已经删除了缓存并编译了合约：

```bash
cd /Users/lpp/Downloads/myCode/bak/agent_wallet_proj

# 清理缓存
rm -rf cache artifacts

# 编译合约
npx hardhat compile
```

---

## 🚀 启动步骤（需要 3 个终���窗口）

### 终端 1: 启动 Hardhat 节点

**打开新终端窗口**，运行：

```bash
cd /Users/lpp/Downloads/myCode/bak/agent_wallet_proj
npx hardhat node
```

**重要**: 这个终端必须**保持打开**，不要关闭！

你应该看到：

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

**复制第一个账户的 Private Key**，稍后需要用到。

---

### 终端 2: 测试连接（可选）

**打开第二个新终端窗口**，先测试连接：

```bash
cd /Users/lpp/Downloads/myCode/bak/agent_wallet_proj
npx hardhat run scripts/test-connection.js --network localhost
```

如果连接成功，你会看到：

```
🔍 Testing Hardhat connection...

✅ Connected to network:
   Chain ID: 31337
   Name: unknown

✅ Found 20 accounts
   First account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Balance: 10000.0 ETH

✅ Connection successful! You can now run deploy-local.js
```

如果卡住不动，说明**终端 1 的 Hardhat 节点没有运行**！

---

### 终端 2（续）: 部署合约

测试成功后，部署合约：

```bash
npx hardhat run scripts/deploy-local.js --network localhost
```

你应该看到：

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

🚰 Calling faucet to get tokens...
✅ Faucet called! You now have 100 MONAD tokens
```

**复制上面合约地址**（每行等号后面的部分）。

---

### 终端 3: 启动应用

**打开第三个新终端窗口**，运行：

```bash
cd /Users/lpp/Downloads/myCode/bak/agent_wallet_proj
npm run dev
```

---

## 📝 更新 .env.local

在编辑器中打开 `.env.local` 文件，找到这些行并更新：

```bash
# 找到这些行（大约在第 27-40 行）
NEXT_PUBLIC_MONAD_TOKEN=0xFBa7b4eF30E605452Eb4B5Cb0cbEa978c4e94074
NEXT_PUBLIC_STAKING_POOL=0x1b08489626ae5a5eE76D519EadB96047Da31e4D3
NEXT_PUBLIC_MOCK_AAVE_POOL=0xBAe8c70A8322f39b56A893639B81B32E36aC9Fb7
NEXT_PUBLIC_MOCK_SWAP_ROUTER=0x98Ed6EFA01fb3745b636615Fb7c4243a6D595d8B

# 替换为从部署脚本复制的新地址（每次重启 Hardhat 都会变）
NEXT_PUBLIC_MONAD_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_STAKING_POOL=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_MOCK_AAVE_POOL=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_MOCK_SWAP_ROUTER=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

**重要**: 保存文件后，需要**重启应用**（在终端 3 按 Ctrl+C，然后重新运行 `npm run dev`）。

---

## 🦊 配置 MetaMask

### 1. 添加网络

在 MetaMask 中：
1. 点击网络下拉菜单
2. 点击"添加网络" → "手动添加网络"
3. 填入：
   - **网络名称**: `Hardhat Local`
   - **新的 RPC URL**: `http://127.0.0.1:8545`
   - **链 ID**: `31337`
   - **货币符号**: `ETH`

### 2. 导入账户

1. 点击 MetaMask 账户图标 → "导入账户"
2. 粘贴 Private Key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. 点击"导入"

你应该看到 **10000 ETH** 余额！

---

## ✅ 验证

1. 访问 `http://localhost:3000`
2. 连接钱包（应该自动连接到 Hardhat Local）
3. 输入 `check balance`，应该看到 10000 ETH

---

## 🔧 故障排除

### 问题 1: 部署脚本卡住不动

**原因**: Hardhat 节点没有运行

**解决**: 确保终端 1 的 `npx hardhat node` 正在运行，并且看到 "Started HTTP and WebSocket JSON-RPC server" 消息。

### 问题 2: 连接测试失败

**解决**:
```bash
# 先测试连接
npx hardhat run scripts/test-connection.js --network localhost

# 如果卡住，检查 Hardhat 节点是否运行
# 在另一个终端运行：
curl http://127.0.0.1:8545
```

### 问题 3: 合约地址不对

**原因**: Hardhat 重启后，合约地址会变化

**解决**: 每次重启 Hardhat 都需要重新部署合约并更新 `.env.local`。

### 问题 4: MetaMask 无法连接

**解决**:
1. 确认 Hardhat 节点正在运行
2. 检查 RPC URL 是 `http://127.0.0.1:8545`（不是 https）
3. 检查 Chain ID 是 `31337`

---

## 📊 终端状态检查

在任何时候，你都应该有 **3 个终端在运行**：

| 终端 | 命令 | 状态 |
|------|------|------|
| 1 | `npx hardhat node` | 运行中，显示账户信息 |
| 2 | `npx hardhat run ... --network localhost` | 已完成部署 |
| 3 | `npm run dev` | 运行中，显示编译成功 |

---

## 🎯 快速测试

启动成功后，在应用中测试：

```
check balance
transfer 1 ETH to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

应该能在 2-3 秒内完成！

---

## 💡 提示

- **不要关闭终端 1**（Hardhat 节点），否则所有数据会丢失
- **每次重启 Hardhat** 都需要重新部署合约
- **保存好 Private Key**，测试账户有很多 ETH
- **有 20 个测试账户**，每个都有 10000 ETH

---

祝测试顺利！🚀
