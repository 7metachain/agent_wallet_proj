# Quick Test Guide for Monad Testnet

## 测试流程优化

### 1. 准备测试环境
- 确保 MetaMask 已连接到 Monad Testnet
- 确保有足够的 MON 余额（> 1 MON）
- 打开浏览器控制台查看日志

### 2. 快速测试清单

#### ✅ 基础功能测试（每个 ~30 秒）

1. **Check Balance** (5 秒)
   ```
   输入: "查询余额" 或 "check balance"
   ```

2. **Transfer** (30 秒)
   ```
   输入: "transfer 0.001 mon to 0xADB60036FE9d4c269Ed5ca8C5958dd29bc66D814"
   ```

3. **Supply to Aave** (40 秒)
   ```
   输入: "supply 0.01 MON to Aave"
   ```

4. **Stake with Yield** (40 秒)
   ```
   输入: "stake 0.01 MON, yield to 0xADB60036FE9d4c269Ed5ca8C5958dd29bc66D814"
   ```

5. **Swap** (50 秒)
   ```
   输入: "swap 0.01 ETH to USDC"
   ```

### 3. 常见问题

**Q: MetaMask 弹窗太慢？**
A: 这是 Monad Testnet RPC 的性能问题，建议使用 Mock 模式快速测试

**Q: 交易失败？**
A: 检查：
   - 余额是否充足
   - 合约地址是否正确
   - Monad Testnet 是否正常运行

**Q: Gas 估计很慢？**
A: 正常现象，Monad Testnet RPC 较慢（25 rps）

### 4. Hackathon 演示建议

**使用 Mock 模式演示**（更流畅）：
1. 演示 UI 和 AI 交互
2. 展示交易构建流程
3. 显示成功状态

**最后使用真实交易验证**（1-2 个即可）：
1. 准备好小额交易
2. 提前发起交易
3. 在演示时直接展示结果

---

## Mock 模式启用方法

在 `.env.local` 中设置：
```bash
NEXT_PUBLIC_MOCK_MODE=true
```

重启开发服务器：
```bash
npm run dev
```

Mock 模式下：
- ✅ 无需 MetaMask
- ✅ 无需等待 RPC
- ✅ 秒级完成
- ❌ 不执行真实交易
