#!/usr/bin/env node
// Investment Trust & Portfolio Management System

import { awardRep, revokeRep, getBalance, myStats, leaderboard } from 'repdao';
import { predictDecay, analyzeUserComplete } from 'repdao/analytics';
import { identityFromPemFile } from 'repdao/identity';

async function investmentTrustManagement() {
  console.log('📈 Investment Trust & Portfolio Management System\n');
  
  const canisterId = '<your-canister-id>';
  const identity = identityFromPemFile('~/.repdao/trust-manager.pem');
  const opts = { identity, network: 'ic' };

  // Investment performance metrics and scoring
  const performanceMetrics = {
    'alpha_generation': 200,        // Outperforming benchmark
    'risk_management': 150,         // Effective risk control
    'dividend_growth': 100,         // Consistent dividend increases
    'esg_compliance': 120,          // ESG investment criteria
    'client_satisfaction': 80,      // Client feedback scores
    'research_quality': 90,         // Investment research depth
    'portfolio_diversification': 70, // Risk distribution
    'cost_efficiency': 60,          // Low expense ratios
    'liquidity_management': 50,     // Cash flow optimization
    'regulatory_compliance': 100,   // Regulatory adherence
    'innovation_adoption': 110,     // New investment strategies
    'market_timing': 180           // Strategic entry/exit timing
  };

  const performancePenalties = {
    'underperformance': -100,       // Below benchmark returns
    'excessive_risk': -150,         // Risk limits exceeded
    'compliance_violation': -200,   // Regulatory breaches
    'client_complaint': -80,        // Client dissatisfaction
    'liquidity_crisis': -120,       // Cash flow issues
    'concentration_risk': -90       // Over-concentration in assets
  };

  // Trust participants
  const trustees = [
    { id: '<trustee1-principal>', name: 'Goldman Sachs Asset Management', type: 'Investment Manager', aum: 2500000000 },
    { id: '<trustee2-principal>', name: 'Vanguard Trust Services', type: 'Index Fund Manager', aum: 8700000000 },
    { id: '<trustee3-principal>', name: 'BlackRock Institutional', type: 'ETF Manager', aum: 10200000000 },
    { id: '<trustee4-principal>', name: 'Fidelity Investments', type: 'Mutual Fund Manager', aum: 4300000000 },
    { id: '<advisor1-principal>', name: 'Morgan Stanley Wealth', type: 'Financial Advisor', aum: 850000000 }
  ];

  // Investment portfolios
  const portfolios = [
    { id: 'GROWTH-2024-001', manager: trustees[0].id, strategy: 'Growth', value: 500000000, benchmark: 'S&P 500' },
    { id: 'INCOME-2024-002', manager: trustees[1].id, strategy: 'Income', value: 750000000, benchmark: 'Bond Index' },
    { id: 'BALANCED-2024-003', manager: trustees[2].id, strategy: 'Balanced', value: 1200000000, benchmark: '60/40 Mix' },
    { id: 'ESG-2024-004', manager: trustees[3].id, strategy: 'ESG', value: 300000000, benchmark: 'ESG Index' },
    { id: 'TECH-2024-005', manager: trustees[4].id, strategy: 'Technology', value: 200000000, benchmark: 'NASDAQ' }
  ];

  // Simulate investment performance events
  const performanceEvents = [
    // Positive performance
    { manager: trustees[0].id, event: 'alpha_generation', details: 'Generated 3.2% alpha vs S&P 500', portfolio: 'GROWTH-2024-001', value: 16000000 },
    { manager: trustees[1].id, event: 'dividend_growth', details: 'Increased dividend yield to 4.8%', portfolio: 'INCOME-2024-002', value: 36000000 },
    { manager: trustees[2].id, event: 'risk_management', details: 'Reduced portfolio volatility by 15%', portfolio: 'BALANCED-2024-003', value: 0 },
    { manager: trustees[3].id, event: 'esg_compliance', details: 'Achieved top ESG rating', portfolio: 'ESG-2024-004', value: 0 },
    { manager: trustees[4].id, event: 'market_timing', details: 'Strategic tech sector rebalancing', portfolio: 'TECH-2024-005', value: 8000000 },
    { manager: trustees[0].id, event: 'research_quality', details: 'Published award-winning market analysis', portfolio: 'GROWTH-2024-001', value: 0 },
    { manager: trustees[1].id, event: 'cost_efficiency', details: 'Reduced expense ratio to 0.05%', portfolio: 'INCOME-2024-002', value: 3750000 },
    { manager: trustees[2].id, event: 'client_satisfaction', details: '98% client retention rate', portfolio: 'BALANCED-2024-003', value: 0 },
    
    // Performance issues
    { manager: trustees[3].id, event: 'underperformance', details: 'Lagged benchmark by 1.8%', portfolio: 'ESG-2024-004', value: -5400000 },
    { manager: trustees[4].id, event: 'concentration_risk', details: 'Over-weighted in single tech stock', portfolio: 'TECH-2024-005', value: 0 },
    { manager: trustees[0].id, event: 'client_complaint', details: 'Client concerns about risk exposure', portfolio: 'GROWTH-2024-001', value: 0 }
  ];

  try {
    console.log('💼 Processing investment performance events...\n');

    // Process performance events
    for (const event of performanceEvents) {
      const manager = trustees.find(t => t.id === event.manager);
      const portfolio = portfolios.find(p => p.id === event.portfolio);
      const isPositive = performanceMetrics[event.event] !== undefined;
      const points = isPositive ? performanceMetrics[event.event] : performancePenalties[event.event];
      
      try {
        if (isPositive) {
          await awardRep(
            canisterId,
            event.manager,
            BigInt(points),
            `Investment Performance: ${event.event} - ${event.details} (Portfolio: ${event.portfolio})`,
            opts
          );
          console.log(`📈 ${manager?.name}: +${points} points for ${event.event}`);
        } else {
          await revokeRep(
            canisterId,
            event.manager,
            BigInt(Math.abs(points)),
            `Performance Issue: ${event.event} - ${event.details} (Portfolio: ${event.portfolio})`,
            opts
          );
          console.log(`📉 ${manager?.name}: ${points} points for ${event.event}`);
        }
        
        if (event.value !== 0) {
          const valueChange = event.value > 0 ? `+$${(event.value / 1000000).toFixed(1)}M` : `-$${Math.abs(event.value / 1000000).toFixed(1)}M`;
          console.log(`   Portfolio Impact: ${valueChange} (${portfolio?.strategy} Strategy)`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to process event for ${manager?.name}: ${error.message}`);
      }
    }

    // Generate trustee performance reports
    console.log('\n📊 Trustee Performance Reports:\n');
    
    for (const trustee of trustees) {
      try {
        const score = await getBalance(canisterId, trustee.id, opts);
        const stats = await myStats(canisterId, trustee.id, opts);
        
        console.log(`🏦 ${trustee.name}`);
        console.log(`   Type: ${trustee.type}`);
        console.log(`   Assets Under Management: $${(trustee.aum / 1000000000).toFixed(1)}B`);
        console.log(`   Performance Score: ${score} points`);
        console.log(`   Career Performance: ${stats.lifetimeAwarded} points`);
        
        // Calculate performance metrics
        const performanceRating = Number(score) >= 500 ? 'Exceptional (AAA)' :
                                 Number(score) >= 350 ? 'Excellent (AA)' :
                                 Number(score) >= 200 ? 'Good (A)' :
                                 Number(score) >= 100 ? 'Satisfactory (BBB)' : 'Below Standard (BB)';
        
        console.log(`   Investment Rating: ${performanceRating}`);
        
        // Fee tier based on performance
        const feeTier = Number(score) >= 400 ? '0.25% (Premium)' :
                       Number(score) >= 250 ? '0.50% (Standard)' :
                       Number(score) >= 150 ? '0.75% (Basic)' : '1.00% (Probationary)';
        
        console.log(`   Management Fee Tier: ${feeTier}`);
        
        // Trustee status
        if (Number(score) >= 400) {
          console.log(`   🌟 Elite Trustee - Qualified for institutional mandates`);
        } else if (Number(score) >= 250) {
          console.log(`   ⭐ Preferred Trustee - Eligible for premium clients`);
        } else if (Number(score) < 100) {
          console.log(`   ⚠️  Under Review - Performance improvement required`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`❌ Error generating report for ${trustee.name}: ${error.message}\n`);
      }
    }

    // Investment performance leaderboard
    console.log('🏆 Investment Performance Leaderboard:');
    const perfLeaders = await leaderboard(canisterId, 10n, 0n, opts);
    
    perfLeaders.forEach(([principal, points], i) => {
      const trustee = trustees.find(t => t.id === principal.toString());
      const rank = i + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📊';
      
      if (trustee) {
        const aum = `$${(trustee.aum / 1000000000).toFixed(1)}B AUM`;
        console.log(`${medal} #${rank}: ${trustee.name} - ${points} points (${aum})`);
      } else {
        console.log(`${medal} #${rank}: ${principal.toString().slice(0, 12)}... - ${points} points`);
      }
    });

    // Portfolio strategy analysis
    console.log('\n📈 Portfolio Strategy Performance:');
    
    const strategyStats = {};
    
    for (const portfolio of portfolios) {
      const strategy = portfolio.strategy;
      if (!strategyStats[strategy]) {
        strategyStats[strategy] = { portfolios: 0, totalValue: 0, managers: new Set() };
      }
      
      strategyStats[strategy].portfolios++;
      strategyStats[strategy].totalValue += portfolio.value;
      strategyStats[strategy].managers.add(portfolio.manager);
    }
    
    Object.entries(strategyStats).forEach(([strategy, stats]) => {
      const avgValue = stats.totalValue / stats.portfolios;
      const totalValueB = (stats.totalValue / 1000000000).toFixed(1);
      
      console.log(`💼 ${strategy} Strategy:`);
      console.log(`   Portfolios: ${stats.portfolios}`);
      console.log(`   Total Value: $${totalValueB}B`);
      console.log(`   Average Portfolio Size: $${(avgValue / 1000000).toFixed(0)}M`);
      console.log(`   Active Managers: ${stats.managers.size}`);
    });

    // Risk and compliance analysis
    console.log('\n🛡️  Risk & Compliance Analysis:');
    
    const riskEvents = performanceEvents.filter(e => 
      ['risk_management', 'regulatory_compliance', 'liquidity_management'].includes(e.event) ||
      ['excessive_risk', 'compliance_violation', 'liquidity_crisis'].includes(e.event)
    );
    
    const positiveRisk = riskEvents.filter(e => performanceMetrics[e.event]).length;
    const negativeRisk = riskEvents.filter(e => performancePenalties[e.event]).length;
    const complianceRate = Math.round((positiveRisk / riskEvents.length) * 100);
    
    console.log(`• Risk management events: ${riskEvents.length}`);
    console.log(`• Positive risk outcomes: ${positiveRisk}`);
    console.log(`• Risk violations: ${negativeRisk}`);
    console.log(`• Overall compliance rate: ${complianceRate}%`);

    // Investment insights and recommendations
    console.log('\n💡 Investment Management Recommendations:');
    
    const totalAUM = trustees.reduce((sum, t) => sum + t.aum, 0);
    const avgPerformance = perfLeaders.length > 0 ? 
      perfLeaders.reduce((sum, [_, points]) => sum + Number(points), 0) / perfLeaders.length : 0;
    
    console.log(`• Total Assets Under Management: $${(totalAUM / 1000000000).toFixed(1)}B`);
    console.log(`• Average trustee performance: ${Math.round(avgPerformance)} points`);
    
    const underperformers = [];
    for (const trustee of trustees) {
      try {
        const score = await getBalance(canisterId, trustee.id, opts);
        if (Number(score) < 200) {
          underperformers.push(trustee.name);
        }
      } catch (error) {
        // Skip if error
      }
    }
    
    if (underperformers.length > 0) {
      console.log(`• Review mandates for underperforming trustees: ${underperformers.join(', ')}`);
      console.log('• Implement enhanced risk monitoring');
      console.log('• Consider fee adjustments based on performance');
    } else {
      console.log('• All trustees meeting performance standards');
      console.log('• Consider expanding AUM with top performers');
    }
    
    console.log('• Regular portfolio rebalancing recommended');
    console.log('• ESG integration opportunities identified');
    console.log('• Technology adoption for enhanced analytics');

    // Market outlook and strategy
    console.log('\n🔮 Market Outlook & Strategic Recommendations:');
    
    const growthPortfolios = portfolios.filter(p => p.strategy === 'Growth').length;
    const incomePortfolios = portfolios.filter(p => p.strategy === 'Income').length;
    const esgPortfolios = portfolios.filter(p => p.strategy === 'ESG').length;
    
    console.log(`• Portfolio allocation: ${growthPortfolios} Growth, ${incomePortfolios} Income, ${esgPortfolios} ESG`);
    console.log('• Consider increasing ESG allocation for future mandates');
    console.log('• Technology sector showing strong performance');
    console.log('• Diversification across asset classes recommended');
    console.log('• Monitor interest rate sensitivity in fixed income portfolios');

  } catch (error) {
    console.error('❌ Investment trust management error:', error.message);
  }
}

investmentTrustManagement();
