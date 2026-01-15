# 🎭 部署 Mock 合约 - 简化方案

## 🚀 使用 Remix IDE 部署（推荐）

由于 Hardhat 3.x ESM 兼容性问题，使用 Remix IDE 部署更简单快捷。

### 步骤 1：打开 Remix

访问：https://remix.ethereum.org/

### 步骤 2：创建合约文件

在 Remix 中创建以下 4 ��文件：

#### 1. `MockMonad.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockMonad is ERC20 {
    event FaucetWithdrawn(address indexed recipient, uint256 amount);

    constructor() ERC20("Mock Monad", "MON") {
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    function faucet() public {
        uint256 amount = 100 * 10**18;
        _mint(msg.sender, amount);
        emit FaucetWithdrawn(msg.sender, amount);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
```

#### 2. `MockSwapRouter.sol`
```solidity
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
```

#### 3. `MockAavePool.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MockAavePool is Ownable, ReentrancyGuard {
    struct SupplyPosition {
        uint256 amount;
        uint256 timestamp;
        address token;
    }

    mapping(address => mapping(address => SupplyPosition)) public supplies;
    mapping(address => uint256) public totalSupplied;

    uint256 public constant INTEREST_RATE_BPS = 500;

    event Supplied(address indexed user, address indexed token, uint256 amount, address indexed onBehalfOf);
    event Withdrawn(address indexed user, address indexed token, uint256 amount, address indexed to);

    constructor() Ownable(msg.sender) {}

    function supply(
        address token,
        uint256 amount,
        address onBehalfOf,
        uint16 /* referralCode */
    ) external payable nonReentrant {
        // referralCode parameter is kept for Aave V3 compatibility but unused
        require(amount > 0, "Amount must be > 0");

        uint256 actualAmount = amount;
        if (token == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            require(msg.value >= amount, "Insufficient native token sent");
            actualAmount = msg.value;
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }

        supplies[onBehalfOf][token].amount += actualAmount;
        supplies[onBehalfOf][token].token = token;
        if (supplies[onBehalfOf][token].timestamp == 0) {
            supplies[onBehalfOf][token].timestamp = block.timestamp;
        }

        totalSupplied[token] += actualAmount;
        emit Supplied(msg.sender, token, actualAmount, onBehalfOf);
    }

    function withdraw(
        address token,
        uint256 amount,
        address to
    ) external nonReentrant {
        SupplyPosition storage position = supplies[msg.sender][token];

        uint256 withdrawAmount = amount;
        if (amount == type(uint256).max) {
            withdrawAmount = position.amount;
        }

        require(withdrawAmount > 0, "No supply found");
        require(position.amount >= withdrawAmount, "Insufficient supply balance");

        position.amount -= withdrawAmount;
        totalSupplied[token] -= withdrawAmount;

        if (token == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            // Native token output - use call to send ETH
            (bool success, ) = to.call{value: withdrawAmount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).transfer(to, withdrawAmount);
        }

        emit Withdrawn(msg.sender, token, withdrawAmount, to);
    }

    function getUserSupplyBalance(address user, address token) external view returns (uint256) {
        return supplies[user][token].amount;
    }

    function addLiquidity(address token, uint256 amount) external onlyOwner {
        if (token != address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }

    receive() external payable {}
}
```

#### 4. `YieldForwardingStakingPool.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract YieldForwardingStakingPool is Ownable, ReentrancyGuard {
    IERC20 public stakingToken;

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        address yieldRecipient;
        uint256 totalYieldSent;
    }

    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    uint256 public constant YIELD_RATE_BPS = 100;

    event Staked(address indexed user, uint256 amount, address yieldRecipient);
    event Unstaked(address indexed user, uint256 amount);

    constructor(address _stakingToken) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid token address");
        stakingToken = IERC20(_stakingToken);
    }

    function stake(uint256 amount, address yieldRecipient) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(yieldRecipient != address(0), "Invalid recipient");

        stakingToken.transferFrom(msg.sender, address(this), amount);

        stakes[msg.sender].amount += amount;
        if (stakes[msg.sender].timestamp == 0) {
            stakes[msg.sender].timestamp = block.timestamp;
        }
        stakes[msg.sender].yieldRecipient = yieldRecipient;

        totalStaked += amount;
        emit Staked(msg.sender, amount, yieldRecipient);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");

        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;

        stakingToken.transfer(msg.sender, amount);
    }

    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 timestamp,
        address yieldRecipient,
        uint256 totalYieldSent
    ) {
        Stake memory s = stakes[user];
        return (s.amount, s.timestamp, s.yieldRecipient, s.totalYieldSent);
    }
}
```

### 步骤 3：编译合约

在 Remix 中：
1. 点击左侧 "Compile" 图标
2. 点击 "Compile MockMonad.sol"
3. 对所有 4 个合约重复此操作

### 步骤 4：连接钱包到 Monad Testnet

1. 点击左侧 "Deploy & Run Transactions" 图标
2. 在 "Environment" 下拉菜单中选择 "Injected Provider - MetaMask"
3. 确保 MetaMask 已连接到 Monad Testnet (Chain ID: 10143)

### 步骤 5：部署合约

#### 部署 MockMonad
1. 选择 "MockMonad" 合约
2. 点击 "Deploy"
3. 复制部署地址（例如：`0x1234...`）

#### 部署 MockSwapRouter
1. 选择 "MockSwapRouter" 合约
2. 点击 "Deploy"
3. 复制地址

#### 部署 MockAavePool
1. 选择 "MockAavePool" 合约
2. 点击 "Deploy"
3. 复制地址

#### 部署 YieldForwardingStakingPool
1. 选择 "YieldForwardingStakingPool" 合约
2. 在构造函数参数中输入 MockMonad 的地址：`0x1234...`（替换为实际部署的 MockMonad 地址）
3. 点击 "Deploy"
4. 复制地址

### 步骤 6：配置应用

将部署的合约地址添加到 `.env.local`：

```bash
NEXT_PUBLIC_MONAD_TOKEN=0x...        # MockMonad 地址
NEXT_PUBLIC_STAKING_POOL=0x...        # YieldForwardingStakingPool 地址
NEXT_PUBLIC_MOCK_AAVE_POOL=0x...      # MockAavePool 地址
NEXT_PUBLIC_MOCK_SWAP_ROUTER=0x...    # MockSwapRouter 地址
```

### 步骤 7：重启并测试

```bash
npm run dev
```

在应用中测试所有功能！

---

## 🎯 优势

使用 Remix 部署：
- ✅ 无需配置 Hardhat
- ✅ 无需处理 ESM/CJS 兼容性问题
- ✅ 图形化界面，操作简单
- ✅ 自动编译，即时反馈
- ✅ 可以在浏览器中直接验证

---

## 📝 部署后测试

1. **获取测试币**：在 Remix 中调用 MockMonad 的 `faucet()` 函数
2. **查询余额**：在应用中输入 "Check balance"
3. **测试所有功能**：Swap, Supply, Withdraw, Stake, Transfer

---

**现在就开始部署吧！** 🚀
