#!/usr/bin/env node
// Community Rewards System - Discord/Forum Integration

import { awardRep, getBalance, leaderboard, addTrustedAwarder } from 'repdao';
import { identityFromPemFile } from 'repdao/identity';

async function communityRewardsSystem() {
  console.log('🏆 Community Rewards System\n');
  
  const canisterId = '<your-canister-id>';
  const identity = identityFromPemFile('~/.repdao/community-bot.pem');
  const opts = { identity, network: 'ic' };

  // Community actions and their point values
  const rewardActions = {
    'helpful_answer': 50,
    'bug_report': 25,
    'feature_request': 15,
    'code_contribution': 100,
    'documentation': 30,
    'community_help': 20,
    'event_participation': 40
  };

  try {
    // Simulate community member activities
    const activities = [
      { user: '<user1-principal>', action: 'helpful_answer', context: 'Solved deployment issue' },
      { user: '<user2-principal>', action: 'bug_report', context: 'Found critical security bug' },
      { user: '<user3-principal>', action: 'code_contribution', context: 'Added new feature' },
      { user: '<user1-principal>', action: 'community_help', context: 'Helped newcomer' },
      { user: '<user4-principal>', action: 'event_participation', context: 'Attended community call' }
    ];

    console.log('📊 Processing community activities...\n');

    // Process each activity
    for (const activity of activities) {
      const points = rewardActions[activity.action];
      
      try {
        await awardRep(
          canisterId,
          activity.user,
          BigInt(points),
          `${activity.action}: ${activity.context}`,
          opts
        );
        
        console.log(`✅ Awarded ${points} points to ${activity.user.slice(0, 8)}... for ${activity.action}`);
      } catch (error) {
        console.log(`❌ Failed to award ${activity.user.slice(0, 8)}...: ${error.message}`);
      }
    }

    // Show updated leaderboard
    console.log('\n🏆 Community Leaderboard:');
    const leaders = await leaderboard(canisterId, 10n, 0n, opts);
    
    leaders.forEach(([principal, points], i) => {
      const rank = i + 1;
      const badge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
      console.log(`${badge} #${rank}: ${principal.toString().slice(0, 12)}... - ${points} points`);
    });

    // Community insights
    console.log('\n📈 Community Insights:');
    const totalActivities = activities.length;
    const uniqueUsers = new Set(activities.map(a => a.user)).size;
    const totalPointsAwarded = activities.reduce((sum, a) => sum + rewardActions[a.action], 0);
    
    console.log(`• Total activities processed: ${totalActivities}`);
    console.log(`• Active community members: ${uniqueUsers}`);
    console.log(`• Total points distributed: ${totalPointsAwarded}`);
    console.log(`• Average points per activity: ${Math.round(totalPointsAwarded / totalActivities)}`);

  } catch (error) {
    console.error('❌ Community rewards error:', error.message);
  }
}

communityRewardsSystem();
