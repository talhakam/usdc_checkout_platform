#!/usr/bin/env node
/**
 * runFaucet.js
 * Sends a real transaction to MockUSDC.faucet using a private key (or --pk) and prints the receipt or error details.
 * Usage:
 *  node runFaucet.js --rpc <RPC> --contract <CONTRACT> --to <TO> --amount <micro> [--pk <PRIVATE_KEY>]
 */

const { argv } = require('process');
const ethers = require('ethers');

function parseArgs() {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a && a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i+1];
      args[key] = val;
      i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const rpc = args.rpc || process.env.NEXT_PUBLIC_ALCHEMY_AMOY_URL || process.env.ALCHEMY_AMOY_URL;
  const contract = args.contract;
  const to = args.to;
  const amount = args.amount || '1000000';
  const pk = args.pk || process.env.PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY;

  if (!rpc) { console.error('Missing --rpc or ALCHEMY_AMOY_URL env'); process.exit(1); }
  if (!contract) { console.error('Missing --contract'); process.exit(1); }
  if (!to) { console.error('Missing --to'); process.exit(1); }
  if (!pk) { console.error('Missing --pk or PRIVATE_KEY env'); process.exit(1); }

  let provider;
  if (ethers.providers && ethers.providers.JsonRpcProvider) {
    provider = new ethers.providers.JsonRpcProvider(rpc);
  } else if (ethers.JsonRpcProvider) {
    provider = new ethers.JsonRpcProvider(rpc);
  } else {
    console.error('Could not find a JsonRpcProvider constructor on ethers. Ensure ethers is installed.');
    process.exit(1);
  }
  const wallet = new ethers.Wallet(pk, provider);

  console.log('Using account:', wallet.address);
  console.log('RPC:', rpc);
  console.log('Contract:', contract);
  console.log('To:', to);
  console.log('Amount (micro):', amount);

  const abi = [ 'function faucet(address to, uint256 amount) external' ];
  const contractInstance = new ethers.Contract(contract, abi, wallet);

  try {
  // pass amount as string to avoid BigNumber constructor differences
  const tx = await contractInstance.faucet(to, amount.toString(), { gasLimit: 100000 });
    console.log('tx hash:', tx.hash);
    console.log('waiting for receipt...');
    const receipt = await tx.wait();
    console.log('receipt:', receipt);
  } catch (err) {
    console.error('Transaction failed:');
    // print common fields
    if (err.code) console.error('code:', err.code);
    if (err.error) console.error('error:', err.error);
    if (err.body) console.error('body:', err.body);
    if (err.data) console.error('data:', err.data);
    console.error('full error:', err);
    process.exit(2);
  }
}

main().catch(e => { console.error(e); process.exit(99); });
