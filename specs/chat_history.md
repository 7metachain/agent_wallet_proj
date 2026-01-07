## 问题： 我们需要在同一个项目上合作开发。初始前提需要的是什么？

回答：
🤝 多人协作开发，首先需要以下几步：
第一步：初始化项目 + Git 仓库
1. 创建 Next.js 项目（统一的代码框架）2. 初始化 Git 仓库3. 创建 .gitignore（排除 node_modules、.env.local 等）4. 创建 .env.example（环境变量模板，方便团队成员配置）5. 推送到 GitHub/GitLab（团队共享代码）
第二步：统一开发规范
1. 分支策略：main（主分支）→ feature/xxx（功能分支）2. 提交规范：feat:、fix:、docs: 等前缀3. 代码风格：ESLint + Prettier 配置4. TypeScript 严格模式
第三步：分配初始任务
根据 PROJECT_SPEC.md 的分工，每人领取自己的模块：
前端：先搭 UI 骨架（Chat 组件、钱包连接）
后端：先搭 API 路由骨架（/api/chat）
合约：先整理 Token 地址和 ABI
🚀 现在需要我做的是：
切换到 Agent 模式，我将帮你完成：
✅ 初始化 Next.js 14 项目
✅ 配置 TypeScript + Tailwind CSS
✅ 安装依赖（wagmi、viem、RainbowKit、shadcn/ui、ai）
✅ 创建项目目录结构
✅ 初始化 Git + .gitignore
✅ 创建 .env.example
✅ 搭建基础组件和 API 路由骨架
完成后，你就可以把项目推到 GitHub，团队成员 git clone 后各自开发自己的模块。

