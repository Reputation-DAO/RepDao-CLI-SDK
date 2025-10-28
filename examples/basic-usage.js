#!/usr/bin/env node
// Basic RepDAO SDK usage example

import { awardRep, getBalance, health } from 'repdao';
import { identityFromPemFile } from 'repdao/identity';

async function main() {
  // Configuration
  const canisterId = 'your-canister-id-here';
  const userPrincipal = 'user-principal-here';
  
  // Load identity (replace with your PEM file path)
  const identity = identityFromPemFile('~/.repdao/admin.pem');
  const opts = { identity, network: 'ic' };

  try {
    // Check canister health
    console.log('🏥 Checking canister health...');
    const healthStatus = await health(canisterId, opts);
    console.log('Status:', healthStatus.paused ? 'Paused' : 'Active');
    console.log('Users:', healthStatus.users.toString());
    
    // Award points
    console.log('\n🎯 Awarding 100 points...');
    const awardResult = await awardRep(
      canisterId, 
      userPrincipal, 
      100n, 
      'Welcome bonus!', 
      opts
    );
    console.log('Result:', awardResult);
    
    // Check balance
    console.log('\n💰 Checking balance...');
    const balance = await getBalance(canisterId, userPrincipal, opts);
    console.log('Balance:', balance.toString(), 'points');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
