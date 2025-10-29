#!/usr/bin/env node
// Carbon Credits & Environmental Impact Tracking

import { awardRep, getBalance, leaderboard, multiAward, getTransactionHistory } from 'repdao';
import { getCanisterMetrics, assessSystemHealth } from 'repdao/analytics';
import { identityFromPemFile } from 'repdao/identity';

async function carbonCreditsSystem() {
  console.log('🌱 Carbon Credits & Environmental Impact Tracking\n');
  
  const canisterId = '<your-canister-id>';
  const identity = identityFromPemFile('~/.repdao/environmental-authority.pem');
  const opts = { identity, network: 'ic' };

  // Environmental actions and their carbon credit values
  const environmentalActions = {
    'tree_planting': 10,           // per tree
    'solar_installation': 500,     // per kW installed
    'wind_energy': 750,           // per kW installed
    'waste_recycling': 2,         // per kg recycled
    'electric_vehicle': 1000,     // per vehicle
    'energy_efficiency': 300,     // per project
    'carbon_sequestration': 50,   // per ton CO2
    'renewable_energy_cert': 200, // per certificate
    'green_building': 2000,       // per building certified
    'reforestation': 25,          // per hectare
    'ocean_cleanup': 100,         // per cleanup event
    'sustainable_agriculture': 150 // per hectare converted
  };

  // Environmental participants
  const participants = [
    { id: '<company1-principal>', name: 'GreenTech Industries', type: 'Corporation', sector: 'Technology' },
    { id: '<company2-principal>', name: 'EcoFarms Collective', type: 'Cooperative', sector: 'Agriculture' },
    { id: '<individual1-principal>', name: 'Environmental Activist', type: 'Individual', sector: 'Activism' },
    { id: '<ngo1-principal>', name: 'Ocean Conservation NGO', type: 'NGO', sector: 'Conservation' },
    { id: '<city1-principal>', name: 'Green City Initiative', type: 'Municipality', sector: 'Urban Planning' }
  ];

  // Simulate environmental activities
  const activities = [
    { participant: participants[0].id, action: 'solar_installation', quantity: 50, details: 'Rooftop solar array - 50kW', location: 'California, USA' },
    { participant: participants[1].id, action: 'sustainable_agriculture', quantity: 100, details: 'Organic farming conversion', location: 'Iowa, USA' },
    { participant: participants[2].id, action: 'tree_planting', quantity: 500, details: 'Community reforestation project', location: 'Oregon, USA' },
    { participant: participants[3].id, action: 'ocean_cleanup', quantity: 5, details: 'Beach cleanup events', location: 'Pacific Coast' },
    { participant: participants[4].id, action: 'green_building', quantity: 3, details: 'LEED certified municipal buildings', location: 'Portland, OR' },
    { participant: participants[0].id, action: 'electric_vehicle', quantity: 25, details: 'Company fleet electrification', location: 'Corporate Fleet' },
    { participant: participants[1].id, action: 'carbon_sequestration', quantity: 200, details: 'Soil carbon storage project', location: 'Midwest Farms' },
    { participant: participants[2].id, action: 'waste_recycling', quantity: 10000, details: 'Community recycling program', location: 'Local Community' },
    { participant: participants[3].id, action: 'reforestation', quantity: 50, details: 'Coastal forest restoration', location: 'Pacific Northwest' },
    { participant: participants[4].id, action: 'energy_efficiency', quantity: 10, details: 'Smart city energy upgrades', location: 'City Infrastructure' }
  ];

  try {
    console.log('🌍 Processing environmental activities...\n');

    // Award carbon credits for environmental actions
    for (const activity of activities) {
      const participant = participants.find(p => p.id === activity.participant);
      const creditsPerUnit = environmentalActions[activity.action];
      const totalCredits = creditsPerUnit * activity.quantity;
      
      try {
        await awardRep(
          canisterId,
          activity.participant,
          BigInt(totalCredits),
          `Environmental Action: ${activity.action} - ${activity.details} (${activity.quantity} units @ ${creditsPerUnit} credits each)`,
          opts
        );
        
        console.log(`🌱 ${participant?.name}: +${totalCredits} carbon credits for ${activity.action}`);
        console.log(`   Details: ${activity.details} (${activity.location})`);
        
      } catch (error) {
        console.log(`❌ Failed to award credits to ${participant?.name}: ${error.message}`);
      }
    }

    // Generate environmental impact reports
    console.log('\n📊 Environmental Impact Reports:\n');
    
    for (const participant of participants) {
      try {
        const credits = await getBalance(canisterId, participant.id, opts);
        
        console.log(`🏢 ${participant.name}`);
        console.log(`   Type: ${participant.type}`);
        console.log(`   Sector: ${participant.sector}`);
        console.log(`   Carbon Credits: ${credits}`);
        
        // Calculate CO2 equivalent (1 credit = 1 kg CO2 equivalent)
        const co2Equivalent = Number(credits);
        console.log(`   CO2 Impact: ${co2Equivalent.toLocaleString()} kg CO2 equivalent`);
        
        // Environmental rating
        const rating = co2Equivalent >= 10000 ? 'Carbon Negative ⭐⭐⭐' :
                      co2Equivalent >= 5000 ? 'Carbon Neutral ⭐⭐' :
                      co2Equivalent >= 1000 ? 'Low Impact ⭐' : 'Getting Started';
        
        console.log(`   Environmental Rating: ${rating}`);
        
        // Certification level
        if (co2Equivalent >= 20000) {
          console.log(`   🏆 Platinum Environmental Leader`);
        } else if (co2Equivalent >= 10000) {
          console.log(`   🥇 Gold Environmental Steward`);
        } else if (co2Equivalent >= 5000) {
          console.log(`   🥈 Silver Sustainability Partner`);
        } else if (co2Equivalent >= 1000) {
          console.log(`   🥉 Bronze Green Contributor`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`❌ Error generating report for ${participant.name}: ${error.message}\n`);
      }
    }

    // Environmental leaderboard
    console.log('🏆 Environmental Impact Leaderboard:');
    const envLeaders = await leaderboard(canisterId, 10n, 0n, opts);
    
    envLeaders.forEach(([principal, credits], i) => {
      const participant = participants.find(p => p.id === principal.toString());
      const rank = i + 1;
      const medal = rank === 1 ? '🌟' : rank === 2 ? '🌿' : rank === 3 ? '🌱' : '🍃';
      const co2Impact = Number(credits).toLocaleString();
      
      if (participant) {
        console.log(`${medal} #${rank}: ${participant.name} (${participant.type}) - ${credits} credits (${co2Impact} kg CO2)`);
      } else {
        console.log(`${medal} #${rank}: ${principal.toString().slice(0, 12)}... - ${credits} credits`);
      }
    });

    // Sector analysis
    console.log('\n📈 Environmental Impact by Sector:');
    
    const sectorStats = {};
    
    for (const participant of participants) {
      const sector = participant.sector;
      if (!sectorStats[sector]) {
        sectorStats[sector] = { participants: 0, totalCredits: 0, types: new Set() };
      }
      
      try {
        const credits = await getBalance(canisterId, participant.id, opts);
        sectorStats[sector].participants++;
        sectorStats[sector].totalCredits += Number(credits);
        sectorStats[sector].types.add(participant.type);
      } catch (error) {
        // Skip if error
      }
    }
    
    Object.entries(sectorStats).forEach(([sector, stats]) => {
      const avgCredits = Math.round(stats.totalCredits / stats.participants);
      const totalCO2 = stats.totalCredits.toLocaleString();
      
      console.log(`🌍 ${sector}:`);
      console.log(`   Participants: ${stats.participants} (${Array.from(stats.types).join(', ')})`);
      console.log(`   Total Impact: ${stats.totalCredits} credits (${totalCO2} kg CO2)`);
      console.log(`   Average per participant: ${avgCredits} credits`);
    });

    // Activity impact analysis
    console.log('\n🔍 Activity Impact Analysis:');
    
    const activityStats = {};
    
    for (const activity of activities) {
      const action = activity.action;
      if (!activityStats[action]) {
        activityStats[action] = { count: 0, totalQuantity: 0, totalCredits: 0 };
      }
      
      const creditsPerUnit = environmentalActions[action];
      const totalCredits = creditsPerUnit * activity.quantity;
      
      activityStats[action].count++;
      activityStats[action].totalQuantity += activity.quantity;
      activityStats[action].totalCredits += totalCredits;
    }
    
    // Sort by total impact
    const sortedActivities = Object.entries(activityStats).sort((a, b) => b[1].totalCredits - a[1].totalCredits);
    
    console.log('Top Environmental Activities by Impact:');
    sortedActivities.slice(0, 5).forEach(([action, stats], i) => {
      console.log(`${i + 1}. ${action.replace(/_/g, ' ').toUpperCase()}`);
      console.log(`   Projects: ${stats.count}`);
      console.log(`   Total Quantity: ${stats.totalQuantity.toLocaleString()}`);
      console.log(`   Carbon Credits: ${stats.totalCredits.toLocaleString()}`);
    });

    // Global impact summary
    console.log('\n🌎 Global Environmental Impact Summary:');
    
    const totalCredits = Object.values(activityStats).reduce((sum, stats) => sum + stats.totalCredits, 0);
    const totalProjects = activities.length;
    const totalParticipants = participants.length;
    const avgCreditsPerProject = Math.round(totalCredits / totalProjects);
    
    console.log(`• Total carbon credits generated: ${totalCredits.toLocaleString()}`);
    console.log(`• Equivalent CO2 impact: ${totalCredits.toLocaleString()} kg CO2`);
    console.log(`• Environmental projects: ${totalProjects}`);
    console.log(`• Active participants: ${totalParticipants}`);
    console.log(`• Average impact per project: ${avgCreditsPerProject} credits`);
    
    // Convert to more meaningful units
    const tonsCO2 = Math.round(totalCredits / 1000);
    const treesEquivalent = Math.round(totalCredits / 22); // Average tree absorbs ~22kg CO2/year
    const carsOffRoad = Math.round(totalCredits / 4600); // Average car emits ~4.6 tons CO2/year
    
    console.log(`\n🌟 Environmental Achievements:`);
    console.log(`• ${tonsCO2} tons of CO2 equivalent impact`);
    console.log(`• Equivalent to ${treesEquivalent.toLocaleString()} trees planted`);
    console.log(`• Equal to taking ${carsOffRoad} cars off the road for a year`);

    // Future projections and recommendations
    console.log('\n💡 Sustainability Recommendations:');
    
    const highImpactParticipants = [];
    for (const participant of participants) {
      try {
        const credits = await getBalance(canisterId, participant.id, opts);
        if (Number(credits) >= 10000) {
          highImpactParticipants.push(participant.name);
        }
      } catch (error) {
        // Skip if error
      }
    }
    
    if (highImpactParticipants.length > 0) {
      console.log(`• Recognize top performers: ${highImpactParticipants.join(', ')}`);
    }
    
    console.log('• Expand renewable energy initiatives');
    console.log('• Increase reforestation and carbon sequestration projects');
    console.log('• Promote sustainable agriculture practices');
    console.log('• Develop carbon offset marketplace');
    console.log('• Implement real-time environmental monitoring');

  } catch (error) {
    console.error('❌ Carbon credits system error:', error.message);
  }
}

carbonCreditsSystem();
