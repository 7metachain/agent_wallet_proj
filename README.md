# Monad Intent Bot - AI-Powered Trading on Monad

基于意图的交易机器人，专为 Monad 生态打造。用户通过自然语言描述交易意图，AI 自动解析并构建链上交易。

## 🚀 Why Monad?

- ⚡ **10,000 TPS** - 超高性能区块链
- 🎯 **0.8s Finality** - 快速交易确认
- 🔧 **Full EVM Compatibility** - 完全兼容以太坊工具链
- 💰 **Low Gas Fees** - 相比主网大幅降低交易成本

## ✨ Features

- 🤖 **Natural Language Trading** - 用自然语言描述你想做的事
- 💱 **Token Swap** - 在 Monad 上兑换 MON、WMON、USDC 等代币
- 🏦 **Native Staking** - 质押 MON 到验证者节点赚取收益（每区块 25 MON 奖励）
- 💸 **Token Transfer** - 在 Monad 上发送 Token 到任意地址
- 📊 **Balance Check** - 查询 Monad 钱包余额

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
- **Blockchain**: Monad (Chain ID: 143 for Mainnet, 10143 for Testnet)
- **AI**: OpenAI GPT-4o, Function Calling
- **Protocols**: Uniswap v4 on Monad, Monad Native Staking

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

- **Monad Mainnet** (Chain ID: 143)
  - RPC: https://rpc.monad.xyz
  - Explorer: https://monadvision.com

- **Monad Testnet** (Chain ID: 10143)
  - RPC: https://testnet.monad.xyz
  - Explorer: https://testnet.monadexplorer.com
  - Faucet: https://faucet.monad.xyz

## 🪙 Supported Tokens

### Monad Mainnet
- MON (Native token)
- WMON (Wrapped MON): `0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A`
- USDC, USDT, WETH, WBTC

### Monad Testnet
- MON (Testnet tokens from faucet)
- WMON: `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701`
- Get testnet tokens:
  - [Monad Faucet](https://faucet.monad.xyz)
  - [QuickNode Faucet](https://faucet.quicknode.com/monad/testnet)
  - Nabla Discord Faucet for USDC/USDT/WETH/WBTC

## 🔗 Resources

- [Monad Official Website](https://www.monad.xyz)
- [Monad Documentation](https://docs.monad.xyz)
- [Next.js Documentation](https://nextjs.org/docs)
- [wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://rainbowkit.com)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Uniswap on Monad](https://blog.uniswap.org/monad-mainnet-is-now-live-on-uniswap)

## 📄 License

MIT
