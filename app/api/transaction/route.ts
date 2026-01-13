import { NextRequest, NextResponse } from "next/server";
import { encodeFunctionData, parseUnits } from "viem";
import { Intent } from "@/types/intent";
import { getTokenBySymbol } from "@/lib/web3/tokens";
import { erc20Abi } from "@/lib/web3/abi/erc20";
import { monadStakingAbi, MONAD_STAKING_ADDRESS, DEFAULT_VALIDATOR_ADDRESS } from "@/lib/web3/abi/monad-staking";

// Uniswap V3 Router 地址 (需要更新为 Monad 上的地址)
const SWAP_ROUTER_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"; // TODO: Update to Monad Uniswap address

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

    const transactions = await buildTransactions(intent, walletAddress, chainId);

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

    case "stake": {
      const { amount, validator } = intent.params;
      const amountToStake = parseUnits(amount, 18); // MON has 18 decimals
      const validatorAddress = (validator || DEFAULT_VALIDATOR_ADDRESS) as `0x${string}`;

      // Encode delegate function call
      const delegateData = encodeFunctionData({
        abi: monadStakingAbi,
        functionName: "delegate",
        args: [validatorAddress],
      });

      transactions.push({
        id: `${intent.id}-stake`,
        type: "stake",
        to: MONAD_STAKING_ADDRESS,
        data: delegateData,
        value: amountToStake.toString(), // Send MON with the transaction
        description: `Stake ${amount} MON to validator`,
      });
      break;
    }

    case "unstake": {
      const { amount, validator } = intent.params;
      const amountToUnstake = parseUnits(amount, 18); // MON has 18 decimals
      const validatorAddress = (validator || DEFAULT_VALIDATOR_ADDRESS) as `0x${string}`;

      // Encode undelegate function call
      const undelegateData = encodeFunctionData({
        abi: monadStakingAbi,
        functionName: "undelegate",
        args: [validatorAddress, amountToUnstake],
      });

      transactions.push({
        id: `${intent.id}-unstake`,
        type: "unstake",
        to: MONAD_STAKING_ADDRESS,
        data: undelegateData,
        value: "0",
        description: `Unstake ${amount} MON from validator`,
      });
      break;
    }

    case "claim_rewards": {
      const { validator } = intent.params;
      const validatorAddress = (validator || DEFAULT_VALIDATOR_ADDRESS) as `0x${string}`;

      // Encode claimRewards function call
      const claimRewardsData = encodeFunctionData({
        abi: monadStakingAbi,
        functionName: "claimRewards",
        args: [validatorAddress],
      });

      transactions.push({
        id: `${intent.id}-claim`,
        type: "claim_rewards",
        to: MONAD_STAKING_ADDRESS,
        data: claimRewardsData,
        value: "0",
        description: `Claim staking rewards from validator`,
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

    default:
      throw new Error(`Unknown intent type: ${(intent as any).type}`);
  }

  return transactions;
}

