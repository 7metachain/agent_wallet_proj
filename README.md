# Intent Bot - AI-Powered Web3 Trading

基于意图的交易机器人，用户通过自然语言描述交易意图，AI 自动解析并构建链上交易。

## ✨ Features

- 🤖 **Natural Language Trading** - 用自然语言描述你想做的事
- 💱 **Token Swap** - 支持 Token 兑换
- 🏦 **Aave Integration** - 存入/取出 Aave 赚取收益
- 💸 **Token Transfer** - 发送 Token 到任意地址
- 📊 **Balance Check** - 查询钱包余额

## 🚀 Quick Start

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`：

```bash
cp .env.example .env.local
```

填入必要的 API Keys：

| 变量 | 必填 | 说明 |
|------|------|------|
| `OPENAI_API_KEY` | Mock 模式下可选 | OpenAI API 密钥 |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | 是 | WalletConnect 项目 ID |
| `NEXT_PUBLIC_MOCK_MODE` | 否 | 设为 `true` 启用 Mock 模式 |

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

### 🧪 Mock 模式（无需 API Key）

如果你暂时没有 OpenAI API Key，可以启用 Mock 模式来测试 UI：

```env
NEXT_PUBLIC_MOCK_MODE=true
```

Mock 模式下，AI 会返回预设的模拟响应，让你可以测试完整的用户流程。

## 🌐 Deployment

### Vercel 部署（推荐）

最简单的部署方式是使用 [Vercel](https://vercel.com)：

1. **Fork 或推送代码到 GitHub**

```bash
git remote add origin https://github.com/your-username/intent-bot.git
git push -u origin main
```

2. **导入到 Vercel**
   - 访问 [vercel.com/new](https://vercel.com/new)
   - 选择你的 GitHub 仓库
   - 点击 Import

3. **配置环境变量**
   
   在 Vercel 项目设置 → Environment Variables 中添加：
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

4. **部署**
   
   点击 Deploy，等待部署完成即可！

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/intent-bot)

### 手动部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器（默认端口 3000）
npm start

# 或指定端口
PORT=8080 npm start
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# 构建并运行
docker build -t intent-bot .
docker run -p 3000:3000 -e OPENAI_API_KEY=xxx -e NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx intent-bot
```

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Web3**: wagmi v2, viem, RainbowKit
- **AI**: OpenAI GPT-4o, Function Calling
- **Protocols**: Uniswap, Aave V3

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── chat/         # AI 意图解析
│   │   └── transaction/  # 交易构建
│   ├── page.tsx          # 主页面
│   └── layout.tsx        # 根布局
├── components/            # React 组件
│   ├── chat/             # 聊天相关组件
│   ├── transaction/      # 交易相关组件
│   └── ui/               # shadcn/ui 组件
├── lib/                   # 工具库
│   ├── ai/               # AI 相关
│   └── web3/             # Web3 相关
├── types/                 # TypeScript 类型
└── hooks/                 # React Hooks
```

## 🔧 Development

### 分支策略

- `main` - 主分支，保持稳定
- `feature/*` - 功能分支
- `fix/*` - Bug 修复分支

### 提交规范

```
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

### 本地开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint
```

## 📝 Team Tasks

查看 [PROJECT_SPEC.md](./specs/PROJECT_SPEC.md) 获取详细的团队分工和任务列表。

## 🌐 Supported Networks

- Ethereum Sepolia
- Base Sepolia
- Arbitrum Sepolia

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://rainbowkit.com)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Aave V3 Documentation](https://docs.aave.com)

## 📄 License

MIT
