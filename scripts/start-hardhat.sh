#!/bin/bash

echo "🚀 Starting Hardhat Local Network..."
echo "📍 Network: http://127.0.0.1:8545"
echo "🔗 Chain ID: 31337"
echo ""
echo "💰 Accounts (use these private keys in MetaMask):"
echo ""

npx hardhat node --hostname 0.0.0.0
