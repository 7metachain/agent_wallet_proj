import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying MockAavePoolSimple to Monad Testnet");
  console.log("=========================================\n");
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MON\n");

  console.log("📝 Deploying MockAavePoolSimple...");
  const MockAavePoolSimple = await ethers.getContractFactory("MockAavePoolSimple");
  const pool = await MockAavePoolSimple.deploy();
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();

  console.log("✅ MockAavePoolSimple deployed to:", poolAddress);
  console.log("\n📝 Update your .env.local:");
  console.log(`   NEXT_PUBLIC_MOCK_AAVE_POOL=${poolAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
