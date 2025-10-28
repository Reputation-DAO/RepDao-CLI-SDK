import { type ClientOptions } from './client.js';
export interface MonitorConfig {
    canisterId: string;
    interval: number;
    alerts: {
        lowCycles: number;
        webhook?: string;
        email?: string;
    };
}
export declare class CanisterMonitor {
    private config;
    private opts?;
    private intervalId?;
    private lastStatus;
    constructor(config: MonitorConfig, opts?: ClientOptions);
    start(): Promise<void>;
    stop(): void;
    private check;
    private sendAlert;
}
export declare function createMonitor(canisterId: string, opts?: ClientOptions & {
    webhook?: string;
}): CanisterMonitor;
