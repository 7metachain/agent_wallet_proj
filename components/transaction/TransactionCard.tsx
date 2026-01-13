"use client";

import { useState, useEffect } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { Intent, BalanceInfo, TransferIntent } from "@/types/intent";
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
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { queryAllBalances, queryNativeBalance, queryERC20Balance, formatBalanceMessage } from "@/lib/web3/balance";
import { Address, formatUnits } from "viem";
import { useTransferValidation } from "@/hooks/useTransferValidation";
import { getTokenBySymbol } from "@/lib/web3/tokens";

interface TransactionCardProps {
  intent: Intent;
}

const intentIcons = {
  swap: ArrowRightLeft,
  stake: PiggyBank,
  unstake: ArrowUpRight,
  claim_rewards: PiggyBank,
  transfer: SendHorizontal,
  check_balance: Wallet,
};

const intentLabels = {
  swap: "Swap",
  stake: "Stake MON",
  unstake: "Unstake MON",
  claim_rewards: "Claim Rewards",
  transfer: "Transfer",
  check_balance: "Check Balance",
};

export function TransactionCard({ intent }: TransactionCardProps) {
  const { isConnected, address, chain } = useAccount();
  const publicClient = usePublicClient({ chainId: chain?.id });
  const [isExecuting, setIsExecuting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<BalanceInfo[]>(
    (intent.type === "check_balance" && intent.params.balances) || []
  );
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const { sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Transfer validation hook
  const transferValidation = useTransferValidation({
    intent: intent.type === "transfer" ? (intent as TransferIntent) : undefined,
    address: address as Address | undefined,
    chainId: chain?.id,
    publicClient: publicClient || undefined,
  });

  // Auto-fetch balances when component mounts if it's a check_balance intent
  useEffect(() => {
    if (
      intent.type === "check_balance" &&
      address &&
      publicClient &&
      chain &&
      !balances.length
    ) {
      fetchBalances();
    }
  }, [intent.type, address, chain?.id]);

  const fetchBalances = async () => {
    console.log("fetchBalances called", { address, chainId: chain?.id, hasPublicClient: !!publicClient });

    if (!address) {
      setError("Please connect your wallet to check balance");
      console.error("No address found");
      return;
    }

    if (!chain) {
      setError("Chain not detected");
      console.error("No chain found");
      return;
    }

    if (!publicClient) {
      setError("Public client not available");
      console.error("No publicClient found");
      return;
    }

    setIsLoadingBalances(true);
    setError(null);

    try {
      console.log("Starting balance fetch for address:", address, "chainId:", chain.id);
      let fetchedBalances: BalanceInfo[];

      if (intent.type === "check_balance" && intent.params.token) {
        // Query specific token
        const symbol = intent.params.token.toUpperCase();
        console.log("Querying specific token:", symbol);

        if (symbol === "MON") {
          const balance = await queryNativeBalance(
            address as Address,
            chain.id,
            publicClient
          );
          console.log("Native balance fetched:", balance);
          fetchedBalances = [balance];
        } else {
          const balance = await queryERC20Balance(
            address as Address,
            symbol,
            chain.id,
            publicClient
          );

          if (!balance) {
            setError(`Token ${symbol} is not supported on this network`);
            setIsLoadingBalances(false);
            return;
          }

          console.log("ERC20 balance fetched:", balance);
          fetchedBalances = [balance];
        }
      } else {
        // Query all tokens
        console.log("Querying all tokens");
        fetchedBalances = await queryAllBalances(
          address as Address,
          chain.id,
          publicClient
        );
        console.log("All balances fetched:", fetchedBalances);
      }

      setBalances(fetchedBalances);
    } catch (err: any) {
      console.error("Balance fetch error:", err);
      console.error("Error details:", {
        message: err.message,
        cause: err.cause,
        stack: err.stack
      });
      setError(`Failed to fetch balances: ${err.message}`);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const Icon = intentIcons[intent.type];
  const label = intentLabels[intent.type];

  // 格式化参数显示
  const formatParams = () => {
    switch (intent.type) {
      case "swap":
        return `${intent.params.amount} ${intent.params.fromToken} → ${intent.params.toToken}`;
      case "stake":
        return `${intent.params.amount} MON`;
      case "unstake":
        return `${intent.params.amount} MON`;
      case "claim_rewards":
        return "From validator";
      case "transfer":
        return `${intent.params.amount} ${intent.params.token} to ${shortenAddress(intent.params.to)}`;
      case "check_balance":
        if (isLoadingBalances) {
          return "Loading...";
        }
        if (balances.length > 0) {
          if (balances.length === 1) {
            return `${balances[0].balance} ${balances[0].symbol}`;
          }
          return `${balances.length} tokens`;
        }
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

    console.log("🚀 Starting transaction execution", { intent, address, chainId: chain?.id });

    setIsExecuting(true);
    setError(null);

    try {
      // For transfer intents, run validation first
      if (intent.type === "transfer") {
        // Run pre-flight validation
        console.log("✅ Running validation...");
        await transferValidation.validate();

        console.log("📊 Validation results:", {
          canExecute: transferValidation.canExecute,
          errors: transferValidation.errors,
          warnings: transferValidation.warnings,
          resolvedRecipient: transferValidation.resolvedRecipient,
        });

        // Check if validation passed
        if (!transferValidation.canExecute) {
          console.error("❌ Validation failed:", transferValidation.errors);
          setError(transferValidation.errors.join(". "));
          setIsExecuting(false);
          return;
        }

        // Use resolved recipient address for transaction
        const recipient = transferValidation.resolvedRecipient || intent.params.to;

        // Build transaction with validated data
        console.log("🔄 Calling transaction API...");
        const response = await fetch("/api/transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: {
              ...intent,
              params: {
                ...intent.params,
                to: recipient, // Use resolved address
              },
            },
            walletAddress: address,
            chainId: chain?.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("❌ API error:", errorData);
          throw new Error("Failed to build transaction");
        }

        const { transactions } = await response.json();
        console.log("📦 Transaction data received:", transactions);

        if (transactions && transactions.length > 0) {
          const tx = transactions[0];
          console.log("💳 Sending transaction to wallet:", {
            to: tx.to,
            data: tx.data,
            value: tx.value,
          });

          // 发送交易
          sendTransaction(
            {
              to: tx.to,
              data: tx.data,
              value: BigInt(tx.value || 0),
            },
            {
              onSuccess: (hash) => {
                console.log("✅ Transaction sent successfully:", hash);
                setTxHash(hash);
              },
              onError: (err) => {
                console.error("❌ Transaction failed:", err);
                setError(err.message);
                setIsExecuting(false);
              },
            }
          );
        }
      } else {
        // Existing flow for non-transfer intents
        console.log("🔄 Calling transaction API for non-transfer intent...");
        const response = await fetch("/api/transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent,
            walletAddress: address,
            chainId: chain?.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("❌ API error:", errorData);
          throw new Error("Failed to build transaction");
        }

        const { transactions } = await response.json();
        console.log("📦 Transaction data received:", transactions);

        if (transactions && transactions.length > 0) {
          const tx = transactions[0];
          console.log("💳 Sending transaction to wallet:", {
            to: tx.to,
            data: tx.data,
            value: tx.value,
          });

          // 发送交易
          sendTransaction(
            {
              to: tx.to,
              data: tx.data,
              value: BigInt(tx.value || 0),
            },
            {
              onSuccess: (hash) => {
                console.log("✅ Transaction sent successfully:", hash);
                setTxHash(hash);
              },
              onError: (err) => {
                console.error("❌ Transaction failed:", err);
                setError(err.message);
                setIsExecuting(false);
              },
            }
          );
        }
      }
    } catch (err: any) {
      console.error("❌ Execution error:", err);
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
                    `https://monadvision.com/tx/${txHash}`,
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

        {/* Transfer Validation UI */}
        {intent.type === "transfer" && (
          <>
            {/* Validation Loading State */}
            {transferValidation.isValidating && (
              <div className="mt-3 flex items-center gap-2 border-t pt-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Validating transfer...
                </span>
              </div>
            )}

            {/* Validation Results */}
            {transferValidation.validationComplete && !transferValidation.isValidating && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {/* ENS Resolution Display */}
                {transferValidation.isENS && transferValidation.resolvedRecipient && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">ENS Resolved</Badge>
                    <span className="text-muted-foreground">
                      {shortenAddress(transferValidation.resolvedRecipient)}
                    </span>
                  </div>
                )}

                {/* Balance Info */}
                {transferValidation.tokenBalance !== null && chain?.id && (
                  <div className="text-sm text-muted-foreground">
                    Available: {formatUnits(transferValidation.tokenBalance, getTokenBySymbol(chain.id, (intent as TransferIntent).params.token)?.decimals || 18)}{" "}
                    {(intent as TransferIntent).params.token}
                  </div>
                )}

                {/* Gas Estimate */}
                {transferValidation.estimatedGasCost && (
                  <div className="text-sm text-muted-foreground">
                    Est. Gas: {transferValidation.estimatedGasCost} MON
                  </div>
                )}

                {/* Warnings */}
                {transferValidation.warnings.map((warning, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Balance Details */}
        {intent.type === "check_balance" && (
          <>
            {isLoadingBalances && (
              <div className="mt-3 flex items-center justify-center gap-2 border-t pt-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Fetching balances...
                </span>
              </div>
            )}

            {!isLoadingBalances && balances.length > 0 && (
              <div className="mt-3 space-y-1 border-t pt-3">
                {balances.map((balance) => (
                  <div
                    key={balance.symbol}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{balance.symbol}</span>
                    <span className="font-medium">
                      {balance.balance} {balance.symbol}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
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

