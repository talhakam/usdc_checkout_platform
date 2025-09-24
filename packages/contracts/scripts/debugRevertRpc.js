#!/usr/bin/env node
/*
  debugRevertRpc.js

  Usage:
    node scripts/debugRevertRpc.js --payment <paymentId> --amount <amountUnits> --from <merchantAddress> [--hub <hubAddress>] [--rpc <rpcUrl>]

  Example:
    node scripts/debugRevertRpc.js --payment 0x5a23... --amount 500000 --from 0x7099... --rpc http://127.0.0.1:8545

  This script will build the calldata for merchantRefund(paymentId, amount) and do a raw eth_call
  (no state change) against the RPC node. Local nodes (Hardhat/Anvil) often include the revert
  return data in the RPC error; this script extracts and prints it so you can decode it.

*/

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const argv = require('minimist')(process.argv.slice(2));

function usage(exitCode = 1) {
  console.log('Usage: node scripts/debugRevertRpc.js --payment <paymentId> --amount <amountUnits> --from <merchantAddress> [--hub <hubAddress>] [--rpc <rpcUrl>]');
  process.exit(exitCode);
}

const paymentId = argv.payment || argv.p;
const amount = argv.amount || argv.a;
const from = argv.from || argv.f;
const hub = argv.hub || argv.h || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const rpc = argv.rpc || argv.r || 'http://127.0.0.1:8545';

if (!paymentId || !amount || !from) usage();

// Load ABI from the repo
const abiPath = path.join(__dirname, '..', 'abis', 'USDCPaymentHub.json');
let USDCPaymentHubAbi;
try {
  // prefer a JSON ABI file if present
  if (fs.existsSync(abiPath)) {
    USDCPaymentHubAbi = require(abiPath);
  }
} catch (err) {
  // ignore
}

// fallback: minimal ABI entry for merchantRefund
if (!USDCPaymentHubAbi) {
  USDCPaymentHubAbi = [
    'function merchantRefund(bytes32 paymentId, uint256 amount)'
  ];
}

async function main() {
  const iface = new ethers.utils.Interface(USDCPaymentHubAbi);
  const data = iface.encodeFunctionData('merchantRefund', [paymentId, ethers.BigNumber.from(String(amount))]);

  console.log('eth_call to', hub);
  console.log('from:', from);
  console.log('data:', data);

  // Use fetch-based JSON-RPC POST to be robust across provider implementations
  let _fetch = (typeof fetch !== 'undefined') ? fetch : null;
  if (!_fetch) {
    try {
      _fetch = require('node-fetch');
    } catch (err) {
      console.error('No global fetch and node-fetch is not installed. Please run on Node 18+ or install node-fetch.');
      process.exit(1);
    }
  }

  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_call',
    params: [{ to: hub, data, from }, 'latest']
  };

  try {
    const resp = await _fetch(rpc, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await resp.json();
    if (json.result) {
      console.log('eth_call returned (no revert, raw result):', json.result);
      console.log('If this returned successfully the call did not revert.');
      return;
    }

    if (json.error) {
      console.error('RPC returned error object:', JSON.stringify(json.error, null, 2));
      // try extract hex from json.error.data
      const d = json.error.data || json.error;
      const match = String(d).match(/0x[0-9a-fA-F]+/);
      if (match) console.log('Found revert hex in RPC error.data:', match[0]);
      return;
    }

    // fallback: print entire response
    console.log('RPC response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Failed to perform eth_call via RPC. Error object:');
    console.error(err);
    // inspect nested fields for revert hex
    const candidates = [
      err?.error?.data,
      err?.data,
      err?.body,
      err?.error?.body,
      (() => { try { const b = JSON.parse(err?.body || '{}'); return b?.error?.data || b?.data; } catch (_) { return null; } })(),
    ];

    for (const c of candidates) {
      if (!c) continue;
      const s = typeof c === 'string' ? c : (c.data ?? c);
      if (!s) continue;
      const match = String(s).match(/0x[0-9a-fA-F]+/);
      if (match) {
        console.log('Found revert hex in error candidate:', match[0]);
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
