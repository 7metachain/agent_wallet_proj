// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldForwardingStakingPool
 * @dev A staking pool that allows users to stake tokens and send yield to a different address
 *      This is perfect for the use case: "Stake MONAD, send yield to friend's wallet"
 */
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

    // Yield rate: 1% per yield collection (for testing)
    uint256 public constant YIELD_RATE_BPS = 100; // 1% in basis points

    event Staked(address indexed user, uint256 amount, address yieldRecipient);
    event YieldTransferred(address indexed from, address indexed to, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event YieldRateUpdated(uint256 newRate);

    constructor(address _stakingToken) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid token address");
        stakingToken = IERC20(_stakingToken);
    }

    /**
     * @dev Stake tokens and specify a yield recipient
     * @param amount Amount of tokens to stake
     * @param yieldRecipient Address that will receive the yield payments
     */
    function stake(uint256 amount, address yieldRecipient) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(yieldRecipient != address(0), "Invalid recipient");

        // Transfer tokens from user to pool
        require(
            stakingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Update stake info
        stakes[msg.sender].amount += amount;
        if (stakes[msg.sender].timestamp == 0) {
            stakes[msg.sender].timestamp = block.timestamp;
        }
        stakes[msg.sender].yieldRecipient = yieldRecipient;

        totalStaked += amount;

        emit Staked(msg.sender, amount, yieldRecipient);
    }

    /**
     * @dev Collect and send yield to the designated recipient
     * @param staker Address of the staker
     */
    function collectYield(address staker) external nonReentrant {
        Stake memory s = stakes[staker];
        require(s.amount > 0, "No stake found");

        // Calculate yield (simplified for testing: 1% of staked amount)
        uint256 yieldAmount = (s.amount * YIELD_RATE_BPS) / 10000;

        if (yieldAmount == 0) {
            return; // No yield to send
        }

        // For testing, we'll mint yield if the contract doesn't have enough
        // In production, this would come from actual staking rewards
        uint256 balance = stakingToken.balanceOf(address(this));
        if (balance < yieldAmount) {
            // For mock testing, we'll send what we have
            yieldAmount = balance;
        }

        if (yieldAmount > 0) {
            require(
                stakingToken.transfer(s.yieldRecipient, yieldAmount),
                "Yield transfer failed"
            );

            stakes[staker].totalYieldSent += yieldAmount;

            emit YieldTransferred(staker, s.yieldRecipient, yieldAmount);
        }
    }

    /**
     * @dev Unstake tokens
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");

        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;

        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Get stake information
     * @param user Address of the staker
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 timestamp,
        address yieldRecipient,
        uint256 totalYieldSent
    ) {
        Stake memory s = stakes[user];
        return (
            s.amount,
            s.timestamp,
            s.yieldRecipient,
            s.totalYieldSent
        );
    }

    /**
     * @dev Allow owner to add rewards to the pool (for testing)
     * @param amount Amount of tokens to add as rewards
     */
    function addRewards(uint256 amount) external onlyOwner {
        require(
            stakingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
    }

    /**
     * @dev Emergency withdraw by owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = stakingToken.balanceOf(address(this));
        require(stakingToken.transfer(owner(), balance), "Transfer failed");
    }
}
