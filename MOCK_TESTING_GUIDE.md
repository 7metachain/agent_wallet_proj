# 🎭 Mock 模式测试指南

## ✅ 已完成的模拟功能

### 1. ✅ AI 理解测试
- DeepSeek AI 可以正确理解您的需求
- 解析 "把我 100 USDC 换成 MONAD，然后拿去质押，最后把收益地址设成我朋友的钱包"
- 返回正确的意图：swap + stake_with_yield

### 2. ✅ UI 显示测试
- 交易卡片正确显示
- Execute 按钮可点击
- 状态提示正常

### 3. ✅ 模拟执行
- 点击 Execute 后模拟交易
- 显示加载状态
- 模拟成功确认

---

## 🚀 立即测试

### 1. 启用 Mock 模式
```bash
# .env 已经配置了 DeepSeek
# NEXT_PUBLIC_MOCK_MODE=false (当前状态)
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 打开浏览器
访问: http://localhost:3001

### 4. 测试对话

#### 测试 1: 基础 Swap
```
用户输入: "Swap 100 USDC to MONAD"

期望结果:
- ✅ AI 回复
- ✅ 显示 Swap 交易卡片
- ✅ 显示 "100 USDC → MONAD"
- ✅ Execute 按钮可点击
```

#### 测试 2: 完整流程（您的原始需求）
```
用户输入: "把我 100 USDC 换成 MONAD，然后拿去质押，最后把收益地址设成我朋友的钱包"

期望结果:
- ✅ AI 解析为 2 个意图
- ✅ 意图 1: Swap 100 USDC → MONAD
- ✅ 意图 2: Stake 100 MONAD → Yield to friend
- ✅ 两张交易卡片都显示
- ✅ 两个 Execute 按钮
```

#### 测试 3: 英文版本
```
用户输入: "Swap 100 USDC to MONAD and stake it, send yield to my friend at 0x1234567890123456789012345678901234567890"

期望结果:
- ✅ 正确解析所有参数
- ✅ 显示朋友地址
```

---

## 📊 控制台日志

在执行过程中，您会看到：

```
🤖 [AI Call] Calling deepseek API...
  Provider: deepseek
  Model: deepseek-chat
  Message: 把我 100 USDC 换成 MONAD...

✅ [AI Response] Received response from deepseek
  Tool call 1: swap_tokens {fromToken: "USDC", toToken: "MONAD", amount: "100"}
  Tool call 2: stake_with_yield_recipient {token: "MONAD", amount: "100", yieldRecipient: "..."}

📋 [Intents] Parsed 2 intent(s):
  Intent 1: swap {fromToken: "USDC", toToken: "MONAD", amount: "100"}
  Intent 2: stake_with_yield {token: "MONAD", amount: "100", yieldRecipient: "..."}

🔍 [TransactionCard] Rendering for intent: swap - Connected: false
🔍 [TransactionCard] Rendering for intent: stake_with_yield - Connected: false

🎭 [Mock] Executing stake_with_yield intent
  Token: MONAD
  Amount: 100
  Yield Recipient: 0x...
```

---

## 🎯 功能演示

### 场景 1: 基础 Swap
```
输入: "Swap 50 USDC to ETH"
结果:
- 1 个交易卡片
- Swap 50 USDC → ETH
- 模拟执行成功
```

### 场景 2: 质押给朋友
```
输入: "Stake 100 MONAD and send yield to 0xFE75Bb94Ef80338a57007Ff7a6883fEF7222B0c0"
结果:
- 1 个交易卡片
- Stake 100 MONAD → Yield to 0xFE75...
- 模拟执行成功
```

### 场景 3: 完整流程
```
输入: "Swap 100 USDC to MONAD, then stake it and send yield to my friend"
结果:
- 2 个交易卡片
- 第1步: Swap 100 USDC → MONAD
- 第2步: Stake 100 MONAD → Yield to friend
- 依次模拟执行
```

---

## 💡 与真实部署的区别

### Mock 模式（当前）
- ✅ 无需 ETH
- ✅ 无需部署合约
- ✅ AI 理解正确
- ✅ UI 流程完整
- ❌ 不执行真实链上交易
- ❌ 无真实代币

### 真实部署
- ✅ 真实链上交易
- ✅ 真实代币转账
- ⚠️ 需要测试 ETH
- ⚠️ 需要部署合约

---

## 🔄 切换到真实部署

当您准备好真实部署时：

### 1. 获取测试 ETH
访问: https://www.alchemy.com/
- 注册免费账号
- 使用他们的 Faucet

### 2. 部署合约
```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### 3. 更新 .env
```bash
NEXT_PUBLIC_MONAD_TOKEN=0x部署的地址
NEXT_PUBLIC_STAKING_POOL=0x部署的地址
```

### 4. 重启服务器
```bash
npm run dev
```

---

## 📝 测试清单

请按以下顺序测试：

- [ ] 服务器启动成功
- [ ] 页面可以打开
- [ ] 输入 "Swap 100 USDC to MONAD"
- [ ] 看到 Swap 卡片
- [ ] 点击 Execute 显示加载
- [ ] 输入完整需求: "把我 100 USDC 换成 MONAD，然后拿去质押，最后把收益地址设成我朋友的钱包"
- [ ] 看到两个交易卡片
- [ ] 卡片信息正确
- [ ] Execute 按钮可点击
- [ ] 执行后显示成功状态

---

**现在就试试吧！** 🎉

打开 http://localhost:3001 开始测试！
