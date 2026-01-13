# Mock Lending Pool 部署指南

## 使用 Remix IDE 部署到 Monad Testnet

### 步骤 1：打开 Remix IDE

访问 https://remix.ethereum.org

---

### 步骤 2：创建合约文件

1. 在左侧文件浏览器中，点击 **"contracts"** 文件夹
2. 点击 **"新建文件"** 图标
3. 命名为 `MockLendingPool.sol`
4. 将 `contracts/MockLendingPool.sol` 的内容复制粘贴进去

---

### 步骤 3：编译合约

1. 点击左侧 **"Solidity Compiler"** 图标 (第二个)
2. 选择编译器版本: **0.8.20** 或更高
3. 点击 **"Compile MockLendingPool.sol"**
4. 确保没有红色错误

---

### 步骤 4：配置 MetaMask

确保 MetaMask 已添加 Monad Testnet:

| 字段 | 值 |
|------|-----|
| Network Name | Monad Testnet |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Chain ID | `10143` |
| Symbol | `MON` |
| Explorer | `https://testnet.monadexplorer.com` |

---

### 步骤 5：部署合约

1. 点击左侧 **"Deploy & Run Transactions"** 图标 (第三个)
2. **Environment**: 选择 **"Injected Provider - MetaMask"**
3. MetaMask 弹窗会请求连接，点击 **"Connect"**
4. 确保显示的 Chain ID 是 **10143** (Monad Testnet)
5. **Contract**: 选择 **MockLendingPool**
6. 点击 **"Deploy"** 按钮
7. MetaMask 弹窗确认交易，点击 **"Confirm"**

---

### 步骤 6：获取合约地址

部署成功后:

1. 在 "Deployed Contracts" 区域会显示合约
2. 点击合约旁边的 **复制图标** 获取地址
3. **记录这个地址！** 格式类似: `0x1234...5678`

---

### 步骤 7：在区块浏览器验证

1. 访问 https://testnet.monadexplorer.com
2. 搜索你的合约地址
3. 确认合约已部署成功

---

### 步骤 8：测试合约功能

在 Remix 中测试:

#### 测试 Supply (存款):
1. 展开部署的合约
2. 找到 `depositNative` 函数
3. 在 "VALUE" 字段输入 `1000000000000000000` (1 MON = 10^18 wei)
4. 在 `onBehalfOf` 参数填入你的钱包地址
5. 点击 **"transact"**

#### 测试 Withdraw (取款):
1. 找到 `withdraw` 函数
2. 参数:
   - `asset`: `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` (原生代币)
   - `amount`: `500000000000000000` (0.5 MON)
   - `to`: 你的钱包地址
3. 点击 **"transact"**

#### 查询余额:
1. 找到 `getUserDeposit` 函数
2. 参数:
   - `user`: 你的钱包地址
   - `asset`: `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`
3. 点击 **"call"**

---

## 部署完成后

将合约地址告诉我，我会帮你更新项目代码中的配置！

示例格式:
```
Mock Lending Pool 地址: 0x1234567890abcdef1234567890abcdef12345678
```

---

## 常见问题

### Q: 部署失败 - Gas 不足
确保钱包中有足够的测试 MON (至少 0.1 MON)

### Q: MetaMask 显示错误的网络
手动切换到 Monad Testnet，或在 Remix 中重新选择 Environment

### Q: 编译错误
确保使用 Solidity 0.8.20 或更高版本编译器
