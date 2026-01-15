const { HardhatUserConfig } = require("hardhat/config");
const { task } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");

const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    baseSepolia: {
      url: process.env.RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 10143,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

// 添加部署任务
task("deploy-local", "Deploys all contracts to Hardhat local network", async (taskArgs, hre) => {
  console.log("🚀 Starting deployment to Hardhat Local Network...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // 1. Deploy MockMonad
  console.log("1️⃣  Deploying MockMonad...");
  const MockMonad = await hre.ethers.getContractFactory("MockMonad");
  const mockMonad = await MockMonad.deploy();
  const mockMonadAddress = await mockMonad.getAddress();
  console.log("✅ MockMonad deployed to:", mockMonadAddress);

  // 2. Deploy YieldForwardingStakingPool
  console.log("\n2️⃣  Deploying YieldForwardingStakingPool...");
  const YieldForwardingStakingPool = await hre.ethers.getContractFactory("YieldForwardingStakingPool");
  const stakingPool = await YieldForwardingStakingPool.deploy(mockMonadAddress);
  console.log("✅ YieldForwardingStakingPool deployed to:", await stakingPool.getAddress());

  // 3. Deploy MockAavePoolSimple
  console.log("\n3️⃣  Deploying MockAavePoolSimple...");
  const MockAavePoolSimple = await hre.ethers.getContractFactory("MockAavePoolSimple");
  const aavePool = await MockAavePoolSimple.deploy();
  console.log("✅ MockAavePoolSimple deployed to:", await aavePool.getAddress());

  // 4. Deploy MockSwapRouter
  console.log("\n4️⃣  Deploying MockSwapRouter...");
  const MockSwapRouter = await hre.ethers.getContractFactory("MockSwapRouter");
  const swapRouter = await MockSwapRouter.deploy();
  console.log("✅ MockSwapRouter deployed to:", await swapRouter.getAddress());

  console.log("\n🎉 All contracts deployed successfully!\n");

  const stakingPoolAddress = await stakingPool.getAddress();
  const aavePoolAddress = await aavePool.getAddress();
  const swapRouterAddress = await swapRouter.getAddress();

  console.log("📋 Contract Addresses:");
  console.log("=".repeat(50));
  console.log("NEXT_PUBLIC_MONAD_TOKEN=" + mockMonadAddress);
  console.log("NEXT_PUBLIC_STAKING_POOL=" + stakingPoolAddress);
  console.log("NEXT_PUBLIC_MOCK_AAVE_POOL=" + aavePoolAddress);
  console.log("NEXT_PUBLIC_MOCK_SWAP_ROUTER=" + swapRouterAddress);
  console.log("=".repeat(50));
  console.log("\n💡 Copy these to your .env.local file\n");

  // Call faucet
  console.log("🚰 Calling faucet to get tokens...");
  const tx = await mockMonad.faucet();
  await tx.wait();
  console.log("✅ Faucet called! You now have 100 MONAD tokens\n");
});

module.exports = config;
