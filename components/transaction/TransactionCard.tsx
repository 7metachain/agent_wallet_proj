"use client";

import { useState, useEffect } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { Intent } from "@/types/intent";
import { saveTransactionHistory, updateTransactionStatus, TransactionHistory } from "@/types/history";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { monadTestnet } from "@/lib/web3/config";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionCardProps {
  intent: Intent;
}

const intentIcons = {
  swap: ArrowRightLeft,
  supply: PiggyBank,
  withdraw: ArrowUpRight,
  transfer: SendHorizontal,
  check_balance: Wallet,
};

const intentLabels = {
  swap: "Swap",
  supply: "Supply to Curvance",
  withdraw: "Withdraw from Curvance",
  transfer: "Transfer",
  check_balance: "Check Balance",
};

export function TransactionCard({ intent }: TransactionCardProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [isExecuting, setIsExecuting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  const { sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const Icon = intentIcons[intent.type];
  const label = intentLabels[intent.type];

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
    if (!isConnected || !address) return;

    setIsExecuting(true);
    setError(null);

    try {
      // 创建历史记录（pending 状态）
      const history: TransactionHistory = {
        id: intent.id,
        intent,
        status: "pending",
        timestamp: Date.now(),
        chainId,
        walletAddress: address,
      };
      
      saveTransactionHistory(history);
      setHistoryId(intent.id);

      // 调用后端 API 获取交易数据
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          intent,
          walletAddress: address,
          chainId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to build transaction");
      }

      const { transactions } = await response.json();

      if (transactions && transactions.length > 0) {
        const tx = transactions[0];
        // 发送交易
        sendTransaction(
          {
            to: tx.to,
            data: tx.data,
            value: BigInt(tx.value || 0),
          },
          {
            onSuccess: (hash) => {
              setTxHash(hash);
              // 更新历史记录：添加 txHash
              updateTransactionStatus(intent.id, {
                status: "pending",
                txHash: hash,
              });
            },
            onError: (err) => {
              setError(err.message);
              setIsExecuting(false);
              // 更新历史记录：标记为失败
              updateTransactionStatus(intent.id, {
                status: "failed",
                error: err.message,
              });
            },
          }
        );
      }
    } catch (err: any) {
      setError(err.message || "Transaction failed");
      setIsExecuting(false);
      // 更新历史记录：标记为失败
      if (historyId) {
        updateTransactionStatus(historyId, {
          status: "failed",
          error: err.message || "Transaction failed",
        });
      }
    }
  };

  // 监听交易确认状态，更新历史记录
  useEffect(() => {
    if (isSuccess && txHash && receipt && historyId) {
      updateTransactionStatus(historyId, {
        status: "success",
        txHash,
        gasUsed: receipt.gasUsed?.toString(),
        blockNumber: Number(receipt.blockNumber),
      });
    }
  }, [isSuccess, txHash, receipt, historyId]);

  // 状态徽章
  const getStatusBadge = () => {
    if (isSuccess) {
      return <Badge variant="success">Confirmed</Badge>;
    }
    if (isConfirming) {
      return <Badge variant="warning">Confirming...</Badge>;
    }
    if (txHash) {
      return <Badge variant="secondary">Pending</Badge>;
    }
    if (error) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="outline">Ready</Badge>;
  };

  return (
    <Card className="w-full border-primary/20 bg-card/50">
      <CardContent className="p-4">
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
            {txHash && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  window.open(
                    `${monadTestnet.blockExplorers.default.url}/tx/${txHash}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}

            {!txHash && !isSuccess && intent.type !== "check_balance" && (
              <Button
                size="sm"
                onClick={handleExecute}
                disabled={!isConnected || isExecuting || isConfirming}
              >
                {isExecuting || isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isConfirming ? "Confirming" : "Executing"}
                  </>
                ) : (
                  "Execute"
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

