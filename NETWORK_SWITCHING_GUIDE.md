# 🌐 网络切换故障排除指南

## 问题：无法切换到其他测试网络

### 症状
- 在 RainbowKit 中选择了 Base Sepolia 或 Ethereum Sepolia
- MetaMask 仍然显示在 Monad Testnet
- 无法切换到其他测试网络

---

## 🔧 解决方案

### 方法 1：手动添加测试网络到 MetaMask（推荐）

#### 添加 Base Sepolia

1. 打开 MetaMask
2. 点击网络下拉菜单 → "添加网络" → "手动添加网络"
3. 填入以下信息：

```
网络名称: Base Sepolia
新的 RPC URL: https://sepolia.base.org
链 ID: 84532
货币符号: ETH
区块浏览器 URL: https://sepolia.basescan.org
```

4. 点击"保存"

#### 添加 Ethereum Sepolia

```
网络名称: Sepolia Testnet
新的 RPC URL: https://rpc.sepolia.org
链 ID: 11155111
货币符号: ETH
区块浏览器 URL: https://sepolia.etherscan.io
```

#### 添加 Arbitrum Sepolia

```
网络名称: Arbitrum Sepolia
新的 RPC URL: https://sepolia-rollup.arbitrum.io/rpc
链 ID: 421614
货币符号: ETH
区块浏览器 URL: https://sepolia.arbiscan.io
```

---

### 方法 2：使用 Chainlist 网站（最简单）

1. 访问：https://chainlist.org/
2. 搜索 "Base Sepolia" 或 "Sepolia"
3. 点击 "Add to Metamask" 按钮
4. 在 MetaMask 中确认添加

---

### 方法 3：刷新页面并重试

1. 添加测试网络后
2. **刷新浏览器页面**（重要！）
3. 再次点击 RainbowKit 的网络选择器
4. 选择你想切换的测试网络
5. MetaMask 应该会弹出切换确认

---

## 🧪 测试步骤

### 1. 切换到 Base Sepolia

```bash
# 1. 确保 Base Sepolia 已添加到 MetaMask
# 2. 刷新浏览器
# 3. 点击 RainbowKit 网络选择器
# 4. 选择 "Base Sepolia"
# 5. 在 MetaMask 中确认切换
```

**验证成功**：
- MetaMask 显示 "Base Sepolia"
- 应用右上角网络图标显示 Base Sepolia
- RainbowKit 显示 Base Sepolia 网络

### 2. 获取测试币

访问以下水龙头获取测试 ETH：

**Base Sepolia**:
- https://sepoliafaucet.com/
- https://www.infura.io/faucet/sepolia

**Ethereum Sepolia**:
- https://sepoliafaucet.com/
- https://faucet.quicknode.com/ethereum/sepolia

### 3. 测试 Aave 操作

```bash
# 切换到 Base Sepolia 后，尝试：

# 存款测试
"Supply 0.01 ETH to Aave"

# 提款测试
"Withdraw 0.005 ETH from Aave"
```

---

## 🐛 常见问题

### Q1: RainbowKit 显示的网络与 MetaMask 不一致

**原因**：MetaMask 没有切换成功

**解决**：
1. 打开 MetaMask
2. 手动点击网络下拉菜单
3. 选择对应的测试网络
4. 刷新浏览器页面

### Q2: 切换网络后余额显示为 0

**原因**：不同网络的账户余额不同

**解决**：
- 需要在对应网络上获取测试币
- 访问对应网络的水龙头

### Q3: 点击 Execute 报错 "Unsupported chain ID"

**原因**：该网络没有配置对应的合约地址

**解决**：
- Monad 测试网：没有 Aave，只能测试 swap 和 transfer
- Base/Sepolia/Arbitrum Sepolia：有 Aave，可以测试完整功能

---

## 📋 网络配置对照表

| 网络 | Chain ID | 是否有 Aave | 是否有 Uniswap | 推荐测试 |
|------|----------|-------------|----------------|----------|
| Monad Testnet | 10143 | ❌ | ❌ | Transfer, Swap (如果有 DEX) |
| Base Sepolia | 84532 | ✅ | ✅ | Aave, Swap, Transfer |
| Ethereum Sepolia | 11155111 | ✅ | ✅ | Aave, Swap, Transfer |
| Arbitrum Sepolia | 421614 | ✅ | ✅ | Aave, Swap, Transfer |

---

## 🎯 快速测试命令

### 在 Base Sepolia 测试：

```
# 1. 查询余额
Check balance

# 2. 存款到 Aave
Supply 0.01 ETH to Aave

# 3. 从 Aave 提款
Withdraw 0.005 ETH from Aave

# 4. 转账
Transfer 0.001 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# 5. 代币交换
Swap 0.01 ETH to USDC
```

---

## 💡 提示

1. **先添加网络**：使用 Chainlist 或手动添加
2. **获取测试币**：每个网络都需要单独获取
3. **刷新页面**：添加网络后记得刷新浏览器
4. **确认切换**：MetaMask 会弹出确认窗口，必须点击确认
5. **查看交易**：使用对应的区块浏览器查看交易状态

---

## 🔗 有用链接

- Chainlist: https://chainlist.org/
- Base Sepolia Faucet: https://sepoliafaucet.com/
- Sepolia Faucet: https://sepoliafaucet.com/
- Base Scan: https://sepolia.basescan.org/
- Etherscan: https://sepolia.etherscan.io/

---

**现在就试试吧！** 🚀

1. 访问 https://chainlist.org/
2. 搜索并添加 "Base Sepolia"
3. 刷新浏览器
4. 在应用中切换到 Base Sepolia
5. 获取测试币并开始测试！
