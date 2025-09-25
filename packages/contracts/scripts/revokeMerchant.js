#!/usr/bin/env node
/* revokeMerchant.js
   Usage:
     node revokeMerchant.js --rpc <ALCHEMY_RPC> --contract <HUB_ADDRESS> --pk <ADMIN_PRIVATE_KEY> --target <MERCHANT_ADDRESS>

   This script checks hasRole(MERCHANT_ROLE, target) and if true, calls revokeMerchant(target)
*/

const { ethers } = require('ethers');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');

(async () => {
  const argv = yargs(hideBin(process.argv))
    .option('rpc', { type: 'string', demandOption: true })
    .option('contract', { type: 'string', demandOption: true })
    .option('pk', { type: 'string', demandOption: true })
    .option('target', { type: 'string', demandOption: true })
    .argv;

  const { rpc, contract, pk, target } = argv;
  const dryRun = !!argv['dry-run'];

  // Load ABI from artifacts if present
  let abi;
  try {
    const art = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'artifacts', 'contracts', 'USDCPaymentHub.sol', 'USDCPaymentHub.json'), 'utf8'));
    abi = art.abi;
  } catch (e) {
    console.warn('Could not load artifact, using minimal ABI fallback');
    abi = [
      'function hasRole(bytes32 role, address account) view returns (bool)',
      'function revokeMerchant(address merchant)'
    ];
  }

  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const admin = new ethers.Wallet(pk, provider);
  const hub = new ethers.Contract(contract, abi, admin);

  const MERCHANT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MERCHANT_ROLE'));

  // check if target is already a merchant
  console.log('Checking MERCHANT_ROLE for', target);
  const hasData = await provider.call({ to: contract, data: hub.interface.encodeFunctionData('hasRole', [MERCHANT_ROLE, target]) });
  const decoded = hub.interface.decodeFunctionResult('hasRole', hasData);
  const isMerchant = decoded[0];
  console.log('isMerchant:', isMerchant);

  // verify the provided PK corresponds to an admin (ADMIN_ROLE)
  const adminAddress = await admin.getAddress();
  const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE'));
  console.log('Checking ADMIN_ROLE for caller', adminAddress);
  const hasAdminData = await provider.call({ to: contract, data: hub.interface.encodeFunctionData('hasRole', [ADMIN_ROLE, adminAddress]) });
  const decodedAdmin = hub.interface.decodeFunctionResult('hasRole', hasAdminData);
  const isAdmin = decodedAdmin[0];
  console.log('isAdmin:', isAdmin);
  if (!isMerchant) {
    console.log('Target is not a merchant, nothing to revoke');
    process.exit(0);
  }

  if (!isAdmin) {
    console.log('Provided admin key does not have ADMIN_ROLE; cannot revoke.');
    process.exit(2);
  }

  if (dryRun) {
    console.log('Dry-run mode: target is a merchant and caller is admin — revoke would proceed. Exiting without sending tx.');
    process.exit(0);
  }

  console.log('Sending revokeMerchant tx...');
  const tx = await hub.revokeMerchant(target);
  console.log('tx hash:', tx.hash);
  const receipt = await tx.wait();
  console.log('receipt status:', receipt.status);
  process.exit(0);
})();
