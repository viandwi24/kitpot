// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDe — Testnet-only ERC20 mimicking Ethena USDe (6 decimals, anyone can mint).
/// @dev Real USDe uses 18 decimals, but this mock uses 6 to share decimal math with MockUSDC
/// across the Kitpot frontend. This is intentional for a hackathon testnet deployment.
contract MockUSDe is ERC20 {
    constructor() ERC20("Mock USDe", "USDe") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Anyone can mint on testnet.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
