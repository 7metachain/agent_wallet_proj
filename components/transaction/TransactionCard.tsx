"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { Intent } from "@/types/intent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft,
  PiggyBank,
  ArrowUpRight,
  SendHorizontal,
  Wallet,
  Loader2,
  Check,
  X,
  ExternalLink,
  Droplet,
} from "lucide-react";
import { useIntentExecution } from "@/hooks/useWalletInteractions";
import { formatUnits } from "viem";

interface TransactionCardProps {
  intent: Intent;
  onExecutionComplete?: (success: boolean, txHashes: string[]) => void;
}

const intentIcons = {
  swap: ArrowRightLeft,
  supply: PiggyBank,
  withdraw: ArrowUpRight,
  transfer: SendHorizontal,
  check_balance: Wallet,
  call_faucet: Droplet,
  stake_with_yield: PiggyBank,
};

const intentLabels = {
  swap: "Swap",
  supply: "Supply to Aave",
  withdraw: "Withdraw from Aave",
  transfer: "Transfer",
  check_balance: "Check Balance",
  call_faucet: "Call Faucet",
  stake_with_yield: "Stake with Yield Recipient",
};

export function TransactionCard({ intent, onExecutionComplete }: TransactionCardProps) {
  const { isConnected, chainId, address } = useAccount();
  const { execute, isExecuting, isConfirming, isSuccess, error, currentTxHash } = useIntentExecution(intent);
  const [balanceResult, setBalanceResult] = useState<string | null>(null);

  // 检查是否是 Mock 模式
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

  // 查询原生代币余额
  const { data: nativeBalance } = useBalance({
    address: address,
  });

  const Icon = intentIcons[intent.type];
  const label = intentLabels[intent.type];

  // Debug logging
  console.log("🔍 [TransactionCard] Rendering for intent:", intent.type, "- Connected:", isConnected, "- Mock Mode:", isMockMode);

  // 格式化参数显示
  const formatParams = () => {
    switch (intent.type) {
      case "swap":
        return `${intent.params.amount} ${intent.params.fromToken} → ${intent.params.toToken}`;
      case "supply":
        return `${intent.params.amount} ${intent.params.token}`;
      case "withdraw":
        return `${intent.params.amount} ${intent.params.token}`;
      case "transfer":
        return `${intent.params.amount} ${intent.params.token} to ${shortenAddress(intent.params.to)}`;
      case "check_balance":
        return intent.params.token || "All tokens";
      case "call_faucet":
        return `Get ${intent.params.token || "MONAD"} tokens`;
      case "stake_with_yield":
        return `${intent.params.amount} ${intent.params.token} → Yield to ${shortenAddress(intent.params.yieldRecipient)}`;
      default:
        return "";
    }
  };

  const shortenAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 执行交易
  const handleExecute = async () => {
    console.log('[TransactionCard] handleExecute called', {
      isConnected,
      intent,
      chainId,
      address
    });

    if (!isConnected) {
      console.error('[TransactionCard] Wallet not connected');
      alert('请先连接钱包！');
      return;
    }

    try {
      console.log('[TransactionCard] Calling execute()...');
      const result = await execute();
      console.log('[TransactionCard] Execute result:', result);
      console.log('[TransactionCard] Execute result.success:', result.success);
      console.log('[TransactionCard] Execute result.txHashes:', result.txHashes);
      console.log('[TransactionCard] Execute result.error:', result.error);

      // 如果交易成功，立即更新余额显示
      if (result.success && nativeBalance) {
        const symbol = chainId === 10143 ? "MON" : "ETH";
        const formattedBalance = formatUnits(nativeBalance.value, nativeBalance.decimals);

        if (intent.type === "swap") {
          setBalanceResult(`${symbol} 余额: ${parseFloat(formattedBalance).toFixed(4)} (交易成功)`);
          console.log('[TransactionCard] Swap success, balance set to:', balanceResult);
        } else if (intent.type === "check_balance") {
          setBalanceResult(`${parseFloat(formattedBalance).toFixed(4)} ${symbol}`);
        }
      }

      // 通知父组件执行完成
      if (onExecutionComplete) {
        onExecutionComplete(result.success, result.txHashes);
      }
    } catch (error: any) {
      console.error('[TransactionCard] Execute failed:', error);
      alert(`交易失败: ${error.message || '未知错误'}`);
    }
  };

  // 监听交易成功状态
  useEffect(() => {
    console.log('[TransactionCard] State changed:', { isSuccess, isConfirming, isExecuting, error, currentTxHash });

    if (isSuccess && intent.type === "check_balance" && nativeBalance) {
      const symbol = chainId === 10143 ? "MON" : "ETH";
      const formattedBalance = formatUnits(nativeBalance.value, nativeBalance.decimals);
      setBalanceResult(`${parseFloat(formattedBalance).toFixed(4)} ${symbol}`);
    }

    // Swap 成功后显示余额
    if (isSuccess && intent.type === "swap" && nativeBalance) {
      const symbol = chainId === 10143 ? "MON" : "ETH";
      const formattedBalance = formatUnits(nativeBalance.value, nativeBalance.decimals);
      setBalanceResult(`${symbol} 余额: ${parseFloat(formattedBalance).toFixed(4)}`);
      console.log('[TransactionCard] Swap completed, balance updated:', balanceResult);
    }

    // Faucet 成功后显示消息
    if (isSuccess && intent.type === "call_faucet") {
      setBalanceResult(`✅ 成功获取 100 ${intent.params.token || "MONAD"} 代币！请稍等片刻后查询余额更新。`);
      console.log('[TransactionCard] Faucet completed');
    }

    if (isSuccess && onExecutionComplete && currentTxHash) {
      onExecutionComplete(true, [currentTxHash]);
    }
  }, [isSuccess, currentTxHash, onExecutionComplete, nativeBalance, chainId, intent.type, error, isConfirming, isExecuting]);

  // 状态徽章
  const getStatusBadge = () => {
    if (isSuccess) {
      return <Badge variant="success">Confirmed</Badge>;
    }
    if (isConfirming) {
      return <Badge variant="warning">Confirming...</Badge>;
    }
    if (isExecuting) {
      return <Badge variant="secondary">Executing</Badge>;
    }
    if (error) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="outline">Ready</Badge>;
  };

  return (
    <Card className={`w-full ${isMockMode ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-primary/20 bg-card/50'}`}>
      <CardContent className="p-4">
        {isMockMode && (
          <div className="mb-2 rounded-md bg-yellow-500/10 px-2 py-1 text-xs text-yellow-600 dark:text-yellow-400">
            🎭 Mock Mode: Transactions are simulated
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          {/* Icon & Info */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{label}</span>
                {getStatusBadge()}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatParams()}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            {currentTxHash && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const explorerUrls: Record<number, string> = {
                    11155111: "https://sepolia.etherscan.io",
                    84532: "https://sepolia.basescan.org",
                    421614: "https://sepolia.arbiscan.io",
                    10143: "https://explorer.testnet.monad.xyz",
                  };
                  const explorerUrl = explorerUrls[chainId || 11155111] || "https://sepolia.etherscan.io";
                  window.open(`${explorerUrl}/tx/${currentTxHash}`, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}

            {!currentTxHash && !isSuccess && (
              <Button
                size="sm"
                onClick={handleExecute}
                disabled={isExecuting || isConfirming}
              >
                {isExecuting || isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isConfirming ? "Confirming" : intent.type === "check_balance" || intent.type === "call_faucet" ? "Calling" : "Executing"}
                  </>
                ) : (
                  intent.type === "check_balance" ? "Check" : intent.type === "call_faucet" ? "Call Faucet" : "Execute"
                )}
              </Button>
            )}

            {isSuccess && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-4 w-4 text-green-500" />
              </div>
            )}
          </div>
        </div>

        {/* Balance Result (for check_balance, swap, and call_faucet) */}
        {(intent.type === "check_balance" || intent.type === "swap" || intent.type === "call_faucet") && isSuccess && balanceResult && (
          <div className="mt-3 rounded-lg bg-green-500/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>{balanceResult}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <X className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

