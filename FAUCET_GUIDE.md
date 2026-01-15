# 🚰 Base Sepolia 测试 ETH 获取指南

## ❌ 问题分析
`https://sepoliafaucet.com` 需要：
- 至少 0.001 ETH 在主网（作为 gas 担保）
- 这是 Sepolia ETH，不是 Base Sepolia

## ✅ 正确的 Base Sepolia Faucet

### 方法 1: Coinbase Base Sepolia Faucet（推荐）⭐

**网址**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

**特点**:
- ✅ 无需主网 ETH
- ✅ 专门用于 Base Sepolia
- ✅ 每 7 天可以领一次

**步骤**:
1. 访问: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. 输入地址: `0xFE75Bb94Ef80338a57007Ff7a6883fEF7222B0c0`
3. 完成人机验证（如果需要）
4. 点击 "Request ETH"
5. 等待约 30 秒到 1 分钟

---

### 方法 2: Alchemy Sepolia Faucet

**网址**: https://sepoliafaucet.com/

**如果您有主网 ETH**:
1. 确保钱包有 0.001+ ETH
2. 输入测试地址
3. 完成 Twitter 验证
4. 获取 Sepolia ETH
5. 然后通过桥接到 Base Sepolia

---

### 方法 3: QuickNode Faucet

**网址**: https://faucet.quicknode.com/ethereum/sepolia

**特点**:
- 需要注册 QuickNode 账户（免费）
- 可以获取 Sepolia ETH

---

### 方法 4: Paradigm Faucet（备用）

**网址**: https://faucet.paradigm.xyz/

**步骤**:
1. 用 Twitter 或 GitHub 登录
2. 选择 Sepolia 网络
3. 输入钱包地址
4. 领取 Sepolia ETH

---

### 方法 5: 通过 MetaMask Swaps（如果有其他测试网 ETH）

如果您有其他测试网的 ETH（如 Goerli），可以通过桥接：

1. 打开 MetaMask
2. 切换到有 ETH 的测试网
3. 使用官方桥: https://bridge.base.org/
4. 将 ETH 桥接到 Base Sepolia

---

## 🎯 推荐方案

### 最简单的方法（推荐）:

**使用 Coinbase Base Sepolia Faucet**

1. 访问: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. 输入地址: `0xFE75Bb94Ef80338a57007Ff7a6883fEF7222B0c0`
3. 领取 0.001 ETH
4. 完成！

---

## 💡 备用方案：直接用 MetaMask

如果您已有测试网 ETH 在其他网络：

1. **在 MetaMask 中添加 Base Sepolia 网络**
   - 网络名称: Base Sepolia
   - RPC URL: https://sepolia.base.org
   - 链 ID: 84532
   - 货币符号: ETH

2. **导入测试钱包**
   - 私钥: `0x7ad84aa409c390ab5bfc3bb11efcc0a6d5efece792e73abf12c4a8db3afd1298`
   - (不要在主网使用！)

3. **通过其他 Faucet 获取后跨链**

---

## ⏱️ 预计时间

- Coinbase Faucet: 1-2 分钟
- 其他方法: 5-10 分钟

---

## 📝 领取成功后

检查余额:
```bash
# 在浏览器中查询
https://sepolia.basescan.org/address/0xFE75Bb94Ef80338a57007Ff7a6883fEF7222B0c0
```

或使用 Hardhat:
```bash
npx hardhat console --network baseSepolia
> await ethers.provider.getBalance("0xFE75Bb94Ef80338a57007Ff7a6883fEF7222B0c0")
```

---

## ❓ 如果还是失败

### 可能的原因：

1. **Faucet 限制**:
   - Coinbase Faucet: 每 7 天一次
   - 解决: 等待或用其他地址

2. **网络问题**:
   - 尝试使用 VPN
   - 更换浏览器

3. **地址已领取**:
   - 换一个新地址

---

## 🚀 领取成功后立即部署

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**准备好了就告诉我！** 🎯
