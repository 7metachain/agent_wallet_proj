export default async function deploy(hre) {
  const ethers = hre.ethers;

  console.log("🚀 Starting deployment to Hardhat Local Network...\n");

  try {
    const [deployer] = await ethers.getSigners();
    console.log("📍 Deploying contracts with account:", deployer.address);
    const balance = await deployer.getBalance();
    console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH\n");

    // 1. Deploy MockMonad ( faucetable token)
    console.log("1️⃣  Deploying MockMonad...");
    const MockMonad = await ethers.getContractFactory("MockMonad");
    const mockMonad = await MockMonad.deploy();
    await mockMonad.deployed();
    console.log("✅ MockMonad deployed to:", mockMonad.address);

    // 2. Deploy YieldForwardingStakingPool
    console.log("\n2️⃣  Deploying YieldForwardingStakingPool...");
    const YieldForwardingStakingPool = await ethers.getContractFactory("YieldForwardingStakingPool");
    const stakingPool = await YieldForwardingStakingPool.deploy(mockMonad.address);
    await stakingPool.deployed();
    console.log("✅ YieldForwardingStakingPool deployed to:", stakingPool.address);

    // 3. Deploy MockAavePoolSimple
    console.log("\n3️⃣  Deploying MockAavePoolSimple...");
    const MockAavePoolSimple = await ethers.getContractFactory("MockAavePoolSimple");
    const aavePool = await MockAavePoolSimple.deploy();
    await aavePool.deployed();
    console.log("✅ MockAavePoolSimple deployed to:", aavePool.address);

    // 4. Deploy MockSwapRouter
    console.log("\n4️⃣  Deploying MockSwapRouter...");
    const MockSwapRouter = await ethers.getContractFactory("MockSwapRouter");
    const swapRouter = await MockSwapRouter.deploy();
    await swapRouter.deployed();
    console.log("✅ MockSwapRouter deployed to:", swapRouter.address);

    console.log("\n🎉 All contracts deployed successfully!\n");

    console.log("📋 Contract Addresses:");
    console.log("=".repeat(50));
    console.log("NEXT_PUBLIC_MONAD_TOKEN=" + mockMonad.address);
    console.log("NEXT_PUBLIC_STAKING_POOL=" + stakingPool.address);
    console.log("NEXT_PUBLIC_MOCK_AAVE_POOL=" + aavePool.address);
    console.log("NEXT_PUBLIC_MOCK_SWAP_ROUTER=" + swapRouter.address);
    console.log("=".repeat(50));
    console.log("\n💡 Copy these to your .env.local file\n");

    // Fund some tokens to deployer for testing
    console.log("🚰 Calling faucet to get tokens...");
    const tx = await mockMonad.faucet();
    await tx.wait();
    console.log("✅ Faucet called! You now have 100 MONAD tokens\n");
  } catch (error) {
    console.error("\n❌ Deployment failed!");
    console.error("Error:", error.message);
    throw error;
  }
}
