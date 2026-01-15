// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockSwapRouter
 * @dev A mock Uniswap V3 Router for testing swap functionality
 *      Simulates token swaps at a 1:1 ratio for testing
 */
contract MockSwapRouter is Ownable {
    // Track swap count for testing
    uint256 public swapCount;

    event Swapped(
        address indexed tokenIn,
        address indexed tokenOut,
        address indexed recipient,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Mock swap function - swaps at 1:1 ratio for testing
     *      In production, this would use actual DEX liquidity
     */
    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut) {
        // For native token (ETH/MON), check msg.value
        uint256 amountIn = params.amountIn;

        if (params.tokenIn == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            // Native token swap
            require(msg.value >= amountIn, "Insufficient native token sent");
            amountIn = msg.value;
        } else {
            // ERC20 token swap - transfer from user
            IERC20(params.tokenIn).transferFrom(msg.sender, address(this), amountIn);
        }

        // For testing, we'll do a 1:1 swap (minus 0.3% fee)
        // In production, this would query actual DEX prices
        amountOut = (amountIn * 997) / 1000; // 0.3% fee

        // Transfer output tokens to recipient
        if (params.tokenOut == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            // Native token output - use call to send ETH
            (bool success, ) = params.recipient.call{value: amountOut}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 token output
            // For mock testing, we'll send back the input token
            IERC20(params.tokenIn).transfer(params.recipient, amountOut);
        }

        swapCount++;

        emit Swapped(
            params.tokenIn,
            params.tokenOut,
            params.recipient,
            amountIn,
            amountOut
        );

        return amountOut;
    }

    /**
     * @dev Exact input single parameters
     */
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    /**
     * @dev Allow owner to add tokens for testing liquidity
     */
    function addLiquidity(address token, uint256 amount) external onlyOwner {
        if (token == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            // Native token - just add to contract
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }

    /**
     * @dev Get a mock price quote (1:1 for testing)
     */
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 fee,
        uint160 sqrtPriceLimitX96
    ) external pure returns (uint256 amountOut) {
        // Mock: 1:1 ratio minus fee
        amountOut = (amountIn * 997) / 1000;
    }

    receive() external payable {}
}
