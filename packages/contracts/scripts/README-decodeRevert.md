decodeRevert.js
================

Purpose
-------
Small helper to decode Ethereum RPC revert payloads and map them to the custom errors defined in `USDCPaymentHub.sol`.

Usage (Windows CMD / PowerShell)
--------------------------------
Open a terminal in `packages/contracts` and run:

node scripts\decodeRevert.js <revertHex>

Examples
--------
CMD:

node scripts\decodeRevert.js 0x08c379a0000000000000000000000000000000000000000000000000000000000000020...

PowerShell:

node scripts/decodeRevert.js 0x4e487b710000000000000000000000000000000000000000000000000000000000000001

What it recognizes
-------------------
- Error(string) (standard revert with message)
- Panic(uint256) (solidity panic codes)
- Custom errors defined in `USDCPaymentHub.sol` without parameters (selector matching)

Notes
-----
If the error has parameters, or is from another contract, you'll need the ABI for that contract to decode the payload fully. This script gives a fast way to identify USDCPaymentHub-specific errors.

How to extract revert hex from an RPC error
------------------------------------------
When an RPC method reverts you'll often see an error object in your client (ethers/web3). The important field is typically `error.data` or `error.body` which contains the revert return data. Common patterns:

- Ethers/v5 thrown error: `error.error.data` or `error.data` (look for a hex string starting with 0x)
- Hardhat/Alchemy JSON-RPC error: error object may contain `data` with the transaction hash mapping to the revert hex.

Example (what to paste into the script):

0x08c379a0000000000000000000000000000000000000000000000000000000000000020...

