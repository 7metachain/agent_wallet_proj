// MockDEX ABI - Monad Testnet
// 部署地址: 0xd9145CCE52D386f254917e481eB44e9943F39138

export const MOCK_DEX_ADDRESS = "0x7F459031f050A17DcE4Fa129fD4420D5e885d719" as const;

export const MOCK_DEX_ABI = [
  // swapNativeForToken - 用 MON 换 ERC20
  {
    name: "swapNativeForToken",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "toToken", type: "address" },
      { name: "minAmountOut", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  // swapTokenForNative - 用 ERC20 换 MON
  {
    name: "swapTokenForNative",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "fromToken", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minAmountOut", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  // swapTokenForToken - ERC20 换 ERC20
  {
    name: "swapTokenForToken",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "fromToken", type: "address" },
      { name: "toToken", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minAmountOut", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  // swap - 通用接口
  {
    name: "swap",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "fromToken", type: "address" },
      { name: "toToken", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minAmountOut", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  // getAmountOut - 获取预估输出
  {
    name: "getAmountOut",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "fromToken", type: "address" },
      { name: "toToken", type: "address" },
      { name: "amountIn", type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  // setRate - 设置汇率 (owner only)
  {
    name: "setRate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "fromToken", type: "address" },
      { name: "toToken", type: "address" },
      { name: "rate", type: "uint256" },
    ],
    outputs: [],
  },
  // addLiquidity - 添加流动性
  {
    name: "addLiquidity",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  // rates - 查询汇率
  {
    name: "rates",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  // NATIVE_TOKEN 常量
  {
    name: "NATIVE_TOKEN",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // Events
  {
    name: "Swap",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "fromToken", type: "address", indexed: true },
      { name: "toToken", type: "address", indexed: true },
      { name: "amountIn", type: "uint256", indexed: false },
      { name: "amountOut", type: "uint256", indexed: false },
    ],
  },
] as const;

// 原生代币地址标识
export const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;
