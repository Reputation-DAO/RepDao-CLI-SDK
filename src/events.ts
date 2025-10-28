// Real-time event streaming and notifications
import { invokeQuery, type ClientOptions } from './client.js';

export interface ReputationEvent {
  type: 'award' | 'revoke' | 'decay' | 'topup' | 'config_change';
  canisterId: string;
  timestamp: number;
  data: any;
}

export class EventStream {
  private canisterId: string;
  private opts?: ClientOptions;
  private lastTxId = 0;
  private lastTopUpId = 0;
  private listeners: ((event: ReputationEvent) => void)[] = [];
  private intervalId?: NodeJS.Timeout;

  constructor(canisterId: string, opts?: ClientOptions) {
    this.canisterId = canisterId;
    this.opts = opts;
  }

  onEvent(callback: (event: ReputationEvent) => void) {
    this.listeners.push(callback);
  }

  async start(pollInterval = 5000) {
    console.log(`🎧 Starting event stream for ${this.canisterId}`);
    
    // Get initial state
    const [txCount, topUpCount] = await Promise.all([
      invokeQuery(this.canisterId, 'getTransactionCount', [], this.opts),
      invokeQuery(this.canisterId, 'getTopUpCount', [], this.opts)
    ]);
    
    this.lastTxId = Number(txCount as bigint);
    this.lastTopUpId = Number(topUpCount as bigint);
    
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

  private async poll() {
    try {
      // Check for new transactions
      const txCount = Number(await invokeQuery(this.canisterId, 'getTransactionCount', [], this.opts) as bigint);
      if (txCount > this.lastTxId) {
        const newTxs = await invokeQuery(this.canisterId, 'getTransactionsPaged', [BigInt(this.lastTxId), BigInt(txCount - this.lastTxId)], this.opts) as any[];
        
        for (const tx of newTxs) {
          const eventType = tx.transactionType.Award ? 'award' : 
                           tx.transactionType.Revoke ? 'revoke' : 'decay';
          
          this.emit({
            type: eventType as any,
            canisterId: this.canisterId,
            timestamp: Number(tx.timestamp),
            data: tx
          });
        }
        
        this.lastTxId = txCount;
      }

      // Check for new top-ups
      const topUpCount = Number(await invokeQuery(this.canisterId, 'getTopUpCount', [], this.opts) as bigint);
      if (topUpCount > this.lastTopUpId) {
        const newTopUps = await invokeQuery(this.canisterId, 'getTopUpsPaged', [BigInt(this.lastTopUpId), BigInt(topUpCount - this.lastTopUpId)], this.opts) as any[];
        
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
      
    } catch (e) {
      console.error('Event polling failed:', e);
    }
  }

  private emit(event: ReputationEvent) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error('Event listener error:', e);
      }
    });
  }
}

export function createEventStream(canisterId: string, opts?: ClientOptions) {
  return new EventStream(canisterId, opts);
}

// Webhook integration
export async function setupWebhook(canisterId: string, webhookUrl: string, opts?: ClientOptions) {
  const stream = createEventStream(canisterId, opts);
  
  stream.onEvent(async (event) => {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (e) {
      console.error('Webhook delivery failed:', e);
    }
  });
  
  return stream;
}
