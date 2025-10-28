// Real-time event streaming and notifications
import { invokeQuery } from './client.js';
export class EventStream {
    constructor(canisterId, opts) {
        this.lastTxId = 0;
        this.lastTopUpId = 0;
        this.listeners = [];
        this.canisterId = canisterId;
        this.opts = opts;
    }
    onEvent(callback) {
        this.listeners.push(callback);
    }
    async start(pollInterval = 5000) {
        console.log(`🎧 Starting event stream for ${this.canisterId}`);
        // Get initial state
        const [txCount, topUpCount] = await Promise.all([
            invokeQuery(this.canisterId, 'getTransactionCount', [], this.opts),
            invokeQuery(this.canisterId, 'getTopUpCount', [], this.opts)
        ]);
        this.lastTxId = Number(txCount);
        this.lastTopUpId = Number(topUpCount);
        this.intervalId = setInterval(async () => {
            await this.poll();
        }, pollInterval);
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            console.log('🛑 Event stream stopped');
        }
    }
    async poll() {
        try {
            // Check for new transactions
            const txCount = Number(await invokeQuery(this.canisterId, 'getTransactionCount', [], this.opts));
            if (txCount > this.lastTxId) {
                const newTxs = await invokeQuery(this.canisterId, 'getTransactionsPaged', [BigInt(this.lastTxId), BigInt(txCount - this.lastTxId)], this.opts);
                for (const tx of newTxs) {
                    const eventType = tx.transactionType.Award ? 'award' :
                        tx.transactionType.Revoke ? 'revoke' : 'decay';
                    this.emit({
                        type: eventType,
                        canisterId: this.canisterId,
                        timestamp: Number(tx.timestamp),
                        data: tx
                    });
                }
                this.lastTxId = txCount;
            }
            // Check for new top-ups
            const topUpCount = Number(await invokeQuery(this.canisterId, 'getTopUpCount', [], this.opts));
            if (topUpCount > this.lastTopUpId) {
                const newTopUps = await invokeQuery(this.canisterId, 'getTopUpsPaged', [BigInt(this.lastTopUpId), BigInt(topUpCount - this.lastTopUpId)], this.opts);
                for (const topUp of newTopUps) {
                    this.emit({
                        type: 'topup',
                        canisterId: this.canisterId,
                        timestamp: Number(topUp.timestamp),
                        data: topUp
                    });
                }
                this.lastTopUpId = topUpCount;
            }
        }
        catch (e) {
            console.error('Event polling failed:', e);
        }
    }
    emit(event) {
        this.listeners.forEach(callback => {
            try {
                callback(event);
            }
            catch (e) {
                console.error('Event listener error:', e);
            }
        });
    }
}
export function createEventStream(canisterId, opts) {
    return new EventStream(canisterId, opts);
}
// Webhook integration
export async function setupWebhook(canisterId, webhookUrl, opts) {
    const stream = createEventStream(canisterId, opts);
    stream.onEvent(async (event) => {
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
        }
        catch (e) {
            console.error('Webhook delivery failed:', e);
        }
    });
    return stream;
}
