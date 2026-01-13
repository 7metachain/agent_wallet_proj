const fs = require('fs');
const path = require('path');

// ============================================
// 配置
// ============================================
const API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3OTcwNjA5NDIsImtleSI6IjVLNzVaOFROQzlGNEhNMzdQOVk3In0.gIpJqwNha8UW3_FhUMGkADNGf-HbkGH5NqhfEWmFFG4";
const MODEL = "deepseek-v3-2-251201";
const API_URL = "https://maas-openapi.wanjiedata.com/api/v1/chat/completions";

// ============================================
// 系统提示词 - Monad + Curvance
// ============================================
const SYSTEM_PROMPT = `You are an AI assistant for a Web3 trading bot called "Intent Bot" on the Monad blockchain. Your job is to understand user's intent and help them execute blockchain transactions.

## Network: Monad Testnet
Monad is a high-performance EVM-compatible L1 blockchain with parallel execution.

## Your Capabilities:
1. **swap_tokens**: Exchange one token for another (e.g., USDC to MON)
2. **supply_to_curvance**: Deposit tokens into Curvance lending protocol to earn interest
3. **withdraw_from_curvance**: Withdraw tokens from Curvance
4. **transfer_token**: Send tokens to another address
5. **check_balance**: Check wallet token balances

## Guidelines:
- Parse user's natural language and call the appropriate function(s)
- Use Monad token symbols: MON (native), WMON, USDC, USDT, DAI
- Support both English and Chinese inputs
- Always respond in the same language the user used

## 处理非交易请求：
- 如果用户打招呼或闲聊，友好回复并简要介绍你的功能，不要调用工具
- 如果用户询问 DeFi/区块链/Monad/Curvance 知识，简洁解答并引导到具体操作
- 如果意图不明确，友好地询问用户想要完成什么操作
- 只有当用户明确表达交易意图时，才调用相应工具函数
- 不要对模糊请求强行调用工具
- Curvance 是 Monad 原生借贷协议（类似于 Aave）`;

// ============================================
// 意图工具定义 - Monad + Curvance
// ============================================
const intentTools = [
  {
    type: "function",
    function: {
      name: "swap_tokens",
      description: "Swap/exchange one token for another token on Monad.",
      parameters: {
        type: "object",
        properties: {
          fromToken: { type: "string", description: "The token to swap from (e.g., USDC, MON)" },
          toToken: { type: "string", description: "The token to swap to (e.g., MON, USDC)" },
          amount: { type: "string", description: "The amount to swap" },
        },
        required: ["fromToken", "toToken", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "supply_to_curvance",
      description: "Supply/deposit tokens to Curvance lending protocol on Monad to earn interest.",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "The token to supply (e.g., MON, USDC)" },
          amount: { type: "string", description: "The amount to supply" },
        },
        required: ["token", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "withdraw_from_curvance",
      description: "Withdraw tokens from Curvance lending protocol on Monad.",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "The token to withdraw" },
          amount: { type: "string", description: "The amount to withdraw" },
        },
        required: ["token", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "transfer_token",
      description: "Transfer/send tokens to another address on Monad.",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "The token to transfer" },
          amount: { type: "string", description: "The amount to transfer" },
          to: { type: "string", description: "The recipient address" },
        },
        required: ["token", "amount", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_balance",
      description: "Check token balance in wallet on Monad.",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "Specific token to check" },
        },
        required: [],
      },
    },
  },
];

// ============================================
// 测试结果收集器
// ============================================
const results = {
  timestamp: new Date().toISOString(),
  model: MODEL,
  total: 0,
  passed: 0,
  failed: 0,
  byCategory: {},
  details: []
};

// ============================================
// 加载测试用例
// ============================================
function loadTestCases() {
  const testCasesPath = path.join(__dirname, 'intent-test-cases.json');
  const data = fs.readFileSync(testCasesPath, 'utf-8');
  return JSON.parse(data).cases;
}

// ============================================
// 调用 API
// ============================================
async function callAPI(userMessage) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      tools: intentTools,
      tool_choice: 'auto',
      temperature: 0.7,
      stream: false
    })
  });

  return await response.json();
}

// ============================================
// 评估单个测试用例
// ============================================
function evaluateResult(testCase, apiResponse) {
  const expected = testCase.expected;
  const message = apiResponse.choices?.[0]?.message;
  
  let passed = true;
  let reason = '';
  let actualIntent = null;
  let actualParams = null;
  let actualContent = message?.content || '';

  // 检查是否有工具调用
  const hasToolCall = message?.tool_calls && message.tool_calls.length > 0;
  
  if (hasToolCall) {
    actualIntent = message.tool_calls[0].function.name;
    try {
      actualParams = JSON.parse(message.tool_calls[0].function.arguments);
    } catch (e) {
      actualParams = {};
    }
  }

  if (expected.hasIntent) {
    // 期望有意图
    if (!hasToolCall) {
      passed = false;
      reason = `期望意图 ${expected.intentType}，但未触发工具调用`;
    } else if (actualIntent !== expected.intentType) {
      passed = false;
      reason = `期望意图 ${expected.intentType}，实际 ${actualIntent}`;
    } else {
      // 检查关键参数是否匹配
      if (expected.params) {
        for (const [key, value] of Object.entries(expected.params)) {
          if (actualParams[key] === undefined) {
            // 参数缺失，但不一定是错误（某些参数可能是可选的）
            continue;
          }
          // 忽略大小写比较
          const actualValue = String(actualParams[key]).toLowerCase();
          const expectedValue = String(value).toLowerCase();
          if (actualValue !== expectedValue) {
            passed = false;
            reason = `参数 ${key}: 期望 "${value}"，实际 "${actualParams[key]}"`;
            break;
          }
        }
      }
    }
  } else {
    // 期望无意图（普通对话）
    if (hasToolCall) {
      passed = false;
      reason = `期望普通对话，但触发了工具调用: ${actualIntent}`;
    } else if (expected.responseContains && actualContent) {
      // 检查回复是否包含期望关键词（至少包含一个即可）
      const containsAny = expected.responseContains.some(kw => 
        actualContent.toLowerCase().includes(kw.toLowerCase())
      );
      if (!containsAny) {
        passed = false;
        reason = `回复未包含任何期望关键词: ${expected.responseContains.join(', ')}`;
      }
    }
  }

  return {
    passed,
    reason,
    actual: {
      hasIntent: hasToolCall,
      intentType: actualIntent,
      params: actualParams,
      content: actualContent.substring(0, 200) + (actualContent.length > 200 ? '...' : '')
    }
  };
}

// ============================================
// 运行单个测试
// ============================================
async function runTest(testCase) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`📋 测试 ID: ${testCase.id} | 类别: ${testCase.category}`);
  console.log(`📝 输入: "${testCase.input}"`);
  console.log("─".repeat(60));

  try {
    const apiResponse = await callAPI(testCase.input);
    
    if (apiResponse.error) {
      console.log('❌ API 错误:', apiResponse.error);
      return {
        id: testCase.id,
        category: testCase.category,
        input: testCase.input,
        passed: false,
        reason: `API 错误: ${JSON.stringify(apiResponse.error)}`,
        actual: null
      };
    }

    const evaluation = evaluateResult(testCase, apiResponse);
    
    // 输出结果
    if (evaluation.passed) {
      console.log('✅ 通过');
      if (evaluation.actual.hasIntent) {
        console.log(`   意图: ${evaluation.actual.intentType}`);
        console.log(`   参数: ${JSON.stringify(evaluation.actual.params)}`);
      } else {
        console.log(`   回复: ${evaluation.actual.content.substring(0, 100)}...`);
      }
    } else {
      console.log('❌ 失败');
      console.log(`   原因: ${evaluation.reason}`);
      if (evaluation.actual.hasIntent) {
        console.log(`   实际意图: ${evaluation.actual.intentType}`);
        console.log(`   实际参数: ${JSON.stringify(evaluation.actual.params)}`);
      } else {
        console.log(`   实际回复: ${evaluation.actual.content.substring(0, 100)}...`);
      }
    }

    return {
      id: testCase.id,
      category: testCase.category,
      input: testCase.input,
      expected: testCase.expected,
      ...evaluation
    };

  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return {
      id: testCase.id,
      category: testCase.category,
      input: testCase.input,
      passed: false,
      reason: `请求异常: ${error.message}`,
      actual: null
    };
  }
}

// ============================================
// 保存测试结果
// ============================================
function saveResults() {
  const resultsDir = path.join(__dirname, 'results');
  
  // 确保目录存在
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // 生成文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(resultsDir, `${timestamp}.json`);
  
  // 保存结果
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  
  // 同时保存一份 latest.json
  const latestPath = path.join(resultsDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(results, null, 2));
  
  console.log(`\n📁 结果已保存到: ${filename}`);
  return filename;
}

// ============================================
// 打印测试摘要
// ============================================
function printSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 测试摘要');
  console.log('═'.repeat(60));
  
  console.log(`\n📈 总体结果:`);
  console.log(`   总计: ${results.total}`);
  console.log(`   通过: ${results.passed} ✅`);
  console.log(`   失败: ${results.failed} ❌`);
  console.log(`   准确率: ${(results.passed / results.total * 100).toFixed(1)}%`);
  
  console.log(`\n📂 按类别统计:`);
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const accuracy = ((stats.passed / stats.total) * 100).toFixed(1);
    const status = stats.passed === stats.total ? '✅' : '⚠️';
    console.log(`   ${category}: ${stats.passed}/${stats.total} (${accuracy}%) ${status}`);
  }
  
  if (results.failed > 0) {
    console.log(`\n❌ 失败用例:`);
    results.details
      .filter(d => !d.passed)
      .forEach(d => {
        console.log(`   [${d.id}] ${d.input}`);
        console.log(`      原因: ${d.reason}`);
      });
  }
}

// ============================================
// 主函数
// ============================================
async function runAllTests() {
  console.log('🚀 开始测试 Intent Bot 意图识别...');
  console.log(`📅 时间: ${new Date().toLocaleString()}`);
  console.log(`🤖 模型: ${MODEL}`);
  
  // 加载测试用例
  const testCases = loadTestCases();
  results.total = testCases.length;
  
  console.log(`📋 共 ${testCases.length} 个测试用例\n`);

  // 运行所有测试
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.details.push(result);
    
    // 更新统计
    if (result.passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // 按类别统计
    if (!results.byCategory[testCase.category]) {
      results.byCategory[testCase.category] = { total: 0, passed: 0, failed: 0 };
    }
    results.byCategory[testCase.category].total++;
    if (result.passed) {
      results.byCategory[testCase.category].passed++;
    } else {
      results.byCategory[testCase.category].failed++;
    }
    
    // 添加延迟避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 打印摘要
  printSummary();
  
  // 保存结果
  saveResults();
  
  console.log('\n✅ 测试完成!');
  
  // 返回退出码（用于 CI/CD）
  process.exit(results.failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests();
