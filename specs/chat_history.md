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

##问题：aave是以太坊生态，monad生态中和他对举的解决方案是什么？

Intent Bot Monad 生态迁移开发计划
架构变更概览
迁移
目标架构
Curvance
Monad Testnet
当前架构
Aave V3
Base/Arbitrum
开发阶段
Phase 1: 网络层迁移 (Day 1)
目标: 将 wagmi/RainbowKit 配置从 Base/Arbitrum 切换到 Monad Testnet

修改文件:

lib/web3/config.ts - 替换链配置为 Monad Testnet
lib/web3/tokens.ts - 添加 Monad 测试网 Token 地址
关键改动:

// lib/web3/config.ts - 定义 Monad Testnet 链
const monadTestnet = {
  id: 10143,  // 需确认实际 Chain ID
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' } }
};
---

Phase 2: Curvance 协议集成 (Day 2-3)
目标: 创建 Curvance 协议交互模块，替代 Aave

新增文件:

lib/web3/abi/curvance.ts - Curvance Pool 合约 ABI
lib/web3/curvance.ts - Curvance 交互逻辑（supply/withdraw）
修改文件:

app/api/transaction/route.ts - 更新交易构建逻辑
核心接口设计:

// lib/web3/curvance.ts
export async function buildSupplyTx(params: {
  token: string;
  amount: string;
  userAddress: Address;
}): Promise<PreparedTransaction>;

export async function buildWithdrawTx(params: {
  token: string;
  amount: string;
  userAddress: Address;
}): Promise<PreparedTransaction>;
---

Phase 3: AI 意图层适配 (Day 3-4)
目标: 更新 AI 工具定义和系统提示词，反映 Curvance 协议

修改文件:

lib/ai/prompts.ts - 将 Aave 替换为 Curvance
lib/ai/tools.ts - 更新工具描述
app/api/chat/route.ts - 更新意图类型映射
关键改动:

// lib/ai/tools.ts
{
  name: "supply_to_curvance",  // 原 supply_to_aave
  description: "Supply/deposit tokens to Curvance lending protocol on Monad to earn interest.",
  ...
}
---

Phase 4: 测试与验证 (Day 4-5)
目标: 更新测试用例，验证 Monad + Curvance 流程

修改文件:

test/intent-test-cases.json - 更新测试用例
test/test-api.js - 更新系统提示词
测试用例更新:

将 "存到 Aave" 改为 "存到 Curvance"
添加 Monad 特定场景测试
---

文件变更清单
| 文件 | 操作 | 说明 |

|------|------|------|

| lib/web3/config.ts | 修改 | 替换为 Monad 链配置 |

| lib/web3/tokens.ts | 修改 | 添加 Monad Token 地址 |

| lib/web3/abi/curvance.ts | 新增 | Curvance 合约 ABI |

| lib/web3/curvance.ts | 新增 | Curvance 交互模块 |

| lib/ai/prompts.ts | 修改 | Aave → Curvance |

| lib/ai/tools.ts | 修改 | 更新工具定义 |

| app/api/chat/route.ts | 修改 | 更新意图映射 |

| app/api/transaction/route.ts | 修改 | 集成 Curvance 交易构建 |

| test/intent-test-cases.json | 修改 | 更新测试用例 |

---

风险与依赖
| 风险 | 影响 | 缓解措施 |

|------|------|---------|

| Curvance 合约地址/ABI 未公开 | 阻塞 Phase 2 | 先用 Mock 实现，待信息公开后替换 |

| Monad Testnet RPC 不稳定 | 影响测试 | 准备备用 RPC endpoint |

| Token 地址未知 | 阻塞交易 | 先用占位符，后续更新 |

---

时间安排
Day 1: Phase 1 - 网络层迁移
Day 2-3: Phase 2 - Curvance 协议集成
Day 3-4: Phase 3 - AI 意图层适配
Day 4-5: Phase 4 - 测试与验证