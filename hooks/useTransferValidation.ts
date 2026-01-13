import { useState, useCallback } from "react";
import { Address, PublicClient } from "viem";
import { TransferIntent } from "@/types/intent";
import { getTokenBySymbol } from "@/lib/web3/tokens";
import { queryNativeBalance, queryERC20Balance } from "@/lib/web3/balance";
import {
  validateAddress,
  isENSName,
  resolveENSName,
  validateBalance,
  estimateTransferGas,
  validateGasBalance,
  formatGasCost,
  isContractAddress,
  generateTransferWarnings,
} from "@/lib/web3/transfer-validation";

export interface TransferValidationState {
  // Validation status
  isValidating: boolean;
  validationComplete: boolean;

  // Resolved data
  resolvedRecipient: Address | null;
  isENS: boolean;

  // Balance info
  tokenBalance: bigint | null;
  nativeBalance: bigint | null;

  // Gas estimates
  estimatedGas: bigint | null;
  estimatedGasCost: string | null;

  // Validation results
  errors: string[];
  warnings: string[];
  canExecute: boolean;

  // Actions
  validate: () => Promise<void>;
  reset: () => void;
}

interface UseTransferValidationProps {
  intent?: TransferIntent;
  address?: Address;
  chainId?: number;
  publicClient?: PublicClient;
}

export function useTransferValidation({
  intent,
  address,
  chainId,
  publicClient,
}: UseTransferValidationProps): TransferValidationState {
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [resolvedRecipient, setResolvedRecipient] = useState<Address | null>(null);
  const [isENS, setIsENS] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);
  const [nativeBalance, setNativeBalance] = useState<bigint | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [estimatedGasCost, setEstimatedGasCost] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [canExecute, setCanExecute] = useState(false);

  const reset = useCallback(() => {
    setIsValidating(false);
    setValidationComplete(false);
    setResolvedRecipient(null);
    setIsENS(false);
    setTokenBalance(null);
    setNativeBalance(null);
    setEstimatedGas(null);
    setEstimatedGasCost(null);
    setErrors([]);
    setWarnings([]);
    setCanExecute(false);
  }, []);

  const validate = useCallback(async () => {
    // Reset state
    reset();

    // Validation guards
    if (!intent || intent.type !== "transfer") {
      setErrors(["Invalid intent type"]);
      setValidationComplete(true);
      return;
    }

    if (!address) {
      setErrors(["Wallet not connected"]);
      setValidationComplete(true);
      return;
    }

    if (!chainId) {
      setErrors(["Chain not detected"]);
      setValidationComplete(true);
      return;
    }

    if (!publicClient) {
      setErrors(["Public client not available"]);
      setValidationComplete(true);
      return;
    }

    setIsValidating(true);

    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    try {
      const { token, amount, to } = intent.params;

      // Step 1: Validate token exists
      const tokenInfo = getTokenBySymbol(chainId, token);
      if (!tokenInfo) {
        validationErrors.push(`Token ${token} is not supported on this network`);
        setErrors(validationErrors);
        setValidationComplete(true);
        setIsValidating(false);
        return;
      }

      // Step 2: Detect and resolve recipient address
      let recipientAddress: Address | null = null;
      const isENSInput = isENSName(to);
      setIsENS(isENSInput);

      if (isENSInput) {
        // Resolve ENS name
        recipientAddress = await resolveENSName(to, publicClient);
        if (!recipientAddress) {
          validationErrors.push(`Unable to resolve ENS name: ${to}`);
          setErrors(validationErrors);
          setValidationComplete(true);
          setIsValidating(false);
          return;
        }
        setResolvedRecipient(recipientAddress);
      } else {
        // Validate address format
        const addressValidation = validateAddress(to);
        if (!addressValidation.valid) {
          validationErrors.push(addressValidation.error || "Invalid address");
          setErrors(validationErrors);
          setValidationComplete(true);
          setIsValidating(false);
          return;
        }
        recipientAddress = to as Address;
        setResolvedRecipient(recipientAddress);
      }

      // Step 3: Query token balance
      let userTokenBalance: bigint;
      if (token.toUpperCase() === "MON") {
        const balanceInfo = await queryNativeBalance(address, chainId, publicClient);
        userTokenBalance = BigInt(balanceInfo.rawBalance);
      } else {
        const balanceInfo = await queryERC20Balance(address, token, chainId, publicClient);
        if (!balanceInfo) {
          validationErrors.push(`Unable to query ${token} balance`);
          setErrors(validationErrors);
          setValidationComplete(true);
          setIsValidating(false);
          return;
        }
        userTokenBalance = BigInt(balanceInfo.rawBalance);
      }
      setTokenBalance(userTokenBalance);

      // Step 4: Validate amount against balance
      const balanceValidation = validateBalance({
        token,
        amount,
        userBalance: userTokenBalance,
        decimals: tokenInfo.decimals,
      });

      if (!balanceValidation.valid) {
        validationErrors.push(balanceValidation.error || "Insufficient balance");
        setErrors(validationErrors);
        setValidationComplete(true);
        setIsValidating(false);
        return;
      }

      // Step 5: Estimate gas
      const gasEstimate = await estimateTransferGas({
        from: address,
        to: recipientAddress,
        token,
        amount,
        chainId,
        publicClient,
      });
      setEstimatedGas(gasEstimate);

      // Step 6: Get gas price and calculate cost
      const gasPrice = await publicClient.getGasPrice();
      const gasCost = formatGasCost(gasEstimate, gasPrice);
      setEstimatedGasCost(gasCost);

      // Step 7: Query native balance for gas (if not already queried)
      let userNativeBalance: bigint;
      if (token.toUpperCase() === "MON") {
        userNativeBalance = userTokenBalance;
      } else {
        const nativeBalanceInfo = await queryNativeBalance(address, chainId, publicClient);
        userNativeBalance = BigInt(nativeBalanceInfo.rawBalance);
      }
      setNativeBalance(userNativeBalance);

      // Step 8: Validate gas balance
      const gasValidation = validateGasBalance({
        estimatedGas: gasEstimate,
        gasPrice,
        nativeBalance: userNativeBalance,
      });

      if (!gasValidation.sufficient) {
        validationErrors.push(
          `Insufficient MON for gas. Required: ${gasValidation.required} MON, Available: ${gasValidation.available} MON`
        );
      }

      // Step 9: Check if recipient is a contract
      const isContract = await isContractAddress(recipientAddress, publicClient);

      // Step 10: Generate warnings
      const transferWarnings = generateTransferWarnings({
        amount,
        tokenBalance: userTokenBalance,
        decimals: tokenInfo.decimals,
        isContract,
        gasCost,
        token,
      });
      validationWarnings.push(...transferWarnings);

      // Set final state
      setErrors(validationErrors);
      setWarnings(validationWarnings);
      setCanExecute(validationErrors.length === 0);
    } catch (error: any) {
      console.error("Validation error:", error);
      validationErrors.push(error.message || "Validation failed");
      setErrors(validationErrors);
      setCanExecute(false);
    } finally {
      setValidationComplete(true);
      setIsValidating(false);
    }
  }, [intent, address, chainId, publicClient, reset]);

  return {
    isValidating,
    validationComplete,
    resolvedRecipient,
    isENS,
    tokenBalance,
    nativeBalance,
    estimatedGas,
    estimatedGasCost,
    errors,
    warnings,
    canExecute,
    validate,
    reset,
  };
}
