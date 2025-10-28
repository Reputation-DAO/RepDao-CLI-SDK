// Advanced analytics and monitoring for RepDAO
import { invokeQuery, invokeUpdate, type ClientOptions } from './client.js';

export interface CanisterMetrics {
  health: any;
  cycles: bigint;
  users: number;
  transactions: number;
  topUps: number;
  decayStats: any;
  version: string;
}

export interface UserAnalytics {
  balance: bigint;
  stats: any;
  decayInfo: any;
  transactions: any[];
  awarderBreakdown: any[];
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

export async function getCanisterMetrics(cid: string, opts?: ClientOptions): Promise<CanisterMetrics> {
  const [health, decayStats, version] = await Promise.all([
    invokeQuery(cid, 'health', [], opts),
    invokeQuery(cid, 'getDecayStatistics', [], opts),
    invokeQuery(cid, 'version', [], opts)
  ]);

  return {
    health: health as any,
    cycles: BigInt((health as any).cycles),
    users: Number((health as any).users),
    transactions: Number((health as any).txCount),
    topUps: Number((health as any).topUpCount),
    decayStats: decayStats as any,
    version: version as string
  };
}

export async function analyzeUserComplete(cid: string, user: string, opts?: ClientOptions): Promise<UserAnalytics> {
  const [balance, stats, decayInfo, transactions, awarderBreakdown] = await Promise.all([
    invokeQuery(cid, 'getBalance', [user], opts),
    invokeQuery(cid, 'myStats', [user], opts),
    invokeQuery(cid, 'getUserDecayInfo', [user], opts),
    invokeQuery(cid, 'getTransactionsByUser', [user], opts),
    invokeQuery(cid, 'awarderStats', [user], opts)
  ]);

  return {
    balance: BigInt(balance as bigint),
    stats: stats as any,
    decayInfo: decayInfo as any,
    transactions: transactions as any[],
    awarderBreakdown: awarderBreakdown as any[]
  };
}

export async function assessSystemHealth(cid: string, opts?: ClientOptions): Promise<SystemHealth> {
  const metrics = await getCanisterMetrics(cid, opts);
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Cycles check
  const cyclesT = Number(metrics.cycles) / 1e12;
  if (cyclesT < 0.5) {
    issues.push('Critical: Very low cycles balance');
    recommendations.push('Top up cycles immediately');
    score -= 40;
  } else if (cyclesT < 2) {
    issues.push('Warning: Low cycles balance');
    recommendations.push('Consider topping up cycles soon');
    score -= 15;
  }

  // Paused check
  if (metrics.health.paused) {
    issues.push('Critical: Canister is paused');
    recommendations.push('Unpause canister to resume operations');
    score -= 30;
  }

  // Activity check
  if (metrics.transactions === 0) {
    issues.push('Warning: No transactions recorded');
    recommendations.push('Verify canister is properly configured');
    score -= 10;
  }

  // Decay check
  if (metrics.decayStats.configEnabled && metrics.decayStats.lastGlobalDecayProcess === 0) {
    issues.push('Info: Decay enabled but never processed');
    recommendations.push('Consider running processBatchDecay');
    score -= 5;
  }

  const status = score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical';

  return { status, issues, recommendations, score };
}

export async function predictDecay(cid: string, user: string, days: number, opts?: ClientOptions): Promise<{
  currentBalance: bigint;
  projectedBalance: bigint;
  totalDecay: bigint;
  daysUntilZero: number | null;
}> {
  const [balance, decayAmount, config] = await Promise.all([
    invokeQuery(cid, 'getBalance', [user], opts),
    invokeQuery(cid, 'previewDecayAmount', [user], opts),
    invokeQuery(cid, 'getDecayConfig', [], opts)
  ]);

  const currentBalance = BigInt(balance as bigint);
  const dailyDecay = BigInt(decayAmount as bigint);
  const totalDecay = dailyDecay * BigInt(days);
  const projectedBalance = currentBalance >= totalDecay ? currentBalance - totalDecay : 0n;
  
  let daysUntilZero: number | null = null;
  if (dailyDecay > 0n) {
    daysUntilZero = Number(currentBalance / dailyDecay);
  }

  return { currentBalance, projectedBalance, totalDecay, daysUntilZero };
}
