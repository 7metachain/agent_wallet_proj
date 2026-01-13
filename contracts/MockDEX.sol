// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockDEX
 * @notice 模拟 DEX 合约，用于 Hackathon 演示 Swap 功能
 * @dev 使用固定汇率，不需要真实流动性
 * @custom:deployed 0xd9145CCE52D386f254917e481eB44e9943F39138 (Monad Testnet)
 */
contract MockDEX {
    address public owner;
    
    // 原生代币标识
    address public constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    
    // 模拟汇率: tokenA => tokenB => rate (1 tokenA = rate tokenB, 精度 1e18)
    mapping(address => mapping(address => uint256)) public rates;
    
    event Swap(
        address indexed user,
        address indexed fromToken,
        address indexed toToken,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event RateUpdated(address fromToken, address toToken, uint256 rate);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    /**
     * @notice 设置代币汇率
     */
    function setRate(address fromToken, address toToken, uint256 rate) external onlyOwner {
        rates[fromToken][toToken] = rate;
        emit RateUpdated(fromToken, toToken, rate);
    }
    
    /**
     * @notice 用原生代币 (MON) 换 ERC20
     */
    function swapNativeForToken(
        address toToken,
        uint256 minAmountOut,
        address recipient
    ) external payable returns (uint256 amountOut) {
        require(msg.value > 0, "Must send MON");
        
        uint256 rate = rates[NATIVE_TOKEN][toToken];
        if (rate == 0) {
            rate = 100e18; // 默认: 1 MON = 100 单位
        }
        
        amountOut = (msg.value * rate) / 1e18;
        require(amountOut >= minAmountOut, "Slippage too high");
        
        emit Swap(msg.sender, NATIVE_TOKEN, toToken, msg.value, amountOut);
        return amountOut;
    }
    
    /**
     * @notice 用 ERC20 换原生代币 (MON)
     */
    function swapTokenForNative(
        address fromToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be > 0");
        
        uint256 rate = rates[fromToken][NATIVE_TOKEN];
        if (rate == 0) {
            rate = 1e16; // 默认: 100 单位 = 1 MON
        }
        
        amountOut = (amountIn * rate) / 1e18;
        require(amountOut >= minAmountOut, "Slippage too high");
        require(address(this).balance >= amountOut, "Insufficient liquidity");
        
        payable(recipient).transfer(amountOut);
        
        emit Swap(msg.sender, fromToken, NATIVE_TOKEN, amountIn, amountOut);
        return amountOut;
    }
    
    /**
     * @notice ERC20 换 ERC20
     */
    function swapTokenForToken(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be > 0");
        
        uint256 rate = rates[fromToken][toToken];
        if (rate == 0) {
            rate = 1e18; // 默认 1:1
        }
        
        amountOut = (amountIn * rate) / 1e18;
        require(amountOut >= minAmountOut, "Slippage too high");
        
        emit Swap(msg.sender, fromToken, toToken, amountIn, amountOut);
        return amountOut;
    }
    
    /**
     * @notice 通用 swap 接口
     */
    function swap(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external payable returns (uint256 amountOut) {
        if (fromToken == NATIVE_TOKEN) {
            return this.swapNativeForToken{value: msg.value}(toToken, minAmountOut, recipient);
        } else if (toToken == NATIVE_TOKEN) {
            return this.swapTokenForNative(fromToken, amountIn, minAmountOut, recipient);
        } else {
            return this.swapTokenForToken(fromToken, toToken, amountIn, minAmountOut, recipient);
        }
    }
    
    /**
     * @notice 获取预估输出数量
     */
    function getAmountOut(
        address fromToken,
        address toToken,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        uint256 rate = rates[fromToken][toToken];
        if (rate == 0) {
            if (fromToken == NATIVE_TOKEN) {
                rate = 100e18;
            } else if (toToken == NATIVE_TOKEN) {
                rate = 1e16;
            } else {
                rate = 1e18;
            }
        }
        return (amountIn * rate) / 1e18;
    }
    
    /**
     * @notice 添加流动性
     */
    function addLiquidity() external payable {
        require(msg.value > 0, "Must send MON");
    }
    
    receive() external payable {}
}
