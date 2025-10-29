#!/usr/bin/env node
// Supply Chain Quality & Compliance Tracking

import { awardRep, revokeRep, getBalance, getTransactionHistory, addTrustedAwarder } from 'repdao';
import { assessSystemHealth } from 'repdao/analytics';
import { identityFromPemFile } from 'repdao/identity';

async function supplyChainTracking() {
  console.log('🚛 Supply Chain Quality & Compliance Tracking\n');
  
  const canisterId = '<your-canister-id>';
  const identity = identityFromPemFile('~/.repdao/supply-chain-manager.pem');
  const opts = { identity, network: 'ic' };

  // Quality metrics and scoring
  const qualityMetrics = {
    'on_time_delivery': 50,
    'quality_inspection_pass': 75,
    'sustainability_compliance': 100,
    'safety_standards_met': 80,
    'cost_efficiency': 40,
    'customer_satisfaction': 60,
    'innovation_implementation': 120,
    'zero_defects': 150,
    'environmental_certification': 200,
    'supplier_audit_pass': 90
  };

  const penalties = {
    'late_delivery': -30,
    'quality_failure': -100,
    'safety_violation': -200,
    'compliance_breach': -150,
    'customer_complaint': -50,
    'environmental_violation': -250
  };

  // Supply chain participants
  const suppliers = [
    { id: '<supplier1-principal>', name: 'GreenTech Materials', type: 'Raw Materials', location: 'Germany' },
    { id: '<supplier2-principal>', name: 'Precision Manufacturing', type: 'Components', location: 'Japan' },
    { id: '<supplier3-principal>', name: 'EcoLogistics', type: 'Transportation', location: 'Netherlands' },
    { id: '<supplier4-principal>', name: 'QualityFirst Assembly', type: 'Manufacturing', location: 'South Korea' }
  ];

  // Simulate supply chain events
  const supplyChainEvents = [
    // Positive events
    { supplier: suppliers[0].id, event: 'environmental_certification', details: 'ISO 14001 certification renewed', batch: 'MT-2024-001' },
    { supplier: suppliers[1].id, event: 'zero_defects', details: 'Perfect quality record for Q3', batch: 'CP-2024-045' },
    { supplier: suppliers[2].id, event: 'on_time_delivery', details: 'Delivered 2 days early', batch: 'LG-2024-089' },
    { supplier: suppliers[3].id, event: 'quality_inspection_pass', details: '99.8% quality score', batch: 'AS-2024-123' },
    { supplier: suppliers[0].id, event: 'sustainability_compliance', details: 'Carbon neutral shipping', batch: 'MT-2024-002' },
    { supplier: suppliers[1].id, event: 'innovation_implementation', details: 'New AI quality control system', batch: 'CP-2024-046' },
    
    // Negative events
    { supplier: suppliers[2].id, event: 'late_delivery', details: 'Delayed due to weather', batch: 'LG-2024-090' },
    { supplier: suppliers[3].id, event: 'quality_failure', details: 'Batch failed final inspection', batch: 'AS-2024-124' },
    { supplier: suppliers[0].id, event: 'compliance_breach', details: 'Missing documentation', batch: 'MT-2024-003' }
  ];

  try {
    console.log('📊 Processing supply chain events...\n');

    // Process quality events
    for (const event of supplyChainEvents) {
      const supplier = suppliers.find(s => s.id === event.supplier);
      const isPositive = qualityMetrics[event.event] !== undefined;
      const points = isPositive ? qualityMetrics[event.event] : penalties[event.event];
      
      try {
        if (isPositive) {
          await awardRep(
            canisterId,
            event.supplier,
            BigInt(points),
            `Quality Achievement: ${event.event} - ${event.details} (Batch: ${event.batch})`,
            opts
          );
          console.log(`✅ ${supplier?.name}: +${points} points for ${event.event}`);
        } else {
          await revokeRep(
            canisterId,
            event.supplier,
            BigInt(Math.abs(points)),
            `Quality Issue: ${event.event} - ${event.details} (Batch: ${event.batch})`,
            opts
          );
          console.log(`❌ ${supplier?.name}: ${points} points for ${event.event}`);
        }
      } catch (error) {
        console.log(`⚠️  Failed to process event for ${supplier?.name}: ${error.message}`);
      }
    }

    // Generate supplier scorecards
    console.log('\n📋 Supplier Quality Scorecards:\n');
    
    for (const supplier of suppliers) {
      try {
        const score = await getBalance(canisterId, supplier.id, opts);
        
        console.log(`🏭 ${supplier.name}`);
        console.log(`   Type: ${supplier.type}`);
        console.log(`   Location: ${supplier.location}`);
        console.log(`   Quality Score: ${score} points`);
        
        // Quality rating
        const rating = Number(score) >= 400 ? 'Excellent (A+)' :
                      Number(score) >= 300 ? 'Good (A)' :
                      Number(score) >= 200 ? 'Satisfactory (B)' :
                      Number(score) >= 100 ? 'Needs Improvement (C)' : 'Critical (D)';
        
        console.log(`   Quality Rating: ${rating}`);
        
        // Risk assessment
        const riskLevel = Number(score) < 150 ? 'High Risk' :
                         Number(score) < 250 ? 'Medium Risk' : 'Low Risk';
        
        console.log(`   Risk Level: ${riskLevel}`);
        
        // Certification status
        const certified = Number(score) >= 200 ? '✅ Certified' : '❌ Under Review';
        console.log(`   Certification Status: ${certified}\n`);
        
      } catch (error) {
        console.log(`❌ Error getting scorecard for ${supplier.name}: ${error.message}\n`);
      }
    }

    // Supply chain health assessment
    console.log('🏥 Supply Chain Health Assessment:');
    
    try {
      const healthAssessment = await assessSystemHealth(canisterId, opts);
      console.log(`Overall Health Score: ${healthAssessment.score}/100`);
      console.log(`Status: ${healthAssessment.status.toUpperCase()}`);
      
      if (healthAssessment.issues.length > 0) {
        console.log('\nIssues Detected:');
        healthAssessment.issues.forEach(issue => console.log(`• ${issue}`));
      }
      
      if (healthAssessment.recommendations.length > 0) {
        console.log('\nRecommendations:');
        healthAssessment.recommendations.forEach(rec => console.log(`• ${rec}`));
      }
    } catch (error) {
      console.log('Unable to assess supply chain health at this time');
    }

    // Performance analytics
    console.log('\n📈 Supply Chain Analytics:');
    
    let totalPositiveEvents = 0;
    let totalNegativeEvents = 0;
    let totalQualityPoints = 0;
    
    for (const event of supplyChainEvents) {
      if (qualityMetrics[event.event]) {
        totalPositiveEvents++;
        totalQualityPoints += qualityMetrics[event.event];
      } else {
        totalNegativeEvents++;
      }
    }
    
    const qualityRate = Math.round((totalPositiveEvents / supplyChainEvents.length) * 100);
    const avgQualityPoints = Math.round(totalQualityPoints / totalPositiveEvents);
    
    console.log(`• Total events processed: ${supplyChainEvents.length}`);
    console.log(`• Quality achievement rate: ${qualityRate}%`);
    console.log(`• Quality issues: ${totalNegativeEvents}`);
    console.log(`• Average quality points per achievement: ${avgQualityPoints}`);
    
    // Supplier type performance
    console.log('\n🏭 Performance by Supplier Type:');
    
    const typePerformance = {};
    
    for (const supplier of suppliers) {
      if (!typePerformance[supplier.type]) {
        typePerformance[supplier.type] = { suppliers: 0, totalScore: 0 };
      }
      
      try {
        const score = await getBalance(canisterId, supplier.id, opts);
        typePerformance[supplier.type].suppliers++;
        typePerformance[supplier.type].totalScore += Number(score);
      } catch (error) {
        // Skip if error
      }
    }
    
    Object.entries(typePerformance).forEach(([type, perf]) => {
      const avgScore = Math.round(perf.totalScore / perf.suppliers);
      console.log(`• ${type}: ${avgScore} avg score (${perf.suppliers} suppliers)`);
    });

    // Compliance recommendations
    console.log('\n💡 Compliance Recommendations:');
    
    const lowPerformers = [];
    for (const supplier of suppliers) {
      try {
        const score = await getBalance(canisterId, supplier.id, opts);
        if (Number(score) < 200) {
          lowPerformers.push(supplier.name);
        }
      } catch (error) {
        // Skip if error
      }
    }
    
    if (lowPerformers.length > 0) {
      console.log(`• Review contracts with underperforming suppliers: ${lowPerformers.join(', ')}`);
      console.log('• Implement additional quality control measures');
      console.log('• Consider supplier development programs');
    } else {
      console.log('• All suppliers meeting quality standards');
      console.log('• Consider expanding partnerships with top performers');
    }
    
    console.log('• Regular audit schedule recommended');
    console.log('• Implement real-time quality monitoring');

  } catch (error) {
    console.error('❌ Supply chain tracking error:', error.message);
  }
}

supplyChainTracking();
