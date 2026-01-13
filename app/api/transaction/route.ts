import { NextRequest, NextResponse } from "next/server";
import { encodeFunctionData, parseUnits, Address } from "viem";
import { Intent } from "@/types/intent";
import { getTokenBySymbol, MONAD_MAINNET_CHAIN_ID, MONAD_TESTNET_CHAIN_ID } from "@/lib/web3/tokens";
import { erc20Abi } from "@/lib/web3/abi/erc20";
import { buildSupplyTx, buildWithdrawTx } from "@/lib/web3/curvance";
import { MOCK_DEX_ADDRESS, MOCK_DEX_ABI, NATIVE_TOKEN_ADDRESS } from "@/lib/web3/abi/dex";

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
      const isFromNative = fromToken.toUpperCase() === "MON";
      const isToNative = toToken.toUpperCase() === "MON";

      // 确定代币地址
      const fromTokenAddress = isFromNative ? NATIVE_TOKEN_ADDRESS : fromTokenInfo.address;
      const toTokenAddress = isToNative ? NATIVE_TOKEN_ADDRESS : toTokenInfo.address;

      // 如果源代币是 ERC20，需要先 approve
      if (!isFromNative) {
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [MOCK_DEX_ADDRESS as Address, amountIn],
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

      // 构建 Swap 交易
      if (isFromNative) {
        // MON → ERC20: 使用 swapNativeForToken
        const swapData = encodeFunctionData({
          abi: MOCK_DEX_ABI,
          functionName: "swapNativeForToken",
          args: [
            toTokenAddress as Address, // toToken
            BigInt(0), // minAmountOut (0 = 不限制滑点，演示用)
            walletAddress as Address, // recipient
          ],
        });

        transactions.push({
          id: `${intent.id}-swap`,
          type: "swap",
          to: MOCK_DEX_ADDRESS as Address,
          data: swapData,
          value: amountIn.toString(),
          description: `Swap ${amount} ${fromToken} → ${toToken}`,
        });
      } else if (isToNative) {
        // ERC20 → MON: 使用 swapTokenForNative
        const swapData = encodeFunctionData({
          abi: MOCK_DEX_ABI,
          functionName: "swapTokenForNative",
          args: [
            fromTokenAddress as Address, // fromToken
            amountIn, // amountIn
            BigInt(0), // minAmountOut
            walletAddress as Address, // recipient
          ],
        });

        transactions.push({
          id: `${intent.id}-swap`,
          type: "swap",
          to: MOCK_DEX_ADDRESS as Address,
          data: swapData,
          value: "0",
          description: `Swap ${amount} ${fromToken} → ${toToken}`,
        });
      } else {
        // ERC20 → ERC20: 使用 swapTokenForToken
        const swapData = encodeFunctionData({
          abi: MOCK_DEX_ABI,
          functionName: "swapTokenForToken",
          args: [
            fromTokenAddress as Address, // fromToken
            toTokenAddress as Address, // toToken
            amountIn, // amountIn
            BigInt(0), // minAmountOut
            walletAddress as Address, // recipient
          ],
        });

        transactions.push({
          id: `${intent.id}-swap`,
          type: "swap",
          to: MOCK_DEX_ADDRESS as Address,
          data: swapData,
          value: "0",
          description: `Swap ${amount} ${fromToken} → ${toToken}`,
        });
      }
      break;
    }

    case "supply": {
      const { token, amount } = intent.params;
      
      // 使用 Lending Pool 构建 supply 交易 (Mock on Testnet, Curvance on Mainnet)
      const supplyTxs = await buildSupplyTx({
        token,
        amount,
        userAddress: walletAddress as Address,
        chainId,
      });

      transactions.push(...supplyTxs);
      break;
    }

    case "withdraw": {
      const { token, amount } = intent.params;
      
      // 使用 Lending Pool 构建 withdraw 交易 (Mock on Testnet, Curvance on Mainnet)
      const withdrawTxs = await buildWithdrawTx({
        token,
        amount,
        userAddress: walletAddress as Address,
        chainId,
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
