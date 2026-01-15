# 🔧 Monad 测试网配置指南

## 问题说明

如果您在尝试切换到 Monad 测试网时遇到问题，这通常是因为 MetaMask 没有预先配置 Monad 测试网。

## 解决方案

### 方法 1: 在 MetaMask 中手动添加 Monad 测试网（推荐）

#### 步骤:

1. **打开 MetaMask**
   - 点击浏览器扩展图标
   - 确保您已登录

2. **打开网络设置**
   - 点击顶部的网络下拉菜单
   - 点击 "添加网络" 或 "Add Network"
   - 点击 "添加自定义网络" 或 "Add a custom network"

3. **填写 Monad 测试网信息**

   在以下字段中输入：

   **网络名称 (Network Name)**:
   ```
   Monad Testnet
   ```

   **新的 RPC URL (New RPC URL)**:
   ```
   https://testnet-rpc.monad.xyz
   ```

   **链 ID (Chain ID)**:
   ```
   41454
   ```

   **货币符号 (Currency Symbol)**:
   ```
   MON
   ```

   **区块浏览器 URL (Block Explorer URL)** (可选):
   ```
   https://explorer.testnet.monad.xyz
   ```

4. **保存并切换**
   - 点击 "保存" 或 "Save"
   - 在网络列表中选择 "Monad Testnet"

### 方法 2: 使用 RPC 链接直接添加

复制以下链接并在浏览器中打开：

```
https://chainlist.org/chain/41454
```

或者使用这个直接添加链接：

```
https://monad.xyz/?add-to-metamask
```

### 方法 3: 通过开发者工具添加

如果上述方法不行，您可以在浏览器控制台中执行以下代码：

```javascript
window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0xa1f6', // 41454 的十六进制
    chainName: 'Monad Testnet',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MON',
      decimals: 18,
    },
    rpcUrls: ['https://testnet-rpc.monad.xyz'],
    blockExplorerUrls: ['https://explorer.testnet.monad.xyz']
  }]
}).then(() => {
  console.log('✅ Monad Testnet added successfully!');
}).catch((error) => {
  console.error('❌ Failed to add network:', error);
});
```

## 验证配置

添加成功后，您应该能在 MetaMask 中看到：

1. **网络名称**: Monad Testnet
2. **余额显示**: MON 代币余额
3. **链 ID**: 41454

## 获取测试币

配置好网络后，您需要从水龙头获取 MON 测试币：

### 方法 1: Monad 官方水龙头
- 访问: https://faucet.monad.xyz
- 连接您的钱包
- 请求测试币

### 方法 2: 社区水龙头
- 在 Twitter 上搜索 "Monad testnet faucet"
- 查找最新的水龙头链接

### 方法 3: Discord 水龙头
- 加入 Monad Discord 服务器
- 在 #faucet 频道请求测试币

## 常见问题

### Q: 为什么 RainbowKit 不能自动切换网络？

A: RainbowKit 可以在已配置的网络之间切换，但如果 MetaMask 中没有添加该网络，切换会失败。您需要先手动添加。

### Q: 添加网络后还是不能切换？

A: 尝试以下步骤：
1. 刷新浏览器页面
2. 断开钱包连接后重新连接
3. 清除浏览器缓存
4. 重启浏览器

### Q: 余额显示为 0？

A: 这可能是因为：
1. 网络配置错误（检查 RPC URL）
2. 还没有测试币（从水龙头获取）
3. MetaMask 还没有同步到最新区块

### Q: 交易失败？

A: 检查：
1. 是否有足够的 MON 支付 Gas 费
2. 网络 RPC 是否正常工作
3. 链 ID 是否正确（41454）

## 网络详细信息

以下是 Monad 测试网的完整配置信息，供参考：

```json
{
  "chainId": 41454,
  "chainIdHex": "0xa1f6",
  "chainName": "Monad Testnet",
  "rpcUrls": ["https://testnet-rpc.monad.xyz"],
  "wsUrls": ["wss://testnet-rpc.monad.xyz"],
  "nativeCurrency": {
    "name": "Monad",
    "symbol": "MON",
    "decimals": 18
  },
  "blockExplorerUrls": ["https://explorer.testnet.monad.xyz"],
  "testnet": true
}
```

## 下一步

配置完成后，您可以：

1. ✅ 在应用中切换到 Monad 测试网
2. ✅ 查询 MON 余额
3. ✅ 发送 MON 测试币
4. ✅ 与智能合约交互

祝您测试顺利！🚀
