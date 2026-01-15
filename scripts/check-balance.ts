import { ethers } from "ethers";

async function main() {
  // Check balance
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const address = "0xFE75Bb94Ef80338a57007Ff7a6883fEF7222B0c0";

  const balance = await provider.getBalance(address);
  console.log("\n📊 Wallet Balance Check");
  console.log("=" .repeat(50));
  console.log("Address:", address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("=" .repeat(50));

  if (balance === 0n) {
    console.log("\n⚠️  Balance is 0 ETH");
    console.log("\n🚰 Get test ETH from:");
    console.log("   1. https://www.alchemy.com/faucets/ethereum-sepolia (需要注册)");
    console.log("   2. https://faucet.quicknode.com/ethereum/sepolia");
    console.log("   3. https://web3faucet.org/");
    console.log("\n💡 Tip: Register on Alchemy (free) for reliable faucet access");
  } else {
    console.log("\n✅ You have enough ETH to deploy!");
    console.log("   Run: npx hardhat run scripts/deploy.ts --network baseSepolia");
  }
}

main().catch(console.error);
