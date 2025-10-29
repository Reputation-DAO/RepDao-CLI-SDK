#!/usr/bin/env node
// Shareholder Governance & Corporate Voting System

import { awardRep, revokeRep, getBalance, leaderboard, multiAward } from 'repdao';
import { generateInsights, analyzeUserBehavior } from 'repdao/insights';
import { createEventStream } from 'repdao/events';
import { identityFromPemFile } from 'repdao/identity';

async function shareholderGovernance() {
  console.log('🏛️  Shareholder Governance & Corporate Voting System\n');
  
  const canisterId = '<your-canister-id>';
  const identity = identityFromPemFile('~/.repdao/governance-secretary.pem');
  const opts = { identity, network: 'ic' };

  // Governance participation metrics
  const governanceMetrics = {
    'proxy_voting': 25,              // Participating in proxy votes
    'annual_meeting_attendance': 50, // Attending shareholder meetings
    'proposal_submission': 100,      // Submitting shareholder proposals
    'due_diligence_research': 75,    // Researching voting matters
    'activist_engagement': 150,      // Engaging in shareholder activism
    'esg_advocacy': 120,            // Environmental/social governance
    'board_nomination': 200,         // Nominating board members
    'audit_committee_service': 180,  // Serving on audit committee
    'compensation_oversight': 90,    // Executive compensation review
    'merger_analysis': 110,         // M&A transaction analysis
    'dividend_advocacy': 60,        // Dividend policy engagement
    'transparency_initiative': 80   // Corporate transparency efforts
  };

  const governancePenalties = {
    'voting_abstention': -15,       // Not participating in votes
    'conflict_of_interest': -100,   // Undisclosed conflicts
    'insider_trading': -500,        // Securities violations
    'proxy_manipulation': -200,     // Improper proxy solicitation
    'information_misuse': -150,     // Misusing material information
    'fiduciary_breach': -300       // Breach of fiduciary duty
  };

  // Shareholder classes and participants
  const shareholders = [
    { id: '<institutional1-principal>', name: 'Vanguard Group', type: 'Institutional', shares: 125000000, ownership: 12.5 },
    { id: '<institutional2-principal>', name: 'BlackRock Inc', type: 'Institutional', shares: 98000000, ownership: 9.8 },
    { id: '<mutual-fund1-principal>', name: 'Fidelity Contrafund', type: 'Mutual Fund', shares: 67000000, ownership: 6.7 },
    { id: '<pension1-principal>', name: 'CalPERS', type: 'Pension Fund', shares: 45000000, ownership: 4.5 },
    { id: '<activist1-principal>', name: 'Pershing Square Capital', type: 'Activist Fund', shares: 35000000, ownership: 3.5 },
    { id: '<individual1-principal>', name: 'Retail Investor Coalition', type: 'Retail Group', shares: 15000000, ownership: 1.5 },
    { id: '<esg-fund1-principal>', name: 'Sustainable Growth Fund', type: 'ESG Fund', shares: 28000000, ownership: 2.8 }
  ];

  // Corporate governance proposals and voting records
  const governanceProposals = [
    { id: 'PROP-2024-001', title: 'Executive Compensation Plan', type: 'compensation', status: 'active' },
    { id: 'PROP-2024-002', title: 'Board Independence Standards', type: 'governance', status: 'active' },
    { id: 'PROP-2024-003', title: 'Climate Change Disclosure', type: 'esg', status: 'passed' },
    { id: 'PROP-2024-004', title: 'Dividend Policy Review', type: 'financial', status: 'active' },
    { id: 'PROP-2024-005', title: 'Audit Firm Selection', type: 'audit', status: 'passed' }
  ];

  // Simulate governance activities
  const governanceActivities = [
    // Positive governance engagement
    { shareholder: shareholders[0].id, activity: 'proxy_voting', details: 'Voted on all 15 proposals', proposal: 'PROP-2024-001' },
    { shareholder: shareholders[1].id, activity: 'annual_meeting_attendance', details: 'Attended virtual AGM', proposal: null },
    { shareholder: shareholders[4].id, activity: 'proposal_submission', details: 'Submitted board diversity proposal', proposal: 'PROP-2024-002' },
    { shareholder: shareholders[6].id, activity: 'esg_advocacy', details: 'Led climate disclosure initiative', proposal: 'PROP-2024-003' },
    { shareholder: shareholders[3].id, activity: 'due_diligence_research', details: 'Published 50-page governance analysis', proposal: 'PROP-2024-004' },
    { shareholder: shareholders[2].id, activity: 'compensation_oversight', details: 'Challenged excessive CEO pay package', proposal: 'PROP-2024-001' },
    { shareholder: shareholders[4].id, activity: 'activist_engagement', details: 'Engaged management on strategic direction', proposal: null },
    { shareholder: shareholders[0].id, activity: 'audit_committee_service', details: 'Served on audit committee for 2 years', proposal: 'PROP-2024-005' },
    { shareholder: shareholders[1].id, activity: 'transparency_initiative', details: 'Advocated for quarterly ESG reporting', proposal: null },
    
    // Governance issues
    { shareholder: shareholders[5].id, activity: 'voting_abstention', details: 'Failed to vote on key proposals', proposal: 'PROP-2024-001' },
    { shareholder: shareholders[2].id, activity: 'conflict_of_interest', details: 'Undisclosed business relationship', proposal: 'PROP-2024-002' }
  ];

  try {
    console.log('🗳️  Processing governance activities...\n');

    // Process governance events
    for (const activity of governanceActivities) {
      const shareholder = shareholders.find(s => s.id === activity.shareholder);
      const isPositive = governanceMetrics[activity.activity] !== undefined;
      const points = isPositive ? governanceMetrics[activity.activity] : governancePenalties[activity.activity];
      
      // Weight points by ownership percentage (larger shareholders have more impact)
      const weightedPoints = Math.round(points * (1 + (shareholder?.ownership || 0) / 100));
      
      try {
        if (isPositive) {
          await awardRep(
            canisterId,
            activity.shareholder,
            BigInt(weightedPoints),
            `Governance Activity: ${activity.activity} - ${activity.details} ${activity.proposal ? `(${activity.proposal})` : ''}`,
            opts
          );
          console.log(`✅ ${shareholder?.name}: +${weightedPoints} governance points for ${activity.activity}`);
        } else {
          await revokeRep(
            canisterId,
            activity.shareholder,
            BigInt(Math.abs(weightedPoints)),
            `Governance Issue: ${activity.activity} - ${activity.details} ${activity.proposal ? `(${activity.proposal})` : ''}`,
            opts
          );
          console.log(`⚠️  ${shareholder?.name}: ${weightedPoints} governance points for ${activity.activity}`);
        }
        
        if (activity.proposal) {
          console.log(`   Related to: ${activity.proposal}`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to process activity for ${shareholder?.name}: ${error.message}`);
      }
    }

    // Generate shareholder governance reports
    console.log('\n📊 Shareholder Governance Reports:\n');
    
    for (const shareholder of shareholders) {
      try {
        const score = await getBalance(canisterId, shareholder.id, opts);
        
        console.log(`🏢 ${shareholder.name}`);
        console.log(`   Type: ${shareholder.type}`);
        console.log(`   Ownership: ${shareholder.ownership}% (${(shareholder.shares / 1000000).toFixed(1)}M shares)`);
        console.log(`   Governance Score: ${score} points`);
        
        // Calculate voting power and influence
        const votingPower = shareholder.ownership;
        const influence = Number(score) * votingPower;
        
        console.log(`   Voting Power: ${votingPower.toFixed(1)}%`);
        console.log(`   Governance Influence: ${influence.toFixed(0)} (score × ownership)`);
        
        // Governance rating
        const rating = Number(score) >= 400 ? 'Exemplary Steward ⭐⭐⭐' :
                      Number(score) >= 250 ? 'Active Participant ⭐⭐' :
                      Number(score) >= 150 ? 'Engaged Shareholder ⭐' :
                      Number(score) >= 50 ? 'Basic Participation' : 'Passive Investor';
        
        console.log(`   Governance Rating: ${rating}`);
        
        // Stewardship classification
        if (Number(score) >= 300 && shareholder.ownership >= 5) {
          console.log(`   🏛️  Lead Steward - Qualified for board nomination`);
        } else if (Number(score) >= 200) {
          console.log(`   📋 Active Steward - Committee service eligible`);
        } else if (Number(score) >= 100) {
          console.log(`   🗳️  Engaged Voter - Proxy advisory role`);
        } else if (Number(score) < 50) {
          console.log(`   ⚠️  Passive Holder - Engagement needed`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`❌ Error generating report for ${shareholder.name}: ${error.message}\n`);
      }
    }

    // Governance influence leaderboard
    console.log('🏆 Governance Influence Leaderboard:');
    const govLeaders = await leaderboard(canisterId, 10n, 0n, opts);
    
    govLeaders.forEach(([principal, points], i) => {
      const shareholder = shareholders.find(s => s.id === principal.toString());
      const rank = i + 1;
      const medal = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏛️';
      
      if (shareholder) {
        const influence = Number(points) * shareholder.ownership;
        console.log(`${medal} #${rank}: ${shareholder.name} (${shareholder.type}) - ${points} points (${influence.toFixed(0)} influence)`);
      } else {
        console.log(`${medal} #${rank}: ${principal.toString().slice(0, 12)}... - ${points} points`);
      }
    });

    // Proposal analysis
    console.log('\n📋 Governance Proposal Analysis:');
    
    const proposalStats = {};
    
    for (const activity of governanceActivities) {
      if (activity.proposal) {
        if (!proposalStats[activity.proposal]) {
          proposalStats[activity.proposal] = { participants: 0, totalShares: 0, activities: [] };
        }
        
        const shareholder = shareholders.find(s => s.id === activity.shareholder);
        if (shareholder) {
          proposalStats[activity.proposal].participants++;
          proposalStats[activity.proposal].totalShares += shareholder.shares;
          proposalStats[activity.proposal].activities.push(activity.activity);
        }
      }
    }
    
    Object.entries(proposalStats).forEach(([proposalId, stats]) => {
      const proposal = governanceProposals.find(p => p.id === proposalId);
      const participationRate = (stats.totalShares / 1000000000) * 100; // Assuming 1B total shares
      
      console.log(`📄 ${proposal?.title} (${proposalId})`);
      console.log(`   Type: ${proposal?.type}`);
      console.log(`   Status: ${proposal?.status}`);
      console.log(`   Shareholder Participation: ${stats.participants} shareholders`);
      console.log(`   Voting Power Engaged: ${participationRate.toFixed(1)}%`);
      console.log(`   Activities: ${stats.activities.join(', ')}`);
    });

    // Shareholder type analysis
    console.log('\n📈 Governance by Shareholder Type:');
    
    const typeStats = {};
    
    for (const shareholder of shareholders) {
      const type = shareholder.type;
      if (!typeStats[type]) {
        typeStats[type] = { count: 0, totalShares: 0, totalScore: 0, avgOwnership: 0 };
      }
      
      try {
        const score = await getBalance(canisterId, shareholder.id, opts);
        typeStats[type].count++;
        typeStats[type].totalShares += shareholder.shares;
        typeStats[type].totalScore += Number(score);
        typeStats[type].avgOwnership += shareholder.ownership;
      } catch (error) {
        // Skip if error
      }
    }
    
    Object.entries(typeStats).forEach(([type, stats]) => {
      const avgScore = Math.round(stats.totalScore / stats.count);
      const avgOwnership = (stats.avgOwnership / stats.count).toFixed(1);
      const totalOwnership = ((stats.totalShares / 1000000000) * 100).toFixed(1); // Assuming 1B total shares
      
      console.log(`🏢 ${type}:`);
      console.log(`   Shareholders: ${stats.count}`);
      console.log(`   Total Ownership: ${totalOwnership}%`);
      console.log(`   Average Ownership: ${avgOwnership}%`);
      console.log(`   Average Governance Score: ${avgScore}`);
      
      const typeEngagement = avgScore >= 200 ? 'Highly Engaged' :
                            avgScore >= 100 ? 'Moderately Engaged' :
                            avgScore >= 50 ? 'Minimally Engaged' : 'Passive';
      console.log(`   Engagement Level: ${typeEngagement}\n`);
    });

    // Corporate governance insights
    console.log('🧠 Corporate Governance Insights:');
    
    const totalActivities = governanceActivities.length;
    const positiveActivities = governanceActivities.filter(a => governanceMetrics[a.activity]).length;
    const engagementRate = Math.round((positiveActivities / totalActivities) * 100);
    
    console.log(`• Total governance activities: ${totalActivities}`);
    console.log(`• Positive engagement rate: ${engagementRate}%`);
    console.log(`• Active proposals: ${governanceProposals.filter(p => p.status === 'active').length}`);
    console.log(`• Passed proposals: ${governanceProposals.filter(p => p.status === 'passed').length}`);
    
    // Calculate total voting power engaged
    const engagedShareholders = new Set(governanceActivities.map(a => a.shareholder));
    let totalEngagedOwnership = 0;
    
    for (const shareholderId of engagedShareholders) {
      const shareholder = shareholders.find(s => s.id === shareholderId);
      if (shareholder) {
        totalEngagedOwnership += shareholder.ownership;
      }
    }
    
    console.log(`• Voting power engaged: ${totalEngagedOwnership.toFixed(1)}%`);

    // Governance recommendations
    console.log('\n💡 Governance Enhancement Recommendations:');
    
    const passiveInvestors = [];
    for (const shareholder of shareholders) {
      try {
        const score = await getBalance(canisterId, shareholder.id, opts);
        if (Number(score) < 100 && shareholder.ownership >= 2) {
          passiveInvestors.push(shareholder.name);
        }
      } catch (error) {
        // Skip if error
      }
    }
    
    if (passiveInvestors.length > 0) {
      console.log(`• Engage passive large shareholders: ${passiveInvestors.join(', ')}`);
      console.log('• Implement shareholder engagement programs');
    }
    
    console.log('• Enhance proxy statement transparency');
    console.log('• Establish regular investor relations calls');
    console.log('• Consider virtual participation options for meetings');
    console.log('• Implement ESG reporting standards');
    console.log('• Strengthen board independence requirements');
    
    // Future governance initiatives
    console.log('\n🔮 Future Governance Initiatives:');
    console.log('• Digital voting platform implementation');
    console.log('• Real-time governance analytics dashboard');
    console.log('• Blockchain-based proxy voting system');
    console.log('• AI-powered governance risk assessment');
    console.log('• Stakeholder engagement scoring system');

  } catch (error) {
    console.error('❌ Shareholder governance system error:', error.message);
  }
}

shareholderGovernance();
