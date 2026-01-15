import { ethers } from "ethers";

async function main() {
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("\n🔐 New Test Wallet Generated\n");
  console.log("=" .repeat(50));
  console.log("📍 Address:", wallet.address);
  console.log("🔑 Private Key:", wallet.privateKey);
  console.log("=" .repeat(50));

  console.log("\n⚠️  IMPORTANT SECURITY NOTES:\n");
  console.log("1. Save this private key securely");
  console.log("2. This is a TEST wallet - NEVER use on mainnet");
  console.log("3. Fund this address with test ETH from:");
  console.log("   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet\n");

  console.log("📝 Add to .env file:");
  console.log(`PRIVATE_KEY=${wallet.privateKey.replace('0x', '')}`);
}

main().catch(console.error);
