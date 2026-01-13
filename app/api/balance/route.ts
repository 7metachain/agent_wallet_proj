import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, formatEther, formatUnits, Address } from "viem";
import { monadMainnet, monadTestnet, MONAD_MAINNET_CHAIN_ID, MONAD_TESTNET_CHAIN_ID } from "@/lib/web3/chains";
import { getTokensForChain } from "@/lib/web3/tokens";
import { erc20Abi } from "@/lib/web3/abi/erc20";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const chainId = parseInt(searchParams.get("chainId") || String(MONAD_MAINNET_CHAIN_ID));
    const tokenSymbol = searchParams.get("token"); // 可选：查询特定代币

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // 根据 chainId 选择正确的网络
    const chain = chainId === MONAD_MAINNET_CHAIN_ID ? monadMainnet : monadTestnet;
    
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const balances = [];

    // 查询原生代币 (MON) 余额
    try {
      const nativeBalance = await publicClient.getBalance({
        address: address as Address,
      });

      balances.push({
        token: {
          symbol: "MON",
          name: "Monad",
          decimals: 18,
          address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address,
        },
        balance: nativeBalance.toString(),
        formatted: formatEther(nativeBalance),
        usdValue: null, // TODO: 集成价格 API
      });
    } catch (error) {
      console.error("Error fetching native balance:", error);
    }

    // 如果指定了 token，只查询该 token
    if (tokenSymbol) {
      const tokens = getTokensForChain(chainId);
      const targetToken = tokens.find(
        (t) => t.symbol.toUpperCase() === tokenSymbol.toUpperCase()
      );

      if (targetToken && targetToken.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        // 查询 ERC20 Token 余额（如果不是原生代币）
        try {
          const tokenBalance = await publicClient.readContract({
            address: targetToken.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address as Address],
          });

          balances.push({
            token: targetToken,
            balance: tokenBalance.toString(),
            formatted: formatUnits(tokenBalance, targetToken.decimals),
            usdValue: null,
          });
        } catch (error) {
          console.error(`Error fetching ${tokenSymbol} balance:`, error);
        }
      }
    } else {
      // 查询所有常用 Token 余额（仅查询有真实地址的）
      // 注意：当前大部分 Token 地址是占位符，所以只查询原生 MON
      // 当 Token 地址更新后，可以取消注释下面的代码
      /*
      const tokens = getTokensForChain(chainId);
      for (const token of tokens) {
        // 跳过原生代币（已查询）
        if (token.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
          continue;
        }
        
        // 跳过占位符地址
        if (token.address.startsWith("0x0000")) {
          continue;
        }

        try {
          const tokenBalance = await publicClient.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address as Address],
          });

          balances.push({
            token,
            balance: tokenBalance.toString(),
            formatted: formatUnits(tokenBalance, token.decimals),
            usdValue: null,
          });
        } catch (error) {
          // 忽略查询失败的 Token（可能是地址不存在）
          console.error(`Error fetching ${token.symbol} balance:`, error);
        }
      }
      */
    }

    return NextResponse.json({
      balances,
      address,
      chainId,
    });
  } catch (error: any) {
    console.error("Balance API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
