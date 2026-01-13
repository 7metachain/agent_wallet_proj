import { Address, PublicClient, isAddress, parseUnits, formatUnits, encodeFunctionData } from "viem";
import { getTokenBySymbol } from "./tokens";
import { erc20Abi } from "./abi/erc20";

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Gas validation result interface
 */
export interface GasValidationResult {
  sufficient: boolean;
  required: string;
  available: string;
}

/**
 * Validates if a string is a valid Ethereum address
 */
export function validateAddress(address: string): ValidationResult {
  if (!address || address.trim() === "") {
    return { valid: false, error: "Address cannot be empty" };
  }

  if (!isAddress(address)) {
    return { valid: false, error: "Invalid address format" };
  }

  return { valid: true };
}

/**
 * Checks if a string is an ENS name (ends with .eth)
 */
export function isENSName(input: string): boolean {
  if (!input) return false;
  return input.toLowerCase().endsWith(".eth");
}

/**
 * Resolves an ENS name to an address
 * Returns null if resolution fails or ENS is not supported
 */
export async function resolveENSName(
  name: string,
  publicClient: PublicClient
): Promise<Address | null> {
  try {
    // Check if the client supports ENS resolution
    if (!publicClient.getEnsAddress) {
      console.warn("ENS resolution not supported on this chain");
      return null;
    }

    const address = await publicClient.getEnsAddress({ name });
    return address;
  } catch (error) {
    console.error("ENS resolution error:", error);
    return null;
  }
}

/**
 * Validates if user has sufficient balance for transfer
 */
export function validateBalance(params: {
  token: string;
  amount: string;
  userBalance: bigint;
  decimals: number;
}): ValidationResult {
  const { token, amount, userBalance, decimals } = params;

  try {
    const amountToTransfer = parseUnits(amount, decimals);

    if (amountToTransfer <= BigInt(0)) {
      return { valid: false, error: "Transfer amount must be greater than 0" };
    }

    if (amountToTransfer > userBalance) {
      const available = formatUnits(userBalance, decimals);
      return {
        valid: false,
        error: `Insufficient ${token} balance. Available: ${available} ${token}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid amount format" };
  }
}

/**
 * Estimates gas for a transfer transaction
 * Returns gas estimate in wei, or a default estimate if estimation fails
 */
export async function estimateTransferGas(params: {
  from: Address;
  to: Address;
  token: string;
  amount: string;
  chainId: number;
  publicClient: PublicClient;
}): Promise<bigint> {
  const { from, to, token, amount, chainId, publicClient } = params;

  try {
    const tokenInfo = getTokenBySymbol(chainId, token);
    if (!tokenInfo) {
      throw new Error(`Token ${token} not found`);
    }

    const amountToTransfer = parseUnits(amount, tokenInfo.decimals);

    // Native token transfer (MON/ETH)
    if (token.toUpperCase() === "MON" || token.toUpperCase() === "ETH") {
      const gasEstimate = await publicClient.estimateGas({
        account: from,
        to: to,
        value: amountToTransfer,
      });

      // Add 20% buffer for safety
      return (gasEstimate * BigInt(120)) / BigInt(100);
    }

    // ERC20 token transfer
    const transferData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, amountToTransfer],
    });

    const gasEstimate = await publicClient.estimateGas({
      account: from,
      to: tokenInfo.address as Address,
      data: transferData,
    });

    // Add 20% buffer for safety
    return (gasEstimate * BigInt(120)) / BigInt(100);
  } catch (error) {
    console.error("Gas estimation error:", error);

    // Return default estimates if estimation fails
    if (token.toUpperCase() === "MON" || token.toUpperCase() === "ETH") {
      return BigInt(21000); // Standard native transfer
    }
    return BigInt(65000); // Standard ERC20 transfer
  }
}

/**
 * Validates if user has sufficient native token balance for gas
 */
export function validateGasBalance(params: {
  estimatedGas: bigint;
  gasPrice: bigint;
  nativeBalance: bigint;
}): GasValidationResult {
  const { estimatedGas, gasPrice, nativeBalance } = params;

  const requiredGas = estimatedGas * gasPrice;
  const sufficient = nativeBalance >= requiredGas;

  return {
    sufficient,
    required: formatUnits(requiredGas, 18),
    available: formatUnits(nativeBalance, 18),
  };
}

/**
 * Formats gas cost for display
 */
export function formatGasCost(
  estimatedGas: bigint,
  gasPrice: bigint,
  decimals: number = 18
): string {
  const totalCost = estimatedGas * gasPrice;
  const formatted = formatUnits(totalCost, decimals);

  // Format to reasonable precision
  const num = parseFloat(formatted);
  if (num < 0.0001) {
    return "< 0.0001";
  }
  if (num < 1) {
    return num.toFixed(4);
  }
  return num.toFixed(4);
}

/**
 * Checks if an address is a contract (has bytecode)
 */
export async function isContractAddress(
  address: Address,
  publicClient: PublicClient
): Promise<boolean> {
  try {
    const bytecode = await publicClient.getBytecode({ address });
    return bytecode !== undefined && bytecode !== "0x";
  } catch (error) {
    console.error("Contract check error:", error);
    return false;
  }
}

/**
 * Generates warnings for potentially risky transfers
 */
export function generateTransferWarnings(params: {
  amount: string;
  tokenBalance: bigint;
  decimals: number;
  isContract: boolean;
  gasCost: string;
  token: string;
}): string[] {
  const warnings: string[] = [];
  const { amount, tokenBalance, decimals, isContract, gasCost, token } = params;

  try {
    const amountToTransfer = parseUnits(amount, decimals);
    const balancePercentage = (Number(amountToTransfer) / Number(tokenBalance)) * 100;

    // Warn if transferring more than 50% of balance
    if (balancePercentage > 50) {
      warnings.push(
        `You're transferring ${balancePercentage.toFixed(0)}% of your balance`
      );
    }

    // Warn if recipient is a contract
    if (isContract) {
      warnings.push("Recipient is a contract address");
    }

    // Warn if gas cost is high relative to transfer - ONLY for native token transfers
    // Don't compare gas cost (in MON) to ERC20 token amounts (different value)
    const isNativeToken = token.toUpperCase() === "MON" || token.toUpperCase() === "ETH";
    if (isNativeToken) {
      const gasCostNum = parseFloat(gasCost);
      const transferAmountNum = parseFloat(formatUnits(amountToTransfer, decimals));
      if (gasCostNum > 0 && transferAmountNum > 0 && gasCostNum / transferAmountNum > 0.1) {
        warnings.push("Gas cost is more than 10% of transfer amount");
      }
    }
  } catch (error) {
    console.error("Warning generation error:", error);
  }

  return warnings;
}
