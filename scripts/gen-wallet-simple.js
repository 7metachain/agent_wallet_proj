// Simple wallet generator without hardhat
const crypto = require('crypto');

function generateWallet() {
  // Generate random private key
  const privateKey = '0x' + crypto.randomBytes(32).toString('hex');

  // Simple address derivation (for testing purposes)
  // In production, use proper ethjs library
  console.log("\n=== 新测���钱包 ===");
  console.log("私钥:", privateKey);
  console.log("\n要获取地址,请使用:");
  console.log("1. 将私钥导入 MetaMask");
  console.log("2. MetaMask 会自动显示地址");
  console.log("\n⚠️  仅用于测试！不要在主网使用！\n");
}

generateWallet();
