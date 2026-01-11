# 测试网测试指南

本指南帮助你设置测试环境并进行测试。

## 🚀 快速开始

### 1. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 2. 连接钱包

使用 RainbowKit 连接你的钱包（MetaMask、WalletConnect 等）

### 3. 切换到测试网

在钱包中切换到以下任一测试网：
- Ethereum Sepolia
- Base Sepolia
- Arbitrum Sepolia

## 💰 获取测试代币

在测试前，你需要获取测试网的 ETH（用于支付 Gas 费）：

### Ethereum Sepolia

🔗 **水龙头（Faucet）:**
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [QuickNode Sepolia Faucet](https://faucet.quicknode.com/ethereum/sepolia)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

**要求:**
- Twitter 账号
- 或在 Alchemy 注册账号

### Base Sepolia

🔗 **水龙头（Faucet）:**
- [Base Sepolia Faucet](https://www.coinbase.com/developer-platform/faucets/base-sepolia-faucet)
- [QuickNode Base Faucet](https://faucet.quicknode.com/base/base-sepolia)

### Arbitrum Sepolia

🔗 **水龙头（Faucet）:**
- [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/arbitrum-sepolia)
- [Chainlink Faucet](https://faucets.chain.link/arbitrum-sepolia)

## 🪙 获取测试代币（USDC 等）

在测试网中，你需要先获取 ETH（用于 Gas），然后可以通过 Swap 获得 USDC 等代币。

### 方法 1: 使用 Uniswap Swap

1. 连接钱包到测试网
2. 访问 Uniswap 测试网:
   - Ethereum: https://app.uniswap.org/explore
   - Base: https://app.uniswap.org/explore
   - Arbitrum: https://app.uniswap.org/explore
3. 将一些 ETH 换成 USDC

### 方法 2: 使用测试代币水龙头

某些测试网有专门的测试代币水龙头：

**Ethereum Sepolia 测试代币:**
- USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- DAI: `0x68194a729C2450ad26072b3D33ADaCbcef39D574`
- WBTC: `0x29f2D40B0605204364af54EC677bD022dA4bD256`

在 Etherscan 上手动导入这些代币地址到你的钱包。

### 方法 3: 从其他合约获取

某些测试项目提供免费测试代币：
- 搜索 "Sepolia test token faucet"
- 查看 Uniswap 或 Aave 的测试文档

## 🧪 测试场景

### 场景 1: Swap 测试

```
用户输入: "把 10 个 USDC 换成 ETH"
预期结果:
1. AI 解析意图为 Swap
2. 构建 approve + swap 交易
3. 用户签名确认
4. 交易执行成功
5. 余额变化正确
```

**检查清单:**
- [ ] USDC 授权成功
- [ ] Swap 执行成功
- [ ] USDC 余额减少
- [ ] ETH 余额增加
- [ ] Gas 费合理

### 场景 2: Supply 到 Aave

```
用户输入: "存 100 USDC 到 Aave"
预期结果:
1. AI 解析意图为 Supply
2. 构建 approve + supply 交易
3. 用户签名确认
4. 存入成功
```

**检查清单:**
- [ ] USDC 授权给 Aave Pool
- [ ] Supply 交易成功
- [ ] USDC 余额减少
- [ ] aUSDC 余额增加（通过查看 Aave 合约）

### 场景 3: 从 Aave Withdraw

```
用户输入: "从 Aave 取出 50 USDC"
预期结果:
1. AI 解析意图为 Withdraw
2. 构建 withdraw 交易
3. 用户签名确认
4. 取出成功
```

**检查清单:**
- [ ] Withdraw 交易成功
- [ ] USDC 余额增加
- [ ] aUSDC 余额减少

### 场景 4: Transfer

```
用户输入: "转 0.1 ETH 到 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
预期结果:
1. AI 解析意图为 Transfer
2. 构建转账交易
3. 用户签名确认
4. 转账成功
```

**检查清单:**
- [ ] ETH 余额减少
- [ ] 接收地址收到 ETH
- [ ] Gas 费合理

### 场景 5: Check Balance

```
用户输入: "查询我的余额"
预期结果:
1. AI 解析意图为 Check Balance
2. 查询所有代币余额
3. 显示余额信息
```

**检查清单:**
- [ ] 显示 ETH 余额
- [ ] 显示所有代币余额
- [ ] 余额数据准确

## 🔍 调试技巧

### 1. 查看交易详情

交易发送后，点击浏览器图标查看交易详情：

**Ethereum Sepolia:**
https://sepolia.etherscan.io/tx/{txHash}

**Base Sepolia:**
https://sepolia.basescan.org/tx/{txHash}

**Arbitrum Sepolia:**
https://sepolia.arbiscan.io/tx/{txHash}

### 2. 检查交易失败原因

在区块浏览器中查看:
- **Error Message** - 具体的错误信息
- **Gas Used** - Gas 消耗情况
- **Transaction Details** - 输入数据

常见错误:
- `Insufficient funds` - 余额不足
- `Execution reverted` - 合约执行失败
- `Gas required exceeds allowance` - Gas 限制不足

### 3. 检查授权状态

在 Etherscan 上查看 Token 的 Approve 事件:
1. 进入 Token 合约页面
2. 点击 "Events" → "Approval"
3. 查找你的地址和授权金额

### 4. 使用 Console 日志

在浏览器 Console 中查看详细日志:
```javascript
// 打开浏览器开发者工具 (F12)
// 查看 Console 标签
```

代码中已经添加了 `console.log` 和 `console.error`

## 🛠 常见问题

### Q: 交易一直处于 "Confirming" 状态

**A:**
1. 检查钱包是否弹出签名窗口
2. 在钱包中查看交易队列
3. 尝试提高 Gas Price
4. 检查网络连接

### Q: 交易失败 "Insufficient funds"

**A:**
1. 确保有足够的 ETH 支付 Gas
2. 建议保留至少 0.01 ETH
3. 从水龙头获取更多测试 ETH

### Q: Approval 交易成功但 Swap 失败

**A:**
1. 检查授权金额是否足够（应该是 maxUint256）
2. 查看具体错误信息
3. 确认 Pool 地址正确
4. 检查滑点设置是否合理

### Q: 找不到测试代币

**A:**
1. 在钱包中手动导入代币合约地址
2. 使用 Etherscan 查看代币余额
3. 尝试从 Uniswap Swap 获取
4. 联系团队获取测试代币

### Q: Mock 模式下没有代币

**A:**
Mock 模式只测试 UI 流程，不执行真实交易。如需完整测试:
1. 关闭 Mock 模式
2. 连接真实钱包
3. 切换到测试网
4. 获取测试代币

## 📊 测试报告模板

测试完成后，填写以下报告：

```markdown
## 测试报告 - {日期}

### 测试环境
- 网络: {Ethereum Sepolia / Base Sepolia / Arbitrum Sepolia}
- 钱包: {MetaMask / WalletConnect / 其他}
- 测试账号: {0x...}

### 测试结果

| 场景 | 状态 | 备注 |
|------|------|------|
| Swap | ✅ / ❌ | |
| Supply | ✅ / ❌ | |
| Withdraw | ✅ / ❌ | |
| Transfer | ✅ / ❌ | |
| Check Balance | ✅ / ❌ | |

### 发现的问题
1. ...
2. ...

### 交易哈希
- Swap: {txHash}
- Supply: {txHash}
- ...
```

## 🔗 有用的链接

### 区块浏览器
- **Ethereum Sepolia:** https://sepolia.etherscan.io
- **Base Sepolia:** https://sepolia.basescan.org
- **Arbitrum Sepolia:** https://sepolia.arbiscan.io

### 测试网水龙头汇总
- https://faucet.quicknode.com
- https://chainlink.org/faucets
- https://www.alchemy.com/faucets/ethereum-sepolia

### 协议文档
- **Uniswap V3:** https://docs.uniswap.org
- **Aave V3:** https://docs.aave.com/developers
- **wagmi:** https://wagmi.sh

### 合约地址（Ethereum Sepolia）
```
Uniswap V3 Router: 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E
Aave V3 Pool: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
USDC: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
DAI: 0x68194a729C2450ad26072b3D33ADaCbcef39D574
```

## 🎯 下一步

1. ✅ 获取测试 ETH
2. ✅ 获取测试代币
3. ✅ 连接钱包到测试网
4. ✅ 测试各个功能场景
5. ✅ 记录问题和交易哈希
6. ✅ 验证余额变化
7. ✅ 完善错误处理

开始测试吧！ 🚀
