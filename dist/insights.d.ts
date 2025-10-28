import { type ClientOptions } from './client.js';
export interface Insight {
    type: 'optimization' | 'warning' | 'opportunity' | 'trend';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
    recommendation?: string;
}
export declare function generateInsights(canisterId: string, opts?: ClientOptions): Promise<Insight[]>;
export declare function analyzeUserBehavior(canisterId: string, userPrincipal: string, opts?: ClientOptions): Promise<{
    analysis: import("./analytics.js").UserAnalytics;
    insights: Insight[];
}>;
export declare function prioritizeInsights(insights: Insight[]): Insight[];
