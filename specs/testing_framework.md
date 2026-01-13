# 测试框架设计文档

## 概述

基于 "Golden Dataset" 和 Snapshot Testing 的意图识别测试框架，用于验证 AI 意图解析的准确性和一致性。

## 测试架构

### 核心概念

1. **Golden Dataset（黄金数据集）**
   - 预定义的测试用例集合
   - 包含输入和期望输出
   - 作为回归测试基准

2. **Snapshot Testing（快照测试）**
   - 保存每次测试的完整响应
   - 对比历史版本，检测回归
   - 支持手动审核和批准

3. **Confidence Threshold（置信度阈值）**
   - 意图识别的置信度评分
   - 低于阈值时触发 Fallback Intent

4. **Fallback Intent（回退意图）**
   - 无法识别时的默认处理
   - 提供引导式响应

## 测试用例格式

### 文件结构

**文件**: `test/intent-test-cases.json`

```json
{
  "id": "supply-001",
  "category": "supply",
  "input": "把 0.5 个 MON 存到 Curvance",
  "expected": {
    "hasIntent": true,
    "intentType": "supply_to_curvance",
    "params": {
      "token": "MON",
      "amount": "0.5"
    }
  }
}
```

### 测试用例分类

| 分类 | 说明 | 示例 |
|------|------|------|
| `supply` | 存入协议 | "存 100 USDC 到 Curvance" |
| `withdraw` | 提取资产 | "从 Curvance 提取所有 USDC" |
| `swap` | 代币兑换 | "Swap 100 USDC to MON" |
| `transfer` | 转账 | "转 50 MON 到 0x123..." |
| `check_balance` | 查询余额 | "我有多少 MON" |
| `general_chat` | 一般对话 | "你好" |
| `off_topic` | 超出范围 | "今天天气怎么样" |

## 测试运行器

### 文件结构

**文件**: `test/test-api.js`

### 功能特性

1. **批量测试执行**
   - 读取 `intent-test-cases.json`
   - 逐个调用 API 测试
   - 收集响应结果

2. **结果评估**
   - 对比实际输出与期望输出
   - 计算准确率、召回率
   - 标记失败用例

3. **结果保存**
   - 保存到 `test/results/` 目录
   - 文件名格式：`YYYY-MM-DDTHH-mm-ss-SSSZ.json`
   - 同时保存 `latest.json` 作为最新快照

### 输出格式

```json
{
  "timestamp": "2026-01-11T12:15:14.270Z",
  "total": 20,
  "passed": 18,
  "failed": 2,
  "accuracy": 0.9,
  "results": [
    {
      "id": "supply-001",
      "input": "把 0.5 个 MON 存到 Curvance",
      "expected": { ... },
      "actual": { ... },
      "passed": true,
      "confidence": 0.95
    }
  ]
}
```

## 测试策略

### 1. 回归测试

- 每次代码变更后运行完整测试套件
- 对比历史快照，检测性能退化
- 自动标记新增失败用例

### 2. 边界测试

- 测试模糊输入（"一半"、"全部"）
- 测试多语言输入（中文、英文）
- 测试复合意图（"换币然后存"）

### 3. 负例测试

- 超出范围的查询
- 语法错误输入
- 不支持的代币/协议

## 成本优化

### 问题

重复运行相同测试用例会消耗大量 API Token。

### 解决方案

1. **缓存机制**
   - 相同输入缓存响应结果
   - 仅在用例变更时重新测试

2. **增量测试**
   - 仅测试新增/修改的用例
   - 历史用例使用快照对比

3. **Mock 模式**
   - 开发阶段使用 Mock 响应
   - 仅在生产前运行真实 API 测试

4. **按需测试**
   - 仅测试关键路径
   - 定期运行完整套件

## 置信度评分

### 评分标准

| 置信度 | 含义 | 处理方式 |
|--------|------|----------|
| 0.9+ | 高置信度 | 直接执行 |
| 0.7-0.9 | 中等置信度 | 请求用户确认 |
| <0.7 | 低置信度 | 触发 Fallback Intent |

### Fallback Intent 处理

```typescript
if (confidence < 0.7) {
  return {
    message: "我不太确定您的意图，请选择：",
    options: [
      "存入代币赚取收益",
      "提取代币",
      "兑换代币",
      "其他"
    ]
  };
}
```

## 测试结果分析

### 指标

1. **准确率 (Accuracy)**: 正确识别的用例占比
2. **召回率 (Recall)**: 所有应识别用例中被正确识别的占比
3. **F1 Score**: 准确率和召回率的调和平均
4. **平均置信度**: 所有用例的平均置信度分数

### 报告生成

- 生成 HTML 测试报告
- 可视化失败用例
- 趋势分析（准确率变化）

## 最佳实践

1. **定期更新 Golden Dataset**
   - 添加真实用户查询
   - 覆盖新功能场景

2. **审查快照变更**
   - 不要盲目接受所有变更
   - 人工审核意图解析改进

3. **版本控制**
   - 测试用例纳入 Git
   - 测试结果快照可选择性提交

4. **持续集成**
   - 在 CI/CD 中运行测试
   - 阻止准确率下降的 PR

## 参考资源

- [Jest Snapshot Testing](https://jestjs.io/docs/snapshot-testing)
- [Golden File Testing](https://en.wikipedia.org/wiki/Golden_file_testing)
