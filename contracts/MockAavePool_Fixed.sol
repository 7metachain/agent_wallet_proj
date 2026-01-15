// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Minimal ERC20 interface for token transfers
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

/**
 * @title MockAavePool
 * @dev A mock Aave V3 Pool for testing supply/withdraw functionality
 *      Simulates lending/borrowing without real yield
 *      Optimized for Remix deployment
 */
contract MockAavePool {
    struct SupplyPosition {
        uint256 amount;           // Amount of tokens supplied
        uint256 timestamp;        // When the supply was made
        address token;            // Token address
    }

    // Mapping of user => token => position
    mapping(address => mapping(address => SupplyPosition)) public supplies;

    // Total supplied per token
    mapping(address => uint256) public totalSupplied;

    // Mock interest rate: 5% APY (for display purposes)
    uint256 public constant INTEREST_RATE_BPS = 500; // 5% in basis points

    // Owner
    address public owner;

    event Supplied(
        address indexed user,
        address indexed token,
        uint256 amount,
        address indexed onBehalfOf
    );

    event Withdrawn(
        address indexed user,
        address indexed token,
        uint256 amount,
        address indexed to
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // Reentrancy guard state
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        owner = msg.sender;
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Supply tokens to the mock lending pool
     * @param token The token to supply (use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for ETH/MON)
     * @param amount The amount to supply
     * @param onBehalfOf The address receiving the supply position
     */
    function supply(
        address token,
        uint256 amount,
        address onBehalfOf,
        uint16 /* referralCode - unused but kept for Aave V3 compatibility */
    ) external payable nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(onBehalfOf != address(0), "Invalid onBehalfOf address");

        // Handle native token (ETH/MON)
        uint256 actualAmount = amount;
        if (token == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            require(msg.value >= amount, "Insufficient native token sent");
            actualAmount = msg.value;
        } else {
            // Handle ERC20 token - simplified interface
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }

        // Update supply position
        supplies[onBehalfOf][token].amount += actualAmount;
        supplies[onBehalfOf][token].token = token;
        if (supplies[onBehalfOf][token].timestamp == 0) {
            supplies[onBehalfOf][token].timestamp = block.timestamp;
        }

        // Update total supplied
        totalSupplied[token] += actualAmount;

        emit Supplied(msg.sender, token, actualAmount, onBehalfOf);
    }

    /**
     * @dev Withdraw tokens from the lending pool
     * @param token The token to withdraw
     * @param amount The amount to withdraw (use maxUint256 for all)
     * @param to The address to receive the tokens
     */
    function withdraw(
        address token,
        uint256 amount,
        address to
    ) external nonReentrant {
        SupplyPosition storage position = supplies[msg.sender][token];

        uint256 withdrawAmount = amount;
        if (amount == type(uint256).max) {
            // Withdraw all
            withdrawAmount = position.amount;
        }

        require(withdrawAmount > 0, "No supply found");
        require(position.amount >= withdrawAmount, "Insufficient supply balance");
        require(to != address(0), "Invalid recipient address");

        // Update position
        position.amount -= withdrawAmount;
        totalSupplied[token] -= withdrawAmount;

        // Transfer tokens
        if (token == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            // Native token - use call to send ETH
            (bool success, ) = to.call{value: withdrawAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 token
            IERC20(token).transfer(to, withdrawAmount);
        }

        emit Withdrawn(msg.sender, token, withdrawAmount, to);
    }

    /**
     * @dev Get user's supply balance for a token
     * @param user The user address
     * @param token The token address
     */
    function getUserSupplyBalance(
        address user,
        address token
    ) external view returns (uint256) {
        return supplies[user][token].amount;
    }

    /**
     * @dev Get full supply position info
     * @param user The user address
     * @param token The token address
     */
    function getSupplyPosition(
        address user,
        address token
    ) external view returns (
        uint256 amount,
        uint256 timestamp,
        address tokenAddr
    ) {
        SupplyPosition memory position = supplies[user][token];
        return (
            position.amount,
            position.timestamp,
            position.token
        );
    }

    /**
     * @dev Calculate mock interest earned (for display)
     * @param user The user address
     * @param token The token address
     */
    function calculateInterest(
        address user,
        address token
    ) external view returns (uint256) {
        SupplyPosition memory position = supplies[user][token];
        if (position.amount == 0) return 0;

        // Simple interest calculation: amount * rate * time / 365 days
        uint256 timeElapsed = block.timestamp - position.timestamp;
        uint256 annualInterest = (position.amount * INTEREST_RATE_BPS) / 10000;
        uint256 interest = (annualInterest * timeElapsed) / 365 days;

        return interest;
    }

    /**
     * @dev Allow owner to add tokens for liquidity (testing)
     */
    function addLiquidity(address token, uint256 amount) external onlyOwner {
        if (token == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            // Native token - just add to contract
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    receive() external payable {}

    fallback() external payable {}
}
