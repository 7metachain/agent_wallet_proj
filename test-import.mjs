import hre from "hardhat";

console.log("Hardhat exports:", Object.keys(hre));
console.log("Has ethers?", "ethers" in hre);
console.log("Has viem?", "viem" in hre);
