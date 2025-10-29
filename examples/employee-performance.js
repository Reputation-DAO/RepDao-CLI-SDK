#!/usr/bin/env node
// Employee Performance Management System

import { awardRep, revokeRep, getBalance, myStats, configureDecay } from 'repdao';
import { generateInsights, analyzeUserBehavior } from 'repdao/insights';
import { identityFromPemFile } from 'repdao/identity';

async function employeePerformanceSystem() {
  console.log('👔 Employee Performance Management System\n');
  
  const canisterId = '<your-canister-id>';
  const identity = identityFromPemFile('~/.repdao/hr-manager.pem');
  const opts = { identity, network: 'ic' };

  // Performance metrics and point values
  const performanceMetrics = {
    'project_completion': 200,
    'deadline_met': 100,
    'quality_excellence': 150,
    'team_collaboration': 75,
    'innovation': 300,
    'mentoring': 100,
    'client_satisfaction': 250,
    'process_improvement': 180
  };

  const employees = [
    { id: '<employee1-principal>', name: 'Alice Johnson', department: 'Engineering' },
    { id: '<employee2-principal>', name: 'Bob Smith', department: 'Design' },
    { id: '<employee3-principal>', name: 'Carol Davis', department: 'Marketing' }
  ];

  try {
    // Configure decay for performance tracking (quarterly review cycle)
    console.log('⚙️ Configuring quarterly performance decay...');
    await configureDecay(
      canisterId,
      250,        // 2.5% decay rate
      7776000,    // 90 days in seconds
      50,         // minimum 50 points threshold
      604800,     // 7 days grace period
      true        // enable decay
    );

    // Simulate performance evaluations
    const evaluations = [
      { employee: employees[0].id, metric: 'project_completion', note: 'Delivered mobile app on time' },
      { employee: employees[0].id, metric: 'innovation', note: 'Implemented AI-powered feature' },
      { employee: employees[1].id, metric: 'quality_excellence', note: 'Zero bugs in last release' },
      { employee: employees[1].id, metric: 'team_collaboration', note: 'Led cross-team initiative' },
      { employee: employees[2].id, metric: 'client_satisfaction', note: '98% customer satisfaction score' },
      { employee: employees[2].id, metric: 'mentoring', note: 'Trained 3 new team members' }
    ];

    console.log('📊 Processing performance evaluations...\n');

    // Award performance points
    for (const evaluation of evaluations) {
      const points = performanceMetrics[evaluation.metric];
      
      try {
        await awardRep(
          canisterId,
          evaluation.employee,
          BigInt(points),
          `Performance: ${evaluation.metric} - ${evaluation.note}`,
          opts
        );
        
        const employeeName = employees.find(e => e.id === evaluation.employee)?.name || 'Unknown';
        console.log(`✅ ${employeeName}: +${points} points for ${evaluation.metric}`);
      } catch (error) {
        console.log(`❌ Failed to award points: ${error.message}`);
      }
    }

    // Generate performance reports
    console.log('\n📈 Performance Reports:\n');
    
    for (const employee of employees) {
      try {
        const balance = await getBalance(canisterId, employee.id, opts);
        const stats = await myStats(canisterId, employee.id, opts);
        
        console.log(`👤 ${employee.name} (${employee.department})`);
        console.log(`   Current Performance Score: ${balance} points`);
        console.log(`   Lifetime Achievements: ${stats.lifetimeAwarded} points`);
        console.log(`   Performance Adjustments: ${stats.lifetimeRevoked} points`);
        console.log(`   Last Activity: ${new Date(Number(stats.lastActivity) * 1000).toLocaleDateString()}`);
        
        // Performance tier
        const tier = Number(balance) >= 500 ? 'Exceptional' :
                    Number(balance) >= 300 ? 'Exceeds Expectations' :
                    Number(balance) >= 200 ? 'Meets Expectations' :
                    Number(balance) >= 100 ? 'Developing' : 'Needs Improvement';
        
        console.log(`   Performance Tier: ${tier}\n`);
        
      } catch (error) {
        console.log(`❌ Error getting stats for ${employee.name}: ${error.message}\n`);
      }
    }

    // Department performance summary
    console.log('🏢 Department Performance Summary:');
    const departments = [...new Set(employees.map(e => e.department))];
    
    for (const dept of departments) {
      const deptEmployees = employees.filter(e => e.department === dept);
      let totalPoints = 0;
      let employeeCount = 0;
      
      for (const emp of deptEmployees) {
        try {
          const balance = await getBalance(canisterId, emp.id, opts);
          totalPoints += Number(balance);
          employeeCount++;
        } catch (error) {
          // Skip if error
        }
      }
      
      const avgScore = employeeCount > 0 ? Math.round(totalPoints / employeeCount) : 0;
      console.log(`• ${dept}: ${avgScore} avg points (${employeeCount} employees)`);
    }

    // Performance insights
    console.log('\n🧠 Performance Insights:');
    try {
      const insights = await generateInsights(canisterId, opts);
      if (insights.length > 0) {
        insights.slice(0, 3).forEach(insight => {
          console.log(`• ${insight.title}: ${insight.description}`);
        });
      } else {
        console.log('• Performance system is operating optimally');
      }
    } catch (error) {
      console.log('• Unable to generate insights at this time');
    }

  } catch (error) {
    console.error('❌ Performance system error:', error.message);
  }
}

employeePerformanceSystem();
