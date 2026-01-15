// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockMonad
 * @dev A mock MONAD token for testing purposes
 *      Includes a faucet function for easy testing
 */
contract MockMonad is ERC20 {
    // Event for faucet withdrawals
    event FaucetWithdrawn(address indexed recipient, uint256 amount);

    constructor() ERC20("Mock Monad", "MONAD") {
        // Mint 1,000,000 MONAD to the deployer
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /**
     * @dev Faucet function - anyone can call to get 100 MONAD
     *      This is for testing purposes only
     */
    function faucet() public {
        uint256 amount = 100 * 10**18; // 100 MONAD
        _mint(msg.sender, amount);
        emit FaucetWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Mint tokens (for testing purposes)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
