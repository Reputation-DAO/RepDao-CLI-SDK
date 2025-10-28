#!/usr/bin/env node
// Batch operations example

import { multiAward, leaderboard, getTrustedAwarders } from 'repdao';
import { identityFromPemFile } from 'repdao/identity';

async function main() {
  const canisterId = 'your-canister-id-here';
  const identity = identityFromPemFile('~/.repdao/admin.pem');
  const opts = { identity, network: 'ic' };

  try {
    // Batch award to multiple users
    console.log('🎯 Batch awarding points...');
    const users = [
      ['user1-principal', 100n, 'Great contribution'],
      ['user2-principal', 50n, 'Good work'],
      ['user3-principal', 25n, 'Thanks for participating']
    ];
    
    const result = await multiAward(canisterId, users, true, opts);
    console.log('Result:', result);
    
    // Get leaderboard
    console.log('\n🏆 Top 10 leaderboard:');
    const leaders = await leaderboard(canisterId, 10n, 0n, opts);
    leaders.forEach(([principal, points], i) => {
      console.log(`${i + 1}. ${principal}: ${points} points`);
    });
    
    // List trusted awarders
    console.log('\n👥 Trusted awarders:');
    const awarders = await getTrustedAwarders(canisterId, opts);
    awarders.forEach(awarder => {
      console.log(`- ${awarder.name} (${awarder.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
