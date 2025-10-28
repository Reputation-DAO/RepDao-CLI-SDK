// AI-powered insights and recommendations
import { getCanisterMetrics, analyzeUserComplete } from './analytics.js';
import { type ClientOptions } from './client.js';

export interface Insight {
  type: 'optimization' | 'warning' | 'opportunity' | 'trend';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendation?: string;
}

export async function generateInsights(canisterId: string, opts?: ClientOptions): Promise<Insight[]> {
  const metrics = await getCanisterMetrics(canisterId, opts);
  const insights: Insight[] = [];

  // Cycles optimization
  const cyclesT = Number(metrics.cycles) / 1e12;
  if (cyclesT > 10) {
    insights.push({
      type: 'optimization',
      title: 'Excess Cycles Detected',
      description: `Canister has ${cyclesT.toFixed(1)}T cycles, which is more than needed for normal operation.`,
      impact: 'medium',
      actionable: true,
      recommendation: 'Consider withdrawing excess cycles or redistributing to other canisters.'
    });
  }

  // Activity patterns
  const txPerUser = metrics.users > 0 ? metrics.transactions / metrics.users : 0;
  if (txPerUser < 2) {
    insights.push({
      type: 'opportunity',
      title: 'Low User Engagement',
      description: `Average ${txPerUser.toFixed(1)} transactions per user suggests low engagement.`,
      impact: 'high',
      actionable: true,
      recommendation: 'Consider implementing engagement campaigns or reducing barriers to participation.'
    });
  }

  // Decay analysis
  if (metrics.decayStats.configEnabled && metrics.decayStats.totalDecayedPoints > 0) {
    const decayRate = metrics.decayStats.totalDecayedPoints / Math.max(metrics.transactions, 1);
    if (decayRate > 0.1) {
      insights.push({
        type: 'warning',
        title: 'High Decay Rate',
        description: `${(decayRate * 100).toFixed(1)}% of points are being decayed, which may discourage participation.`,
        impact: 'high',
        actionable: true,
        recommendation: 'Review decay configuration - consider reducing decay rate or increasing grace period.'
      });
    }
  }

  // Growth trends
  if (metrics.users > 100 && metrics.transactions > 1000) {
    insights.push({
      type: 'trend',
      title: 'Healthy Growth Pattern',
      description: `Strong adoption with ${metrics.users} users and ${metrics.transactions} transactions.`,
      impact: 'high',
      actionable: false
    });
  }

  // Version check
  if (metrics.version !== '1.0.1') {
    insights.push({
      type: 'warning',
      title: 'Outdated Version',
      description: `Running version ${metrics.version}, latest is 1.0.1.`,
      impact: 'medium',
      actionable: true,
      recommendation: 'Consider upgrading to the latest version for bug fixes and new features.'
    });
  }

  return insights;
}

export async function analyzeUserBehavior(canisterId: string, userPrincipal: string, opts?: ClientOptions) {
  const analysis = await analyzeUserComplete(canisterId, userPrincipal, opts);
  const insights: Insight[] = [];

  // Engagement analysis
  const avgAwardSize = analysis.awarderBreakdown.length > 0 
    ? analysis.awarderBreakdown.reduce((sum, a) => sum + Number(a.total), 0) / analysis.awarderBreakdown.length
    : 0;

  if (avgAwardSize > 100) {
    insights.push({
      type: 'trend',
      title: 'High-Value Contributor',
      description: `User receives average awards of ${avgAwardSize.toFixed(0)} points, indicating high-quality contributions.`,
      impact: 'high',
      actionable: false
    });
  }

  // Decay risk
  const decayRisk = Number(analysis.stats.totalDecayed) / Math.max(Number(analysis.balance), 1);
  if (decayRisk > 0.3) {
    insights.push({
      type: 'warning',
      title: 'High Decay Risk',
      description: `User has lost ${(decayRisk * 100).toFixed(1)}% of points to decay.`,
      impact: 'medium',
      actionable: true,
      recommendation: 'Encourage more frequent activity to reduce decay impact.'
    });
  }

  // Diversification
  if (analysis.awarderBreakdown.length === 1) {
    insights.push({
      type: 'opportunity',
      title: 'Single Source Dependency',
      description: 'User receives points from only one awarder, creating dependency risk.',
      impact: 'medium',
      actionable: true,
      recommendation: 'Encourage participation in diverse activities to reduce single-point-of-failure risk.'
    });
  }

  return { analysis, insights };
}

export function prioritizeInsights(insights: Insight[]): Insight[] {
  const priority = { high: 3, medium: 2, low: 1 };
  const typeWeight = { warning: 4, optimization: 3, opportunity: 2, trend: 1 };
  
  return insights.sort((a, b) => {
    const scoreA = priority[a.impact] * typeWeight[a.type] + (a.actionable ? 1 : 0);
    const scoreB = priority[b.impact] * typeWeight[b.type] + (b.actionable ? 1 : 0);
    return scoreB - scoreA;
  });
}
