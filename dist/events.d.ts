import { type ClientOptions } from './client.js';
export interface ReputationEvent {
    type: 'award' | 'revoke' | 'decay' | 'topup' | 'config_change';
    canisterId: string;
    timestamp: number;
    data: any;
}
export declare class EventStream {
    private canisterId;
    private opts?;
    private lastTxId;
    private lastTopUpId;
    private listeners;
    private intervalId?;
    constructor(canisterId: string, opts?: ClientOptions);
    onEvent(callback: (event: ReputationEvent) => void): void;
    start(pollInterval?: number): Promise<void>;
    stop(): void;
    private poll;
    private emit;
}
export declare function createEventStream(canisterId: string, opts?: ClientOptions): EventStream;
export declare function setupWebhook(canisterId: string, webhookUrl: string, opts?: ClientOptions): Promise<EventStream>;
