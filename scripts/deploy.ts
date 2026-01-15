import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy MockMonad
  console.log("\n📝 Deploying MockMonad...");
  const MockMonad = await ethers.getContractFactory("MockMonad");
  const mockMonad = await MockMonad.deploy();
  await mockMonad.waitForDeployment();
  const mockMonadAddress = await mockMonad.getAddress();
  console.log("✅ MockMonad deployed to:", mockMonadAddress);

  // Deploy YieldForwardingStakingPool
  console.log("\n📝 Deploying YieldForwardingStakingPool...");
  const YieldForwardingStakingPool = await ethers.getContractFactory("YieldForwardingStakingPool");
  const stakingPool = await YieldForwardingStakingPool.deploy(mockMonadAddress);
  await stakingPool.waitForDeployment();
  const stakingPoolAddress = await stakingPool.getAddress();
  console.log("✅ YieldForwardingStakingPool deployed to:", stakingPoolAddress);

  // Mint some extra MONAD to the staking pool for rewards
  console.log("\n💰 Adding rewards to staking pool...");
  const mintAmount = ethers.parseEther("10000"); // 10,000 MONAD for rewards
  await mockMonad.mint(stakingPoolAddress, mintAmount);
  console.log("✅ Minted 10,000 MONAD to staking pool for rewards");

  // Get faucet info
  console.log("\n🚰 Faucet Info:");
  console.log("   Call mockMonad.faucet() to get 100 MONAD");

  console.log("\n✨ Deployment complete!");
  console.log("\n📋 Contract Addresses:");
  console.log("   MockMonad:", mockMonadAddress);
  console.log("   YieldForwardingStakingPool:", stakingPoolAddress);

  console.log("\n📝 Save these addresses to your .env file:");
  console.log(`   NEXT_PUBLIC_MONAD_TOKEN=${mockMonadAddress}`);
  console.log(`   NEXT_PUBLIC_STAKING_POOL=${stakingPoolAddress}`);

  return {
    mockMonad: mockMonadAddress,
    stakingPool: stakingPoolAddress,
  };
}

main()
  .then((addresses) => {
    console.log("\n✅ Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
