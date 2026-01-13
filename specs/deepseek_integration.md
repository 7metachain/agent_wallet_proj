# DeepSeek API 集成文档

## 概述

项目从 OpenAI GPT-4o 迁移到 DeepSeek-v3，使用第三方 DeepSeek API 服务。

## API 配置

### 基本信息

- **API Endpoint**: `https://maas-openapi.wanjiedata.com/api/v1`
- **模型名称**: `deepseek-v3-2-251201`
- **接口标准**: OpenAI 兼容接口
- **API Key**: 存储在环境变量 `DEEPSEEK_API_KEY`

### 环境变量配置

```bash
# .env.local
DEEPSEEK_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
NEXT_PUBLIC_MOCK_MODE=false
```

## 代码修改

### 1. API 客户端配置

**文件**: `app/api/chat/route.ts`

```typescript
const openai = !MOCK_MODE
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://maas-openapi.wanjiedata.com/api/v1",
    })
  : null;
```

### 2. 模型调用

```typescript
const response = await openai!.chat.completions.create({
  model: "deepseek-v3-2-251201",
  messages,
  tools: intentTools,
  tool_choice: "auto",
  temperature: 0.7,
  max_tokens: 1000,
});
```

### 3. 错误处理

错误信息已更新为 "DeepSeek API key" 相关提示。

## 兼容性说明

- ✅ 完全兼容 OpenAI Function Calling 接口
- ✅ 支持 `tools` 和 `tool_choice` 参数
- ✅ 响应格式与 OpenAI 一致
- ⚠️ 需要确认 API 限流和配额限制

## 测试方法

### 手动测试

1. 设置环境变量 `DEEPSEEK_API_KEY`
2. 启动开发服务器：`npm run dev`
3. 在聊天界面输入测试用例
4. 检查 API 响应和意图解析结果

### 自动化测试

使用 `test/test-api.js` 运行测试套件：

```bash
node test/test-api.js
```

测试结果保存在 `test/results/` 目录。

## 注意事项

1. **API Key 安全**: 不要将 API Key 提交到 Git
2. **网络连接**: 确保服务器能访问第三方 API 端点
3. **错误处理**: 网络失败时应有降级方案（Mock 模式）
4. **成本控制**: 注意 API 调用费用，测试时使用 Mock 模式

## 参考资源

- DeepSeek API 文档（第三方服务商提供）
- OpenAI Function Calling 规范（兼容接口）
