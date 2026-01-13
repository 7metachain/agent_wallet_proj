// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title MockDEXV2
 * @notice 支持真实代币交换的 Mock DEX
 * @dev 需要先给合约添加代币流动性
 */
contract MockDEXV2 {
    address public owner;
    
    // 原生代币标识
    address public constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    
    // 模拟汇率: fromToken => toToken => rate (精度 1e18)
    // rate = 100e18 表示 1 fromToken = 100 toToken
    mapping(address => mapping(address => uint256)) public rates;
    
    event Swap(
        address indexed user,
        address indexed fromToken,
        address indexed toToken,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event LiquidityAdded(address indexed token, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    /**
     * @notice 设置代币汇率
     * @param fromToken 源代币
     * @param toToken 目标代币
     * @param rate 汇率 (1e18 = 1:1)
     */
    function setRate(address fromToken, address toToken, uint256 rate) external onlyOwner {
        rates[fromToken][toToken] = rate;
    }
    
    /**
     * @notice 用 MON 换 ERC20
     */
    function swapNativeForToken(
        address toToken,
        uint256 minAmountOut,
        address recipient
    ) external payable returns (uint256 amountOut) {
        require(msg.value > 0, "Must send MON");
        
        // 计算输出数量
        uint256 rate = rates[NATIVE_TOKEN][toToken];
        if (rate == 0) {
            rate = 100e18; // 默认 1 MON = 100 USDC
        }
        
        // 根据 USDC 的 6 位小数调整
        // msg.value 是 18 位小数，USDC 是 6 位
        // amountOut = msg.value * rate / 1e18 * 1e6 / 1e18
        // 简化: amountOut = msg.value * rate / 1e30
        amountOut = (msg.value * rate) / 1e30;
        
        require(amountOut >= minAmountOut, "Slippage too high");
        
        // 检查合约有足够的代币
        require(IERC20(toToken).balanceOf(address(this)) >= amountOut, "Insufficient liquidity");
        
        // 转出代币给用户
        require(IERC20(toToken).transfer(recipient, amountOut), "Transfer failed");
        
        emit Swap(msg.sender, NATIVE_TOKEN, toToken, msg.value, amountOut);
        return amountOut;
    }
    
    /**
     * @notice 用 ERC20 换 MON
     */
    function swapTokenForNative(
        address fromToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be > 0");
        
        // 计算输出数量
        uint256 rate = rates[fromToken][NATIVE_TOKEN];
        if (rate == 0) {
            rate = 1e16; // 默认 100 USDC = 1 MON (0.01 * 1e18)
        }
        
        // fromToken (USDC) 是 6 位小数，MON 是 18 位
        // amountOut = amountIn * rate / 1e18 * 1e18 / 1e6
        // 简化: amountOut = amountIn * rate / 1e6
        amountOut = (amountIn * rate) / 1e6;
        
        require(amountOut >= minAmountOut, "Slippage too high");
        require(address(this).balance >= amountOut, "Insufficient MON liquidity");
        
        // 转入用户的代币
        require(IERC20(fromToken).transferFrom(msg.sender, address(this), amountIn), "TransferFrom failed");
        
        // 转出 MON 给用户
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
        require(IERC20(toToken).balanceOf(address(this)) >= amountOut, "Insufficient liquidity");
        
        // 转入用户代币
        require(IERC20(fromToken).transferFrom(msg.sender, address(this), amountIn), "TransferFrom failed");
        
        // 转出目标代币
        require(IERC20(toToken).transfer(recipient, amountOut), "Transfer failed");
        
        emit Swap(msg.sender, fromToken, toToken, amountIn, amountOut);
        return amountOut;
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
        
        if (fromToken == NATIVE_TOKEN) {
            // MON -> USDC
            if (rate == 0) rate = 100e18;
            return (amountIn * rate) / 1e30;
        } else if (toToken == NATIVE_TOKEN) {
            // USDC -> MON
            if (rate == 0) rate = 1e16;
            return (amountIn * rate) / 1e6;
        } else {
            // ERC20 -> ERC20
            if (rate == 0) rate = 1e18;
            return (amountIn * rate) / 1e18;
        }
    }
    
    /**
     * @notice 添加 MON 流动性
     */
    function addLiquidity() external payable {
        require(msg.value > 0, "Must send MON");
        emit LiquidityAdded(NATIVE_TOKEN, msg.value);
    }
    
    /**
     * @notice 查询合约代币余额
     */
    function getTokenBalance(address token) external view returns (uint256) {
        if (token == NATIVE_TOKEN) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @notice 紧急提取 (仅 owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == NATIVE_TOKEN) {
            payable(owner).transfer(amount);
        } else {
            IERC20(token).transfer(owner, amount);
        }
    }
    
    receive() external payable {
        emit LiquidityAdded(NATIVE_TOKEN, msg.value);
    }
}
