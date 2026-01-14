"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { getTransactionHistoryByWallet, TransactionHistory } from "@/types/history";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRightLeft,
  PiggyBank,
  ArrowUpRight,
  SendHorizontal,
  Wallet,
  Check,
  X,
  Clock,
  ExternalLink,
  History as HistoryIcon,
} from "lucide-react";
import { monadTestnet, monadMainnet, MONAD_MAINNET_CHAIN_ID } from "@/lib/web3/chains";
import { formatAddress } from "@/lib/utils";

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

interface TransactionHistoryProps {
  onClose?: () => void;
}

export function TransactionHistory({ onClose }: TransactionHistoryProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [histories, setHistories] = useState<TransactionHistory[]>([]);

  useEffect(() => {
    if (address) {
      const walletHistories = getTransactionHistoryByWallet(address);
      setHistories(walletHistories);
    }
  }, [address]);

  // 定期刷新历史记录
  useEffect(() => {
    const interval = setInterval(() => {
      if (address) {
        const walletHistories = getTransactionHistoryByWallet(address);
        setHistories(walletHistories);
      }
    }, 2000); // 每2秒刷新一次

    return () => clearInterval(interval);
  }, [address]);

  const formatParams = (intent: TransactionHistory["intent"]) => {
    switch (intent.type) {
      case "swap":
        return `${intent.params.amount} ${intent.params.fromToken} → ${intent.params.toToken}`;
      case "supply":
        return `${intent.params.amount} ${intent.params.token}`;
      case "withdraw":
        return `${intent.params.amount} ${intent.params.token}`;
      case "transfer":
        return `${intent.params.amount} ${intent.params.token} to ${formatAddress(intent.params.to)}`;
      case "check_balance":
        return intent.params.token || "All tokens";
      default:
        return "";
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const getStatusBadge = (status: TransactionHistory["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">成功</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/50">失败</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">处理中</Badge>;
      default:
        return null;
    }
  };

  const getExplorerUrl = (txHash: string, historyChainId: number) => {
    const chain = historyChainId === MONAD_MAINNET_CHAIN_ID ? monadMainnet : monadTestnet;
    return `${chain.blockExplorers.default.url}/tx/${txHash}`;
  };

  if (!address) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          请先连接钱包以查看交易历史
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            <h3 className="font-semibold">交易历史</h3>
            <Badge variant="outline">{histories.length}</Badge>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>

        {/* History List */}
        <ScrollArea className="h-[500px]">
          {histories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <HistoryIcon className="mb-4 h-12 w-12 opacity-50" />
              <p>暂无交易历史</p>
            </div>
          ) : (
            <div className="divide-y">
              {histories.map((history) => {
                const Icon = intentIcons[history.intent.type];
                const label = intentLabels[history.intent.type];

                return (
                  <div
                    key={history.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{label}</span>
                            {getStatusBadge(history.status)}
                          </div>
                          <span className="text-sm text-muted-foreground truncate">
                            {formatParams(history.intent)}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(history.timestamp)}</span>
                            {history.txHash && (
                              <>
                                <span>•</span>
                                <span className="font-mono">
                                  {formatAddress(history.txHash)}
                                </span>
                              </>
                            )}
                          </div>
                          {history.error && (
                            <div className="mt-1 text-xs text-red-500">
                              {history.error}
                            </div>
                          )}
                        </div>
                      </div>
                      {history.txHash && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() =>
                            window.open(getExplorerUrl(history.txHash!, history.chainId), "_blank")
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
