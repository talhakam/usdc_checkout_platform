#!/usr/bin/env node
/*
  decodeRevert.js
  ----------------
  Small helper to decode Ethereum revert data. It recognizes:
    - Error(string) (selector 0x08c379a0)
    - Panic(uint256) (selector 0x4e487b71)
    - Custom errors defined in USDCPaymentHub.sol (no params)

  Usage:
    node scripts/decodeRevert.js <revertHex>

  Example:
    node scripts/decodeRevert.js 0x08c379a0000000000000000000000000000000000000000000000000000000000000020...

  This script depends on ethers which is already present in the contracts package (Hardhat projects normally have it).
*/

const { ethers } = require('ethers');

const knownErrors = [
  'ZeroAddress()',
  'FeeTooHigh()',
  'NotMerchant()',
  'InvalidAmount()',
  'PaymentAlreadyProcessed()',
  'PaymentNotProcessed()',
  'AlreadyRefunded()',
  'RefundNotRequested()',
  'NotPaymentConsumer()',
  'NotPaymentMerchant()',
  'RefundAmountTooHigh()'
];

const selectors = {};

// Helper to compute keccak256(id) for an error signature in a way that's
// compatible with either ethers v5 or v6 (utils.id or top-level id),
// and falls back to keccak256(toUtf8Bytes).
function getIdHex(str) {
  // ethers v5 exposes ethers.utils.id
  if (ethers && ethers.utils && typeof ethers.utils.id === 'function') {
    return ethers.utils.id(str);
  }
  // ethers v6 may expose a top-level id
  if (ethers && typeof ethers.id === 'function') {
    return ethers.id(str);
  }
  // fallback: keccak256 of utf8 bytes
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
}

for (const e of knownErrors) {
  const s = getIdHex(e).slice(0, 10); // 0x + 8 hex chars
  selectors[s] = e;
}

function prettyList(selMap) {
  return Object.entries(selMap)
    .map(([k,v]) => `  ${k} -> ${v}`)
    .join('\n');
}

function decode(revertHex) {
  if (!revertHex) {
    console.log('Please provide revert hex as the first argument.');
    console.log('Known selectors from USDCPaymentHub.sol:');
    console.log(prettyList(selectors));
    return process.exit(1);
  }

  if (!revertHex.startsWith('0x')) revertHex = '0x' + revertHex;

  // Error(string)
  if (revertHex.startsWith('0x08c379a0')) {
    try {
      const data = '0x' + revertHex.slice(10);
      const decoded = ethers.utils.defaultAbiCoder.decode(['string'], data);
      console.log('Revert reason: Error(string) ->', decoded[0]);
      return;
    } catch (err) {
      console.error('Failed to decode Error(string):', err.message);
      return;
    }
  }

  // Panic(uint256)
  if (revertHex.startsWith('0x4e487b71')) {
    try {
      const data = '0x' + revertHex.slice(10);
      const code = ethers.utils.defaultAbiCoder.decode(['uint256'], data)[0];
      console.log('Panic(uint256) with code:', code.toString());
      console.log('See solidity panic codes: https://docs.soliditylang.org/en/latest/control-structures.html#panic-via-assert-and-error-via-require');
      return;
    } catch (err) {
      console.error('Failed to decode Panic(uint256):', err.message);
      return;
    }
  }

  // Custom error selectors (first 4 bytes)
  const sel = revertHex.slice(0, 10);
  if (selectors[sel]) {
    console.log('Custom error selector detected:', sel);
    console.log('This matches USDCPaymentHub custom error:', selectors[sel]);
    return;
  }

  // Unknown selector -- print some helpful diagnostics
  console.log('Unknown revert selector:', sel);
  console.log('Full revert hex:', revertHex);
  console.log('\nKnown USDCPaymentHub selectors:');
  console.log(prettyList(selectors));
  console.log('\nIf this is a custom error with parameters, you may need the full ABI to decode parameter data.');
}

// Entry
const input = process.argv[2];
decode(input);
