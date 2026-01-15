import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying Mock Contracts to Testnet");
  console.log("=========================================\n");
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy MockMonad (ERC20 Token)
  console.log("📝 Deploying MockMonad token...");
  const MockMonad = await ethers.getContractFactory("MockMonad");
  const mockMonad = await MockMonad.deploy();
  await mockMonad.waitForDeployment();
  const mockMonadAddress = await mockMonad.getAddress();
  console.log("✅ MockMonad deployed to:", mockMonadAddress);

  // Deploy MockAavePool
  console.log("\n📝 Deploying MockAavePool...");
  const MockAavePool = await ethers.getContractFactory("MockAavePool");
  const mockAavePool = await MockAavePool.deploy();
  await mockAavePool.waitForDeployment();
  const mockAavePoolAddress = await mockAavePool.getAddress();
  console.log("✅ MockAavePool deployed to:", mockAavePoolAddress);

  // Deploy MockSwapRouter
  console.log("\n📝 Deploying MockSwapRouter...");
  const MockSwapRouter = await ethers.getContractFactory("MockSwapRouter");
  const mockSwapRouter = await MockSwapRouter.deploy();
  await mockSwapRouter.waitForDeployment();
  const mockSwapRouterAddress = await mockSwapRouter.getAddress();
  console.log("✅ MockSwapRouter deployed to:", mockSwapRouterAddress);

  // Deploy YieldForwardingStakingPool
  console.log("\n📝 Deploying YieldForwardingStakingPool...");
  const YieldForwardingStakingPool = await ethers.getContractFactory("YieldForwardingStakingPool");
  const stakingPool = await YieldForwardingStakingPool.deploy(mockMonadAddress);
  await stakingPool.waitForDeployment();
  const stakingPoolAddress = await stakingPool.getAddress();
  console.log("✅ YieldForwardingStakingPool deployed to:", stakingPoolAddress);

  // Mint tokens to staking pool for rewards
  console.log("\n💰 Adding rewards to staking pool...");
  const rewardAmount = ethers.parseEther("10000"); // 10,000 MON
  await mockMonad.mint(stakingPoolAddress, rewardAmount);
  console.log("✅ Minted 10,000 MON to staking pool");

  // Add liquidity to MockSwapRouter
  console.log("\n💰 Adding liquidity to MockSwapRouter...");
  const liquidityAmount = ethers.parseEther("50000"); // 50,000 MON
  await mockMonad.mint(mockSwapRouterAddress, liquidityAmount);
  console.log("✅ Minted 50,000 MON to swap router for liquidity");

  // Add liquidity to MockAavePool (for withdrawals)
  console.log("\n💰 Adding liquidity to MockAavePool...");
  const aaveLiquidity = ethers.parseEther("50000"); // 50,000 MON
  await mockMonad.mint(mockAavePoolAddress, aaveLiquidity);
  console.log("✅ Minted 50,000 MON to Aave pool for liquidity");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("✨ All Mock Contracts Deployed Successfully!");
  console.log("=".repeat(50) + "\n");

  const addresses = {
    MONAD_TOKEN: mockMonadAddress,
    STAKING_POOL: stakingPoolAddress,
    MOCK_AAVE_POOL: mockAavePoolAddress,
    MOCK_SWAP_ROUTER: mockSwapRouterAddress,
    CHAIN_ID: (await ethers.provider.getNetwork()).chainId.toString(),
  };

  console.log("📋 Contract Addresses:");
  console.log("─────────────────────────────────────────────────");
  console.log("  Monad Token (MON):", addresses.MONAD_TOKEN);
  console.log("  Staking Pool:       ", addresses.STAKING_POOL);
  console.log("  Mock Aave Pool:     ", addresses.MOCK_AAVE_POOL);
  console.log("  Mock Swap Router:   ", addresses.MOCK_SWAP_ROUTER);
  console.log("  Chain ID:           ", addresses.CHAIN_ID);
  console.log("─────────────────────────────────────────────────\n");

  console.log("📝 Next Steps:");
  console.log("  1. Copy these addresses to your .env.local file:");
  console.log("\n");
  console.log(`     NEXT_PUBLIC_MONAD_TOKEN=${addresses.MONAD_TOKEN}`);
  console.log(`     NEXT_PUBLIC_STAKING_POOL=${addresses.STAKING_POOL}`);
  console.log(`     NEXT_PUBLIC_MOCK_AAVE_POOL=${addresses.MOCK_AAVE_POOL}`);
  console.log(`     NEXT_PUBLIC_MOCK_SWAP_ROUTER=${addresses.MOCK_SWAP_ROUTER}`);
  console.log("\n");
  console.log("  2. Update lib/web3/transaction-builder.ts with the new addresses");
  console.log("  3. Get test tokens: call mockMonad.faucet() to get 100 MON");
  console.log("  4. Test swap: 'Swap 10 MON to MONAD'");
  console.log("  5. Test supply: 'Supply 5 MON to Aave'");
  console.log("  6. Test withdraw: 'Withdraw 2 MON from Aave'");
  console.log("  7. Test stake: 'Stake 3 MON, yield to 0x...'\n");

  // Save to file for easy reference
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: addresses,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployed-contracts.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to: deployed-contracts.json\n");

  return addresses;
}

main()
  .then(() => {
    console.log("✅ Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
