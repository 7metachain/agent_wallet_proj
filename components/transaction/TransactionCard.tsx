"use client";

import { useState } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
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
  supply: "Supply to Aave",
  withdraw: "Withdraw from Aave",
  transfer: "Transfer",
  check_balance: "Check Balance",
};

export function TransactionCard({ intent }: TransactionCardProps) {
  const { isConnected } = useAccount();
  const [isExecuting, setIsExecuting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);

  const { sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
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
    if (!isConnected) return;

    setIsExecuting(true);
    setError(null);

    try {
      // 调用后端 API 获取交易数据
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
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
            },
            onError: (err) => {
              setError(err.message);
              setIsExecuting(false);
            },
          }
        );
      }
    } catch (err: any) {
      setError(err.message || "Transaction failed");
      setIsExecuting(false);
    }
  };

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
                    `https://sepolia.basescan.org/tx/${txHash}`,
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

