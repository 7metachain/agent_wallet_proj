const { ethers } = require("ethers");

async function main() {
  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("\n========================================");
  console.log("🔐 新的钱包已生成");
  console.log("========================================\n");
  console.log("📍 地址 (Address):");
  console.log(wallet.address);
  console.log("\n🔑 私钥 (Private Key):");
  console.log(wallet.privateKey);
  console.log("\n📜 助记词 (Mnemonic Phrase):");
  console.log(wallet.mnemonic.phrase);
  console.log("\n========================================");
  console.log("\n✅ 使用方法:");
  console.log("1. 在 MetaMask 中点击 '导入账户'");
  console.log("2. 选择 '导入私钥'");
  console.log("3. 粘��上面的私钥");
  console.log("\n⚠️  注意: 仅用于测试网,不要在主网使用!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
