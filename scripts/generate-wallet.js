const { ethers } = require("hardhat");

async function main() {
  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("\n=== 新测试钱包 ===");
  console.log("地址:", wallet.address);
  console.log("私钥:", wallet.privateKey);
  console.log("\n⚠️  仅用于测试！不要在主网使用！");
  console.log("✅ 可以用这个新地址去 faucet 领取测试币\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
