// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MockAavePoolMinimal
 * @dev A minimal mock Aave V3 Pool for testing supply/withdraw functionality
 */
contract MockAavePoolMinimal is Ownable, ReentrancyGuard {
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
        uint16
    ) external payable nonReentrant {
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

    function getSupplyPosition(address user, address token) external view returns (
        uint256 amount,
        uint256 timestamp,
        address tokenAddr
    ) {
        SupplyPosition memory position = supplies[user][token];
        return (position.amount, position.timestamp, position.token);
    }

    function calculateInterest(address user, address token) external view returns (uint256) {
        SupplyPosition memory position = supplies[user][token];
        if (position.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - position.timestamp;
        uint256 annualInterest = (position.amount * INTEREST_RATE_BPS) / 10000;
        uint256 interest = (annualInterest * timeElapsed) / 365 days;

        return interest;
    }

    function addLiquidity(address token, uint256 amount) external onlyOwner {
        if (token != address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }

    receive() external payable {}
}
