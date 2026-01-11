"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
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
import { useIntentExecution } from "@/hooks/useWalletInteractions";

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
};

const intentLabels = {
  swap: "Swap",
  supply: "Supply to Aave",
  withdraw: "Withdraw from Aave",
  transfer: "Transfer",
  check_balance: "Check Balance",
};

export function TransactionCard({ intent, onExecutionComplete }: TransactionCardProps) {
  const { isConnected, chainId } = useAccount();
  const { execute, isExecuting, isConfirming, isSuccess, error, currentTxHash } = useIntentExecution(intent);

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

    const result = await execute();

    // 通知父组件执行完成
    if (onExecutionComplete) {
      onExecutionComplete(result.success, result.txHashes);
    }
  };

  // 监听交易成功状态
  useEffect(() => {
    if (isSuccess && onExecutionComplete && currentTxHash) {
      onExecutionComplete(true, [currentTxHash]);
    }
  }, [isSuccess, currentTxHash, onExecutionComplete]);

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
                  };
                  const explorerUrl = explorerUrls[chainId || 11155111] || "https://sepolia.etherscan.io";
                  window.open(`${explorerUrl}/tx/${currentTxHash}`, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}

            {!currentTxHash && !isSuccess && intent.type !== "check_balance" && (
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

