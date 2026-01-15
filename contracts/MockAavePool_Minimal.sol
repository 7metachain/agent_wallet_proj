// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockAavePool - Minimal Version
 * @dev Simplified version for easy deployment
 */
contract MockAavePool {
    struct SupplyPosition {
        uint256 amount;
        uint256 timestamp;
        address token;
    }

    mapping(address => mapping(address => SupplyPosition)) public supplies;
    mapping(address => uint256) public totalSupplied;

    uint256 public constant INTEREST_RATE_BPS = 500;
    address public owner;

    event Supplied(address indexed user, address indexed token, uint256 amount, address indexed onBehalfOf);
    event Withdrawn(address indexed user, address indexed token, uint256 amount, address indexed to);

    constructor() {
        owner = msg.sender;
    }

    function supply(
        address token,
        uint256 amount,
        address onBehalfOf,
        uint16
    ) external payable {
        require(amount > 0, "Amount must be > 0");

        supplies[onBehalfOf][token].amount += amount;
        supplies[onBehalfOf][token].token = token;
        if (supplies[onBehalfOf][token].timestamp == 0) {
            supplies[onBehalfOf][token].timestamp = block.timestamp;
        }
        totalSupplied[token] += amount;

        emit Supplied(msg.sender, token, amount, onBehalfOf);
    }

    function withdraw(
        address token,
        uint256 amount,
        address to
    ) external {
        SupplyPosition storage position = supplies[msg.sender][token];

        uint256 withdrawAmount = amount;
        if (amount == type(uint256).max) {
            withdrawAmount = position.amount;
        }

        require(withdrawAmount > 0, "No supply found");
        require(position.amount >= withdrawAmount, "Insufficient supply balance");

        position.amount -= withdrawAmount;
        totalSupplied[token] -= withdrawAmount;

        emit Withdrawn(msg.sender, token, withdrawAmount, to);
    }

    function getUserSupplyBalance(address user, address token) external view returns (uint256) {
        return supplies[user][token].amount;
    }

    receive() external payable {}
}
