# DeepSeek API 配置指南

## 🎯 为什么选择 DeepSeek？

- ✅ **免费额度** - 新用户有免费 tokens
- ✅ **API 兼容** - 完全兼容 OpenAI 格式
- ✅ **性能强大** - 支持 Function Calling
- ✅ **中文友好** - 对中文理解更好

---

## 📝 获取 DeepSeek API Key

### 步骤 1: 注册账号

访问: https://platform.deepseek.com/

点击右上角 **注册 / Sign Up**

### 步骤 2: 获取 API Key

1. 登录后，访问: https://platform.deepseek.com/api_keys
2. 点击 **Create API Key**
3. 复制生成的 Key (格式: `sk-...`)

### 步骤 3: 配置到项目

打开 `.env.local` 文件，将 `YOUR_DEEPSEEK_API_KEY_HERE` 替换为你的 API Key:

```env
OPENAI_API_KEY=sk-your-actual-deepseek-key-here
```

---

## 🚀 启动项目

配置完成后，重启开发服务器：

```bash
npm run dev
```

访问: http://localhost:3000

---

## 🧪 测试 AI 功能

### 测试输入：

```
"把我100USDC换成MON，然后质押，领取收益后转给 0x1234567890123456789012345678901234567890"
```

### 预期结果：

AI 应该生成 4 个意图卡片：
1. 💱 Swap 100 USDC → MON
2. 🏦 Stake MON to validator
3. 💰 Claim staking rewards from validator
4. 💸 Transfer MON to 0x1234...

---

## 🔄 切换回 OpenAI

如果想使用 OpenAI GPT-4，修改 `.env.local`:

```env
# 注释掉 DeepSeek 配置
# OPENAI_API_KEY=sk-deepseek-key
# OPENAI_BASE_URL=https://api.deepseek.com
# OPENAI_MODEL=deepseek-chat

# 启用 OpenAI 配置
OPENAI_API_KEY=sk-proj-your-openai-key
# OPENAI_BASE_URL 不填写，默认使用 OpenAI
OPENAI_MODEL=gpt-4o
```

---

## 📊 DeepSeek 模型说明

### deepseek-chat
- **Context Length**: 64K tokens
- **Function Calling**: ✅ 支持
- **Price**: 免费额度 + $0.14/1M tokens (input)
- **特点**: 适合对话和复杂推理任务

### deepseek-coder
- **Context Length**: 16K tokens
- **Function Calling**: ✅ 支持
- **Price**: 免费额度 + $0.14/1M tokens (input)
- **特点**: 专门优化代码生成（如果需要可以切换）

---

## 🐛 常见问题

### Q: API Key 无效？
A: 确保从 https://platform.deepseek.com/api_keys 获取的 Key 是有效的，并且已经激活。

### Q: 请求失败？
A: 检查 `.env.local` 中的配置：
```env
OPENAI_BASE_URL=https://api.deepseek.com  # 注意没有 /v1
OPENAI_MODEL=deepseek-chat
```

### Q: Function Calling 不工作？
A: DeepSeek 完全支持 Function Calling，确保 `OPENAI_MODEL=deepseek-chat`

### Q: 想切换回 Mock 模式？
A: 修改 `.env.local`:
```env
NEXT_PUBLIC_MOCK_MODE=true
```

---

## 💰 费用对比

| 提供商 | 模型 | 免费额度 | 价格 (Input) | 价格 (Output) |
|--------|------|---------|-------------|--------------|
| **DeepSeek** | deepseek-chat | ✅ 有 | $0.14/1M tokens | $0.28/1M tokens |
| OpenAI | gpt-4o | ❌ 无 | $2.50/1M tokens | $10.00/1M tokens |
| OpenAI | gpt-3.5-turbo | ❌ 无 | $0.50/1M tokens | $1.50/1M tokens |

**推荐**: 开发测试阶段使用 DeepSeek，生产环境根据需求选择。

---

## 🎉 完成配置

配置完成后，你的 AI 助手将能够：

✅ 理解自然语言交易意图
✅ 解析复杂的多步骤操作
✅ 支持中英文混合输入
✅ 生成准确的交易参数

祝你使用愉快！🚀
