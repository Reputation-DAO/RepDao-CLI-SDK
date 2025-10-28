// Advanced analytics and monitoring for RepDAO
import { invokeQuery } from './client.js';
export async function getCanisterMetrics(cid, opts) {
    const [health, decayStats, version] = await Promise.all([
        invokeQuery(cid, 'health', [], opts),
        invokeQuery(cid, 'getDecayStatistics', [], opts),
        invokeQuery(cid, 'version', [], opts)
    ]);
    return {
        health: health,
        cycles: BigInt(health.cycles),
        users: Number(health.users),
        transactions: Number(health.txCount),
        topUps: Number(health.topUpCount),
        decayStats: decayStats,
        version: version
    };
}
export async function analyzeUserComplete(cid, user, opts) {
    const [balance, stats, decayInfo, transactions, awarderBreakdown] = await Promise.all([
        invokeQuery(cid, 'getBalance', [user], opts),
        invokeQuery(cid, 'myStats', [user], opts),
        invokeQuery(cid, 'getUserDecayInfo', [user], opts),
        invokeQuery(cid, 'getTransactionsByUser', [user], opts),
        invokeQuery(cid, 'awarderStats', [user], opts)
    ]);
    return {
        balance: BigInt(balance),
        stats: stats,
        decayInfo: decayInfo,
        transactions: transactions,
        awarderBreakdown: awarderBreakdown
    };
}
export async function assessSystemHealth(cid, opts) {
    const metrics = await getCanisterMetrics(cid, opts);
    const issues = [];
    const recommendations = [];
    let score = 100;
    // Cycles check
    const cyclesT = Number(metrics.cycles) / 1e12;
    if (cyclesT < 0.5) {
        issues.push('Critical: Very low cycles balance');
        recommendations.push('Top up cycles immediately');
        score -= 40;
    }
    else if (cyclesT < 2) {
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
export async function predictDecay(cid, user, days, opts) {
    const [balance, decayAmount, config] = await Promise.all([
        invokeQuery(cid, 'getBalance', [user], opts),
        invokeQuery(cid, 'previewDecayAmount', [user], opts),
        invokeQuery(cid, 'getDecayConfig', [], opts)
    ]);
    const currentBalance = BigInt(balance);
    const dailyDecay = BigInt(decayAmount);
    const totalDecay = dailyDecay * BigInt(days);
    const projectedBalance = currentBalance >= totalDecay ? currentBalance - totalDecay : 0n;
    let daysUntilZero = null;
    if (dailyDecay > 0n) {
        daysUntilZero = Number(currentBalance / dailyDecay);
    }
    return { currentBalance, projectedBalance, totalDecay, daysUntilZero };
}
