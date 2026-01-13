// Curvance Protocol ABI
// Monad Mainnet 借贷协议合约 ABI
// 官方文档: https://docs.curvance.com/cve/protocol-overview/contract-addresses

// ============================================
// Mock Lending Pool (Monad Testnet) - Hackathon 演示用
// 已部署到 Monad Testnet
// ============================================
export const MOCK_LENDING_POOL_ADDRESS = "0xD9a655186Aaff2143e65F749CD26ED0DD3510Ee8" as const;

// Mock Lending Pool ABI
export const MOCK_LENDING_POOL_ABI = [
  // Supply with Aave-style interface
  {
    name: "supply",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    outputs: [],
  },
  // Simple native deposit
  {
    name: "depositNative",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "onBehalfOf", type: "address" },
    ],
    outputs: [],
  },
  // Withdraw
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Get user deposit
  {
    name: "getUserDeposit",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "asset", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Get user account data (Aave-style)
  {
    name: "getUserAccountData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "totalCollateralBase", type: "uint256" },
      { name: "totalDebtBase", type: "uint256" },
      { name: "availableBorrowsBase", type: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "healthFactor", type: "uint256" },
    ],
  },
] as const;

// ============================================
// Curvance 合约地址 (Monad Mainnet)
// ============================================

// 核心架构合约
export const CURVANCE_CENTRAL_REGISTRY = "0x1310f352f1389969Ece6741671c4B919523912fF" as const;
export const CURVANCE_DAO_TIMELOCK = "0x2677738657F27e1A3591E00AD7E5a78807688C08" as const;

// Oracle
export const CURVANCE_ORACLE_MANAGER = "0x32faD39e79FAc67f80d1C86CbD1598043e52CDb6" as const;

// 官方插件
export const CURVANCE_SIMPLE_ZAPPER = "0x91da3583924263ee0da81a06d01946E95FFFB22E" as const;
export const CURVANCE_VAULT_ZAPPER = "0x9cb6cc5029c23140662636A50c4E8Dc618cC13F1" as const;
export const CURVANCE_NATIVE_VAULT_ZAPPER = "0xbfE3612D3Db96dc58F2210e2e7FDfe9F4B8c5Ec0" as const;

// Protocol Reader (查询合约)
export const CURVANCE_PROTOCOL_READER = "0x878cDfc2F3D96a49A5CbD805FAF4F3080768a6d2" as const;

// ============================================
// 市场合约地址
// ============================================

// LST Markets - shMON / WMON (推荐用于测试)
export const CURVANCE_SHMON_MARKET = {
  marketManager: "0xE1C24B2E93230FBe33d32Ba38ECA3218284143e2" as const,
  cshMON: "0x926C101Cf0a3dE8725Eb24a93E980f9FE34d6230" as const,
  cWMON: "0x0fcEd51b526BfA5619F83d97b54a57e3327eB183" as const,
  nativePositionManager: "0x2fAA792502aC5a329DcCc1580C5308fCc0a772fe" as const,
  simplePositionManager: "0x7E8705a164DA7Cc5a4119C750b1F79837AD89D5E" as const,
};

// LST Markets - sMON / WMON
export const CURVANCE_SMON_MARKET = {
  marketManager: "0xe5970cDB1916B2cCF6185C86C174EEE2d330D05B" as const,
  csMON: "0x494876051B0E85dCe5ecd5822B1aD39b9660c928" as const,
  cWMON: "0xebE45A6ceA7760a71D8e0fa5a0AE80a75320D708" as const,
  simplePositionManager: "0x3d6ba6C90E1738cb01C46E72F284C7Bd57eB11EC" as const,
};

// LST Markets - AprMON / WMON
export const CURVANCE_APRMON_MARKET = {
  marketManager: "0x5EA0a1Cf3501C954b64902c5e92100b8A2CaB1Ac" as const,
  caprMON: "0xD9E2025b907E95EcC963A5018f56B87575B4aB26" as const,
  cWMON: "0xF32B334042DC1EB9732454cc9bc1a06205d184f2" as const,
  nativePositionManager: "0x82f88A810E86a730699231F5fBF5686c643467C8" as const,
  simplePositionManager: "0x669786FF3da7544c98FE74eE1006D787118d1770" as const,
};

// DeFi Bluechip Market - WMON / USDC
export const CURVANCE_WMON_USDC_MARKET = {
  marketManager: "0x8a78Bd450258B7B1D42431fB904453cA43161AdE" as const,
  cWMON: "0x9F57957F2CA8d0DB433e4623f8bd248293b01e86" as const,
  cUSDC: "0x8cA51d155C07e91B206Cf11C8D52d5aB082657F6" as const,
  simplePositionManager: "0x3A1B2Dc11a81Fe106eC667BaB4056fC72498ff73" as const,
};

// 默认使用的市场 (shMON/WMON)
export const CURVANCE_DEFAULT_MARKET = CURVANCE_SHMON_MARKET;

// 向后兼容的 Pool 地址 (使用 Market Manager)
export const CURVANCE_POOL_ADDRESS = CURVANCE_DEFAULT_MARKET.marketManager;

// ============================================
// cToken 地址映射
// ============================================
export const CURVANCE_CTOKENS: Record<string, string> = {
  // shMON Market
  shMON: CURVANCE_SHMON_MARKET.cshMON,
  // sMON Market  
  sMON: CURVANCE_SMON_MARKET.csMON,
  // aprMON Market
  aprMON: CURVANCE_APRMON_MARKET.caprMON,
  // WMON (from shMON market)
  WMON: CURVANCE_SHMON_MARKET.cWMON,
  // USDC (from bluechip market)
  USDC: CURVANCE_WMON_USDC_MARKET.cUSDC,
};

// ============================================
// ABI 定义
// ============================================

// cToken ABI (用于 supply/withdraw)
export const CTOKEN_ABI = [
  // Mint (Supply) - 存入资产获得 cToken
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  // Deposit (ERC4626 标准)
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  // Withdraw
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  // Redeem (用 cToken 换回资产)
  {
    name: "redeem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "assets", type: "uint256" }],
  },
  // Balance of
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Total assets
  {
    name: "totalAssets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Convert to shares
  {
    name: "convertToShares",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Convert to assets
  {
    name: "convertToAssets",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Underlying asset
  {
    name: "asset",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

// Native Vault Zapper ABI (用于原生 MON 存款)
export const NATIVE_VAULT_ZAPPER_ABI = [
  // Deposit native token (MON)
  {
    name: "depositNative",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "vault", type: "address" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  // Withdraw to native token
  {
    name: "withdrawNative",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vault", type: "address" },
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  // Redeem to native token
  {
    name: "redeemNative",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vault", type: "address" },
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "assets", type: "uint256" }],
  },
] as const;

// Market Manager ABI
export const MARKET_MANAGER_ABI = [
  // Get user position
  {
    name: "getUserPosition",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "collateral", type: "uint256" },
      { name: "debt", type: "uint256" },
      { name: "healthFactor", type: "uint256" },
    ],
  },
  // Get market info
  {
    name: "getMarketInfo",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "totalSupply", type: "uint256" },
      { name: "totalBorrow", type: "uint256" },
      { name: "supplyRate", type: "uint256" },
      { name: "borrowRate", type: "uint256" },
    ],
  },
] as const;

// ERC20 Approve ABI (用于授权)
export const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// 向后兼容的 CURVANCE_POOL_ABI (使用 cToken ABI)
export const CURVANCE_POOL_ABI = CTOKEN_ABI;
