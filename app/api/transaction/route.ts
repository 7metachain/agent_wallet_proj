import { NextRequest, NextResponse } from "next/server";
import { encodeFunctionData, parseUnits } from "viem";
import { Intent } from "@/types/intent";
import { getTokenBySymbol } from "@/lib/web3/tokens";
import { erc20Abi } from "@/lib/web3/abi/erc20";
import { aavePoolAbi } from "@/lib/web3/abi/aave-v3-pool";

// Uniswap V3 Router 地址
const SWAP_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_MOCK_SWAP_ROUTER || "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

// Aave V3 Pool 地址
const AAVE_POOL_ADDRESS = process.env.NEXT_PUBLIC_MOCK_AAVE_POOL || "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, walletAddress, chainId = 11155111 } = body;

    if (!intent) {
      return NextResponse.json(
        { error: "Intent is required" },
        { status: 400 }
      );
    }

    console.log('=== Transaction API 调用 ===');
    console.log('Intent:', JSON.stringify(intent, null, 2));
    console.log('Wallet Address:', walletAddress);
    console.log('Chain ID:', chainId);
    console.log('Aave Pool Address:', AAVE_POOL_ADDRESS);
    console.log('Swap Router Address:', SWAP_ROUTER_ADDRESS);

    const transactions = await buildTransactions(intent, walletAddress, chainId);

    console.log('=== 构建的交易 ===');
    console.log('Transactions:', JSON.stringify(transactions, null, 2));

    return NextResponse.json({
      transactions,
      summary: {
        totalSteps: transactions.length,
        estimatedGas: "0.001 ETH",
        warnings: transactions.length > 1 ? ["Multiple transactions required"] : [],
      },
    });
  } catch (error: any) {
    console.error("Transaction API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to build transaction" },
      { status: 500 }
    );
  }
}

async function buildTransactions(
  intent: Intent,
  walletAddress: string,
  chainId: number
) {
  const transactions = [];

  switch (intent.type) {
    case "swap": {
      const { fromToken, toToken, amount } = intent.params;
      const fromTokenInfo = getTokenBySymbol(chainId, fromToken);
      const toTokenInfo = getTokenBySymbol(chainId, toToken);

      if (!fromTokenInfo || !toTokenInfo) {
        throw new Error(`Token not found: ${fromToken} or ${toToken}`);
      }

      const amountIn = parseUnits(amount, fromTokenInfo.decimals);

      // 如果不是 ETH，需要先 approve
      if (fromToken.toUpperCase() !== "ETH") {
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [SWAP_ROUTER_ADDRESS, amountIn],
        });

        transactions.push({
          id: `${intent.id}-approve`,
          type: "approve",
          to: fromTokenInfo.address,
          data: approveData,
          value: "0",
          description: `Approve ${amount} ${fromToken} for swap`,
        });
      }

      // Swap 交易 (简化版本，实际需要调用 Uniswap SDK 或 0x API)
      // 这里只是示例，实际实现需要集成真实的 DEX API
      transactions.push({
        id: `${intent.id}-swap`,
        type: "swap",
        to: SWAP_ROUTER_ADDRESS,
        data: "0x", // 需要实际的 swap calldata
        value: fromToken.toUpperCase() === "ETH" ? amountIn.toString() : "0",
        description: `Swap ${amount} ${fromToken} to ${toToken}`,
      });
      break;
    }

    case "supply": {
      const { token, amount } = intent.params;
      console.log('=== Supply 操作 ===');
      console.log('Token:', token);
      console.log('Amount:', amount);

      const tokenInfo = getTokenBySymbol(chainId, token);
      console.log('Token Info:', tokenInfo);

      if (!tokenInfo) {
        throw new Error(`Token not found: ${token}`);
      }

      const amountToSupply = parseUnits(amount, tokenInfo.decimals);
      console.log('Amount to Supply (raw):', amountToSupply.toString());

      // 如果不是 ETH，需要先 approve
      if (token.toUpperCase() !== "ETH") {
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [AAVE_POOL_ADDRESS, amountToSupply],
        });
        console.log('Approve Data:', approveData);

        transactions.push({
          id: `${intent.id}-approve`,
          type: "approve",
          to: tokenInfo.address,
          data: approveData,
          value: "0",
          description: `Approve ${amount} ${token} for Aave`,
        });
      }

      // Supply 到 Aave
      const supplyData = encodeFunctionData({
        abi: aavePoolAbi,
        functionName: "supply",
        args: [
          tokenInfo.address,
          amountToSupply,
          walletAddress as `0x${string}`,
          0, // referralCode
        ],
      });
      console.log('Supply Data:', supplyData);

      transactions.push({
        id: `${intent.id}-supply`,
        type: "supply",
        to: AAVE_POOL_ADDRESS,
        data: supplyData,
        value: token.toUpperCase() === "ETH" ? amountToSupply.toString() : "0",
        description: `Supply ${amount} ${token} to Aave`,
      });
      break;
    }

    case "withdraw": {
      const { token, amount } = intent.params;
      const tokenInfo = getTokenBySymbol(chainId, token);

      if (!tokenInfo) {
        throw new Error(`Token not found: ${token}`);
      }

      const amountToWithdraw = amount === "max" 
        ? BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
        : parseUnits(amount, tokenInfo.decimals);

      // Withdraw 从 Aave
      const withdrawData = encodeFunctionData({
        abi: aavePoolAbi,
        functionName: "withdraw",
        args: [
          tokenInfo.address,
          amountToWithdraw,
          walletAddress as `0x${string}`,
        ],
      });

      transactions.push({
        id: `${intent.id}-withdraw`,
        type: "withdraw",
        to: AAVE_POOL_ADDRESS,
        data: withdrawData,
        value: "0",
        description: `Withdraw ${amount} ${token} from Aave`,
      });
      break;
    }

    case "transfer": {
      const { token, amount, to } = intent.params;
      const tokenInfo = getTokenBySymbol(chainId, token);

      if (!tokenInfo) {
        throw new Error(`Token not found: ${token}`);
      }

      const amountToTransfer = parseUnits(amount, tokenInfo.decimals);

      if (token.toUpperCase() === "ETH") {
        // ETH 转账
        transactions.push({
          id: `${intent.id}-transfer`,
          type: "transfer",
          to: to,
          data: "0x",
          value: amountToTransfer.toString(),
          description: `Transfer ${amount} ETH to ${to}`,
        });
      } else {
        // ERC20 转账
        const transferData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [to as `0x${string}`, amountToTransfer],
        });

        transactions.push({
          id: `${intent.id}-transfer`,
          type: "transfer",
          to: tokenInfo.address,
          data: transferData,
          value: "0",
          description: `Transfer ${amount} ${token} to ${to}`,
        });
      }
      break;
    }

    case "check_balance":
      // 余额查询不需要交易
      break;

    case "call_faucet": {
      // 调用 MockMonad 合约的 faucet 函数
      const mockMonadAddress = process.env.NEXT_PUBLIC_MONAD_TOKEN || "0x0000000000000000000000000000000000000000";

      if (mockMonadAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("MockMonad contract address not configured");
      }

      // 简化的 faucet 调用（实际应该在 frontend 使用 viem 的 encodeFunctionData）
      transactions.push({
        id: `${intent.id}-faucet`,
        type: "swap", // 使用 swap 作为类型
        to: mockMonadAddress,
        data: "0x", // 实际应该编码 faucet() 调用
        value: "0",
        description: "Call MockMonad.faucet() to get 100 MONAD tokens",
      });
      break;
    }

    default:
      throw new Error(`Unknown intent type: ${(intent as any).type}`);
  }

  return transactions;
}

