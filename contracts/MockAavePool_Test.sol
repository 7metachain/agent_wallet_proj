// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockAavePoolTest {
    mapping(address => uint256) public balances;

    event Supplied(address indexed user, uint256 amount);

    // 简化版���只接收原生代币（ETH/MON）
    function supply() external payable {
        require(msg.value > 0, "Must send ETH/MON");
        balances[msg.sender] += msg.value;
        emit Supplied(msg.sender, msg.value);
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
    }
}
