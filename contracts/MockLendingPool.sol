// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockLendingPool
 * @notice 模拟借贷池合约，用于 Hackathon 演示 Intent Bot 的 supply/withdraw 功能
 * @dev 兼容 Curvance/Aave 的接口设计，部署后可直接与 Intent Bot 集成
 */
contract MockLendingPool {
    // ============================================
    // 状态变量
    // ============================================
    
    // 用户存款余额: user => token => balance
    mapping(address => mapping(address => uint256)) public deposits;
    
    // 总存款量: token => totalDeposits
    mapping(address => uint256) public totalDeposits;
    
    // 合约拥有者
    address public owner;
    
    // 原生代币地址标识 (与 Curvance/Aave 保持一致)
    address public constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    
    // ============================================
    // 事件
    // ============================================
    
    event Supply(
        address indexed user, 
        address indexed asset, 
        uint256 amount,
        address indexed onBehalfOf
    );
    
    event Withdraw(
        address indexed user, 
        address indexed asset, 
        uint256 amount, 
        address indexed to
    );
    
    // ============================================
    // 构造函数
    // ============================================
    
    constructor() {
        owner = msg.sender;
    }
    
    // ============================================
    // 核心功能
    // ============================================
    
    /**
     * @notice 存入资产 (兼容 Aave V3 接口)
     * @param asset 资产地址 (原生代币使用 NATIVE_TOKEN)
     * @param amount 存款金额 (原生代币忽略此参数，使用 msg.value)
     * @param onBehalfOf 存款受益人
     * @param referralCode 推荐码 (Mock 中忽略)
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external payable {
        uint256 depositAmount;
        
        if (asset == NATIVE_TOKEN || asset == address(0)) {
            // 原生代币 (MON) 存款
            require(msg.value > 0, "MockPool: Must send native token");
            depositAmount = msg.value;
            asset = NATIVE_TOKEN; // 标准化地址
        } else {
            // ERC20 代币存款
            require(amount > 0, "MockPool: Amount must be > 0");
            require(msg.value == 0, "MockPool: No ETH for ERC20 deposit");
            depositAmount = amount;
            
            // 转移代币到合约 (需要用户先 approve)
            (bool success, bytes memory data) = asset.call(
                abi.encodeWithSignature(
                    "transferFrom(address,address,uint256)",
                    msg.sender,
                    address(this),
                    amount
                )
            );
            require(
                success && (data.length == 0 || abi.decode(data, (bool))), 
                "MockPool: Transfer failed"
            );
        }
        
        // 记录存款
        deposits[onBehalfOf][asset] += depositAmount;
        totalDeposits[asset] += depositAmount;
        
        emit Supply(msg.sender, asset, depositAmount, onBehalfOf);
    }
    
    /**
     * @notice 存入原生代币的简化方法
     * @dev 直接发送 MON 到此函数即可存款
     */
    function depositNative(address onBehalfOf) external payable {
        require(msg.value > 0, "MockPool: Must send native token");
        
        deposits[onBehalfOf][NATIVE_TOKEN] += msg.value;
        totalDeposits[NATIVE_TOKEN] += msg.value;
        
        emit Supply(msg.sender, NATIVE_TOKEN, msg.value, onBehalfOf);
    }
    
    /**
     * @notice 提取资产 (兼容 Aave V3 接口)
     * @param asset 资产地址
     * @param amount 提取金额 (type(uint256).max 表示全部)
     * @param to 接收地址
     * @return 实际提取金额
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256) {
        if (asset == address(0)) {
            asset = NATIVE_TOKEN;
        }
        
        uint256 userBalance = deposits[msg.sender][asset];
        require(userBalance > 0, "MockPool: No deposits");
        
        // 计算实际提取金额
        uint256 withdrawAmount;
        if (amount == type(uint256).max) {
            withdrawAmount = userBalance;
        } else {
            require(amount <= userBalance, "MockPool: Insufficient balance");
            withdrawAmount = amount;
        }
        
        // 更新状态
        deposits[msg.sender][asset] -= withdrawAmount;
        totalDeposits[asset] -= withdrawAmount;
        
        // 转移资产
        if (asset == NATIVE_TOKEN) {
            (bool success, ) = to.call{value: withdrawAmount}("");
            require(success, "MockPool: Native transfer failed");
        } else {
            (bool success, bytes memory data) = asset.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    to,
                    withdrawAmount
                )
            );
            require(
                success && (data.length == 0 || abi.decode(data, (bool))), 
                "MockPool: Transfer failed"
            );
        }
        
        emit Withdraw(msg.sender, asset, withdrawAmount, to);
        
        return withdrawAmount;
    }
    
    /**
     * @notice 提取原生代币的简化方法
     */
    function withdrawNative(uint256 amount, address to) external returns (uint256) {
        return this.withdraw(NATIVE_TOKEN, amount, to);
    }
    
    // ============================================
    // 查询功能
    // ============================================
    
    /**
     * @notice 获取用户存款余额
     */
    function getUserDeposit(address user, address asset) external view returns (uint256) {
        if (asset == address(0)) {
            asset = NATIVE_TOKEN;
        }
        return deposits[user][asset];
    }
    
    /**
     * @notice 获取用户账户数据 (模拟 Aave 接口)
     */
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        uint256 nativeDeposit = deposits[user][NATIVE_TOKEN];
        
        return (
            nativeDeposit,      // totalCollateralBase
            0,                   // totalDebtBase (Mock 不支持借款)
            nativeDeposit / 2,  // availableBorrowsBase (50%)
            8000,               // 80% 清算阈值
            7500,               // 75% LTV
            type(uint256).max   // 健康因子 (无债务时为最大)
        );
    }
    
    /**
     * @notice 获取池子信息
     */
    function getPoolInfo(address asset) external view returns (
        uint256 totalSupply,
        uint256 availableLiquidity
    ) {
        if (asset == address(0)) {
            asset = NATIVE_TOKEN;
        }
        uint256 total = totalDeposits[asset];
        return (total, total);
    }
    
    // ============================================
    // 管理功能
    // ============================================
    
    /**
     * @notice 紧急提取 (仅 owner)
     */
    function emergencyWithdraw(address asset, uint256 amount) external {
        require(msg.sender == owner, "MockPool: Not owner");
        
        if (asset == NATIVE_TOKEN || asset == address(0)) {
            (bool success, ) = owner.call{value: amount}("");
            require(success, "MockPool: Transfer failed");
        } else {
            (bool success, ) = asset.call(
                abi.encodeWithSignature("transfer(address,uint256)", owner, amount)
            );
            require(success, "MockPool: Transfer failed");
        }
    }
    
    // 允许合约接收原生代币
    receive() external payable {
        // 直接接收的 MON 存入发送者账户
        deposits[msg.sender][NATIVE_TOKEN] += msg.value;
        totalDeposits[NATIVE_TOKEN] += msg.value;
        emit Supply(msg.sender, NATIVE_TOKEN, msg.value, msg.sender);
    }
}
