# Mock 模式快���测试指南

## ✅ 已启用配置

当前已启用 Mock 模式：
- ✅ **真实 AI 调用** (DeepSeek)
- ✅ **模拟交易执行** (无需 MetaMask)
- ✅ **显示执行结果** (交易哈希、成功状态)
- ✅ **余额查询** (真实链上数据)

## 🚀 快速测试步骤

### 1. ���启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
npm run dev
```

### 2. 刷新浏览器

访问 `http://localhost:3000`，连接钱包

### 3. 测试所有功能

#### ✅ Check Balance (真实查询)
```
输入: "查询余额" 或 "check balance"
结果: 显示真实的 MON 余额
速度: 2-3 秒
```

#### ✅ Transfer (模拟执行)
```
输入: "transfer 0.01 mon to 0xADB60036FE9d4c269Ed5ca8C5958dd29bc66D814"
结果: 显示交易成功，生成模拟交易哈希
速度: 1-2 秒 (无需 MetaMask)
```

#### ✅ Supply (模拟执行)
```
输入: "supply 0.01 MON to Aave"
结果: 显示交易成功，生成模拟交易哈希
速度: 1-2 秒
```

#### ✅ Stake (模拟执行)
```
输入: "stake 0.01 MON, yield to 0xADB60036FE9d4c269Ed5ca8C5958dd29bc66D814"
结果: 显示交易成功，生成模拟交易哈希
速度: 1-2 秒
```

#### ✅ Swap (模拟执行)
```
输入: "swap 0.01 ETH to USDC"
结果: 显示交易成功，生成模拟交易哈希
速度: 1-2 秒
```

## 🎨 界面提示

Mock 模式下，每个交易卡片会显示：
- 🎭 **黄色背景**：标识这是 Mock 模式
- **交易状态**：显示 "Confirmed" 绿色徽章
- **模拟交易哈希**：���击可在区块链浏览器查看（但不是真实交易）

## 📊 日志输出

控制台会显示：
```
🎭 [Mock Mode] Simulating transactions without blockchain execution...
[wallet-hook] Simulating tx 1/1
[wallet-hook] Mock transaction 1 completed: 0xabc123...
✅ [Mock Mode] All transactions simulated successfully!
```

## 🔧 切换回真实模式

编辑 `.env.local`：
```bash
# NEXT_PUBLIC_MOCK_MODE=true  # 注释掉这行
```

重启服务器后，交易将需要 MetaMask 确认并真实执行。

## 💡 使用建议

### 开发阶段（推荐 Mock 模式）
- ✅ 快速测试 AI 意图识别
- ✅ 验证 UI 交互流程
- ✅ 测试交易构建逻辑
- ✅ 无需等待 RPC

### 测试阶段（真实模式）
- ✅ 验证真实交易执行
- ✅ 测试 MetaMask 集成
- ✅ 检查 Gas 费用
- ⏱️ 需要等待 RPC（较慢）

### Hackathon 演示
- 🎬 **主要演示**：使用 Mock 模式（流畅）
- ✅ **展示真实交易**：提前录制 1-2 个真实交易的视频
- 📝 **强调技术**：AI 意图识别、多链支持、Yield Forwarding

## 🐛 常见问题

**Q: 余额查询是真实的吗？**
A: 是的！Mock 模式只模拟交易执行，余额查询仍然调用真实的 RPC。

**Q: 模拟的交易哈有意义吗？**
A: 没有意义。它们是随机生成的，不代表真实的链上交易。

**Q: 如何判断是否在 Mock 模式？**
A: 交易卡片会有黄色背景，并显示 "🎭 Mock Mode" 提示。

**Q: Mock 模式下 AI 还是真实调用的吗？**
A: 是的！Mock 模式只模拟交易执行，AI 调用完全真实。

---

## 🎯 快速命令清单

```bash
# 启用 Mock 模式
NEXT_PUBLIC_MOCK_MODE=true

# 禁用 Mock 模式（真实交易）
# NEXT_PUBLIC_MOCK_MODE=true

# 重启服务器
npm run dev
```

祝测试顺利！🚀
