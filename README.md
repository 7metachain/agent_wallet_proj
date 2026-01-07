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
- `OPENAI_API_KEY` - OpenAI API 密钥
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect 项目 ID

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

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

## 📝 Team Tasks

查看 [PROJECT_SPEC.md](./specs/PROJECT_SPEC.md) 获取详细的团队分工和任务列表。

## 🌐 Supported Networks

- Ethereum Sepolia
- Base Sepolia
- Arbitrum Sepolia

## 📄 License

MIT

