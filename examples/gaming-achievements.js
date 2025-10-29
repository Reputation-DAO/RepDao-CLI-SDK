#!/usr/bin/env node
// Gaming Achievement & Leaderboard System

import { awardRep, getBalance, leaderboard, multiAward } from 'repdao';
import { createEventStream } from 'repdao/events';
import { identityFromPemFile } from 'repdao/identity';

async function gamingAchievementSystem() {
  console.log('🎮 Gaming Achievement System\n');
  
  const canisterId = '<your-canister-id>';
  const identity = identityFromPemFile('~/.repdao/game-server.pem');
  const opts = { identity, network: 'ic' };

  // Achievement definitions
  const achievements = {
    // Combat achievements
    'first_kill': { points: 10, title: 'First Blood', description: 'Get your first elimination' },
    'killing_spree': { points: 50, title: 'Killing Spree', description: '5 eliminations without dying' },
    'headshot_master': { points: 25, title: 'Headshot Master', description: '10 headshot eliminations' },
    
    // Progression achievements
    'level_up': { points: 20, title: 'Level Up', description: 'Reach a new level' },
    'max_level': { points: 500, title: 'Max Level', description: 'Reach maximum level' },
    'prestige': { points: 1000, title: 'Prestige', description: 'Enter prestige mode' },
    
    // Social achievements
    'team_player': { points: 30, title: 'Team Player', description: 'Assist teammates 20 times' },
    'mentor': { points: 100, title: 'Mentor', description: 'Help 5 new players' },
    
    // Special achievements
    'daily_login': { points: 5, title: 'Daily Warrior', description: 'Login daily for 7 days' },
    'tournament_winner': { points: 1500, title: 'Champion', description: 'Win a tournament' },
    'rare_item': { points: 200, title: 'Treasure Hunter', description: 'Find a legendary item' }
  };

  // Simulate game events
  const gameEvents = [
    { player: '<player1-principal>', achievement: 'first_kill', metadata: { weapon: 'rifle', map: 'dust2' } },
    { player: '<player2-principal>', achievement: 'level_up', metadata: { newLevel: 15 } },
    { player: '<player1-principal>', achievement: 'headshot_master', metadata: { totalHeadshots: 10 } },
    { player: '<player3-principal>', achievement: 'team_player', metadata: { assists: 20 } },
    { player: '<player2-principal>', achievement: 'killing_spree', metadata: { streak: 5 } },
    { player: '<player4-principal>', achievement: 'daily_login', metadata: { streak: 7 } },
    { player: '<player3-principal>', achievement: 'rare_item', metadata: { item: 'Dragon Sword' } },
    { player: '<player1-principal>', achievement: 'tournament_winner', metadata: { tournament: 'Summer Cup 2024' } }
  ];

  try {
    console.log('🏆 Processing game achievements...\n');

    // Process achievements
    for (const event of gameEvents) {
      const achievement = achievements[event.achievement];
      
      if (!achievement) {
        console.log(`❌ Unknown achievement: ${event.achievement}`);
        continue;
      }

      try {
        await awardRep(
          canisterId,
          event.player,
          BigInt(achievement.points),
          `Achievement: ${achievement.title} - ${achievement.description}`,
          opts
        );
        
        console.log(`🎉 ${event.player.slice(0, 8)}... unlocked "${achievement.title}" (+${achievement.points} XP)`);
        
        // Special celebration for high-value achievements
        if (achievement.points >= 500) {
          console.log(`   🌟 LEGENDARY ACHIEVEMENT! 🌟`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to award achievement: ${error.message}`);
      }
    }

    // Display leaderboards
    console.log('\n🏆 Global Leaderboard:');
    const globalLeaders = await leaderboard(canisterId, 10n, 0n, opts);
    
    globalLeaders.forEach(([principal, xp], i) => {
      const rank = i + 1;
      const badge = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
      const level = Math.floor(Number(xp) / 100) + 1; // 100 XP per level
      
      console.log(`${badge} #${rank}: ${principal.toString().slice(0, 12)}... - Level ${level} (${xp} XP)`);
    });

    // Player progression analysis
    console.log('\n📊 Player Progression Analysis:');
    
    const playerStats = new Map();
    
    // Aggregate player achievements
    for (const event of gameEvents) {
      if (!playerStats.has(event.player)) {
        playerStats.set(event.player, { achievements: [], totalXP: 0 });
      }
      
      const stats = playerStats.get(event.player);
      stats.achievements.push(event.achievement);
      stats.totalXP += achievements[event.achievement].points;
    }

    // Display player insights
    for (const [player, stats] of playerStats) {
      const level = Math.floor(stats.totalXP / 100) + 1;
      const achievementCount = stats.achievements.length;
      const uniqueAchievements = new Set(stats.achievements).size;
      
      console.log(`🎮 Player ${player.slice(0, 8)}...:`);
      console.log(`   Level: ${level} (${stats.totalXP} XP)`);
      console.log(`   Achievements: ${achievementCount} total, ${uniqueAchievements} unique`);
      
      // Player type analysis
      const combatAchievements = stats.achievements.filter(a => ['first_kill', 'killing_spree', 'headshot_master'].includes(a)).length;
      const socialAchievements = stats.achievements.filter(a => ['team_player', 'mentor'].includes(a)).length;
      
      let playerType = 'Casual Player';
      if (combatAchievements >= 2) playerType = 'Combat Specialist';
      if (socialAchievements >= 1) playerType = 'Team Leader';
      if (stats.totalXP >= 1000) playerType = 'Elite Player';
      
      console.log(`   Player Type: ${playerType}\n`);
    }

    // Achievement rarity analysis
    console.log('💎 Achievement Rarity:');
    const achievementCounts = {};
    
    for (const event of gameEvents) {
      achievementCounts[event.achievement] = (achievementCounts[event.achievement] || 0) + 1;
    }
    
    Object.entries(achievements).forEach(([key, achievement]) => {
      const count = achievementCounts[key] || 0;
      const rarity = count === 0 ? 'Legendary' : count === 1 ? 'Epic' : count <= 2 ? 'Rare' : 'Common';
      const rarityIcon = rarity === 'Legendary' ? '🌟' : rarity === 'Epic' ? '💜' : rarity === 'Rare' ? '💙' : '⚪';
      
      console.log(`${rarityIcon} ${achievement.title}: ${count} players (${rarity})`);
    });

    // Season summary
    console.log('\n📈 Season Summary:');
    const totalXPAwarded = Object.values(playerStats).reduce((sum, stats) => sum + stats.totalXP, 0);
    const avgXPPerPlayer = Math.round(totalXPAwarded / playerStats.size);
    const mostPopularAchievement = Object.entries(achievementCounts).sort((a, b) => b[1] - a[1])[0];
    
    console.log(`• Total XP awarded: ${totalXPAwarded}`);
    console.log(`• Active players: ${playerStats.size}`);
    console.log(`• Average XP per player: ${avgXPPerPlayer}`);
    console.log(`• Most popular achievement: ${achievements[mostPopularAchievement[0]].title} (${mostPopularAchievement[1]} unlocks)`);

  } catch (error) {
    console.error('❌ Gaming system error:', error.message);
  }
}

gamingAchievementSystem();
