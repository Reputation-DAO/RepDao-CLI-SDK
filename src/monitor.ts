// Real-time monitoring and alerting system
import { getCanisterMetrics, assessSystemHealth } from './analytics.js';
import { type ClientOptions } from './client.js';

export interface MonitorConfig {
  canisterId: string;
  interval: number; // seconds
  alerts: {
    lowCycles: number; // threshold in T cycles
    webhook?: string;
    email?: string;
  };
}

export class CanisterMonitor {
  private config: MonitorConfig;
  private opts?: ClientOptions;
  private intervalId?: NodeJS.Timeout;
  private lastStatus: any = {};

  constructor(config: MonitorConfig, opts?: ClientOptions) {
    this.config = config;
    this.opts = opts;
  }

  async start() {
    console.log(`🔍 Starting monitor for ${this.config.canisterId}`);
    
    this.intervalId = setInterval(async () => {
      try {
        await this.check();
      } catch (e) {
        console.error('Monitor check failed:', e);
      }
    }, this.config.interval * 1000);

    // Initial check
    await this.check();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('🛑 Monitor stopped');
    }
  }

  private async check() {
    const [metrics, health] = await Promise.all([
      getCanisterMetrics(this.config.canisterId, this.opts),
      assessSystemHealth(this.config.canisterId, this.opts)
    ]);

    const cyclesT = Number(metrics.cycles) / 1e12;
    const timestamp = new Date().toISOString();

    // Check for status changes
    if (health.status !== this.lastStatus.status) {
      console.log(`📊 [${timestamp}] Status changed: ${this.lastStatus.status} → ${health.status}`);
      this.lastStatus.status = health.status;
    }

    // Cycles alert
    if (cyclesT < this.config.alerts.lowCycles && this.lastStatus.cyclesAlerted !== true) {
      const alert = `🚨 LOW CYCLES ALERT: ${cyclesT.toFixed(2)}T cycles remaining`;
      console.log(`[${timestamp}] ${alert}`);
      await this.sendAlert(alert);
      this.lastStatus.cyclesAlerted = true;
    } else if (cyclesT >= this.config.alerts.lowCycles) {
      this.lastStatus.cyclesAlerted = false;
    }

    // Health issues
    if (health.issues.length > 0) {
      console.log(`⚠️  [${timestamp}] Issues detected:`);
      health.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // Log current status
    console.log(`✅ [${timestamp}] Health: ${health.status} (${health.score}/100) | Cycles: ${cyclesT.toFixed(2)}T | Users: ${metrics.users}`);
  }

  private async sendAlert(message: string) {
    if (this.config.alerts.webhook) {
      try {
        await fetch(this.config.alerts.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        });
      } catch (e) {
        console.error('Webhook alert failed:', e);
      }
    }
  }
}

export function createMonitor(canisterId: string, opts?: ClientOptions & { webhook?: string }) {
  return new CanisterMonitor({
    canisterId,
    interval: 60, // 1 minute
    alerts: {
      lowCycles: 1, // 1T cycles
      webhook: opts?.webhook
    }
  }, opts);
}
