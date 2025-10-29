#!/usr/bin/env node
// Working Basic RepDAO SDK usage example

import { health, getBalance, version } from '../dist/client.js';

async function main() {
  // Real configuration from our testing
  const canisterId = 'ish2p-qiaaa-aaaam-qekqa-cai';
  const userPrincipal = 'ly6rq-d4d23-63ct7-e2j6c-257jk-627xo-wwwd4-lnxm6-qt7xb-573bv-bqe';
  
  // No identity needed for query operations
  const opts = { network: 'ic' };

  try {
    console.log('🧪 Testing RepDAO SDK with real canister...\n');
    
    // Check canister health
    console.log('🏥 Checking canister health...');
    const healthStatus = await health(canisterId, opts);
    console.log('✅ Status:', healthStatus.paused ? 'Paused' : 'Active');
    console.log('✅ Users:', healthStatus.users.toString());
    console.log('✅ Cycles:', (Number(healthStatus.cycles) / 1e12).toFixed(2) + 'T');
    
    // Get version
    console.log('\n📋 Checking version...');
    const ver = await version(canisterId, opts);
    console.log('✅ Version:', ver);
    
    // Check balance
    console.log('\n💰 Checking user balance...');
    const balance = await getBalance(canisterId, userPrincipal, opts);
    console.log('✅ Balance:', balance.toString(), 'points');
    
    console.log('\n🎉 All SDK functions working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
