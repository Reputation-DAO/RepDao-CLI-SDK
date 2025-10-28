import { type ClientOptions } from './client.js';
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
    score: number;
}
export declare function getCanisterMetrics(cid: string, opts?: ClientOptions): Promise<CanisterMetrics>;
export declare function analyzeUserComplete(cid: string, user: string, opts?: ClientOptions): Promise<UserAnalytics>;
export declare function assessSystemHealth(cid: string, opts?: ClientOptions): Promise<SystemHealth>;
export declare function predictDecay(cid: string, user: string, days: number, opts?: ClientOptions): Promise<{
    currentBalance: bigint;
    projectedBalance: bigint;
    totalDecay: bigint;
    daysUntilZero: number | null;
}>;
