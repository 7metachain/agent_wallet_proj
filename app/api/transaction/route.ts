import { NextRequest, NextResponse } from "next/server";
import { encodeFunctionData, parseUnits, Address } from "viem";
import { Intent } from "@/types/intent";
import { getTokenBySymbol, MONAD_TESTNET_CHAIN_ID } from "@/lib/web3/tokens";
import { erc20Abi } from "@/lib/web3/abi/erc20";
import { buildSupplyTx, buildWithdrawTx } from "@/lib/web3/curvance";

// Monad DEX Router 地址 (占位符，待实际部署后更新)
const SWAP_ROUTER_ADDRESS = "0x0000000000000000000000000000000000000200"; // Monad DEX Router

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, walletAddress, chainId = MONAD_TESTNET_CHAIN_ID } = body;

    if (!intent) {
      return NextResponse.json(
        { error: "Intent is required" },
        { status: 400 }
      );
    }

    const transactions = await buildTransactions(intent, walletAddress, chainId);

    return NextResponse.json({
      transactions,
      summary: {
        totalSteps: transactions.length,
        estimatedGas: "0.001 MON",
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

      // 如果不是 MON (原生代币)，需要先 approve
      if (fromToken.toUpperCase() !== "MON") {
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [SWAP_ROUTER_ADDRESS as Address, amountIn],
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

      // Swap 交易 (Monad DEX - 待集成实际 DEX 协议)
      transactions.push({
        id: `${intent.id}-swap`,
        type: "swap",
        to: SWAP_ROUTER_ADDRESS as Address,
        data: "0x", // 需要实际的 swap calldata
        value: fromToken.toUpperCase() === "MON" ? amountIn.toString() : "0",
        description: `Swap ${amount} ${fromToken} to ${toToken}`,
      });
      break;
    }

    case "supply": {
      const { token, amount } = intent.params;
      
      // 使用 Curvance 协议构建 supply 交易
      const supplyTxs = await buildSupplyTx({
        token,
        amount,
        userAddress: walletAddress as Address,
      });

      transactions.push(...supplyTxs);
      break;
    }

    case "withdraw": {
      const { token, amount } = intent.params;
      
      // 使用 Curvance 协议构建 withdraw 交易
      const withdrawTxs = await buildWithdrawTx({
        token,
        amount,
        userAddress: walletAddress as Address,
      });

      transactions.push(...withdrawTxs);
      break;
    }

    case "transfer": {
      const { token, amount, to } = intent.params;
      const tokenInfo = getTokenBySymbol(chainId, token);

      if (!tokenInfo) {
        throw new Error(`Token not found: ${token}`);
      }

      const amountToTransfer = parseUnits(amount, tokenInfo.decimals);

      if (token.toUpperCase() === "MON") {
        // MON (原生代币) 转账
        transactions.push({
          id: `${intent.id}-transfer`,
          type: "transfer",
          to: to,
          data: "0x",
          value: amountToTransfer.toString(),
          description: `Transfer ${amount} MON to ${to}`,
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

    default:
      throw new Error(`Unknown intent type: ${(intent as any).type}`);
  }

  return transactions;
}

