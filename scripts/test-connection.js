import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Testing Hardhat connection...\n");

  try {
    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    console.log("✅ Connected to network:");
    console.log("   Chain ID:", network.chainId.toString());
    console.log("   Name:", network.name);

    // 获取账户
    const signers = await ethers.getSigners();
    console.log("\n✅ Found", signers.length, "accounts");
    console.log("   First account:", signers[0].address);

    // 获取余额
    const balance = await signers[0].getBalance();
    console.log("   Balance:", ethers.utils.formatEther(balance), "ETH");

    console.log("\n✅ Connection successful! You can now run deploy-local.js\n");

  } catch (error) {
    console.error("\n❌ Connection failed!");
    console.error("Error:", error.message);
    console.error("\n💡 Make sure Hardhat node is running:");
    console.error("   npx hardhat node\n");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
