// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        // Mint 1,000,000 tokens to deployer for testing
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // Helper: mint more tokens for testing
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
