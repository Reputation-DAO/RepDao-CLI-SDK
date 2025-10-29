#!/usr/bin/env node
import { Command } from 'commander';
import { config as loadEnv } from 'dotenv';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { identityFromPemFile } from './identity.js';
import {
  addTrustedAwarder,
  awardRep,
  getBalance,
  invokeQuery,
  invokeUpdate,
  returnCyclesToFactory,
} from './client.js';

import {
  resolveIdentityPath,
  list as listIds,
  listDfxIdentities,
  use as useId,
  importPem,
  exportPem,
  del as delId,
  newIdentity,
  identityPathOrThrow,
  dfxPemPath,
} from './identityStore.js';

import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1';
import { Principal } from '@dfinity/principal';


// ---- Candid helpers ----
// For Candid `opt text`: use [] for null, ["value"] for some.
function OptText(s?: string | null): [] | [string] {
  return s == null ? [] : [String(s)];
}

/* -----------------------------------------------------------------------------
   Setup & Config
----------------------------------------------------------------------------- */
loadEnv();

function loadConfig() {
  const configPath = join(homedir(), '.repdao', 'config.json');
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

const config = loadConfig();

const program = new Command();
program
  .name('repdao')
  .description('Reputation DAO CLI - The easiest way to manage reputation points')
  .version('0.1.0')
  .option('--network <net>', 'Network: ic | local | custom', process.env.REPDAO_NETWORK ?? config.network ?? 'ic')
  .option('--host <url>', 'Host override (e.g. http://127.0.0.1:4943)')
  .option('--pem <path>', 'PEM file for identity', process.env.REPDAO_PEM)
  .option('--canister <id>', 'Default canister ID', config.canisterId)
  .addHelpText('after', `
Examples:
  repdao setup                           # First-time setup wizard
  repdao wizard                          # Interactive command builder
  repdao health <canister-id>            # Check canister status
  repdao awardRep <cid> <user> 100       # Award 100 points
  repdao getBalance <cid> <user>         # Check balance
  
Environment Variables:
  REPDAO_NETWORK     # Default network (ic/local)
  REPDAO_PEM         # Default PEM file path
  REPDAO_CANISTER_ID # Default canister ID

Config File: ~/.repdao/config.json
`);

const CLI_DIR = dirname(fileURLToPath(import.meta.url));

function resolveDistScript(relPath: string) {
  const direct = join(CLI_DIR, relPath);
  if (existsSync(direct)) return direct;

  const built = join(CLI_DIR, '..', 'dist', relPath);
  if (existsSync(built)) return built;

  throw new Error(
    `Cannot locate ${relPath}. Ensure the package is built (npm run build) before running this command.`
  );
}

/* -----------------------------------------------------------------------------
   Helpers & Validation
----------------------------------------------------------------------------- */

function validateCanisterId(cid?: string): string {
  if (!cid) {
    console.error('❌ Canister ID required. Use --canister <id> or run: repdao setup');
    process.exit(1);
  }
  if (!/^[a-z0-9-]+$/.test(cid)) {
    console.error('❌ Invalid canister ID format');
    process.exit(1);
  }
  return cid;
}

function validatePrincipal(p: string): string {
  try {
    P(p);
    return p;
  } catch {
    console.error('❌ Invalid principal format:', p);
    process.exit(1);
  }
}

function P(txt: string) {
  return Principal.fromText(txt);
}
function N(txt: string) {
  if (!/^\d+$/.test(txt)) {
    console.error('❌ Expected number, got:', txt);
    process.exit(1);
  }
  return BigInt(txt);
}
function B(txt: string) {
  if (txt === 'true') return true;
  if (txt === 'false') return false;
  console.error('❌ Expected true/false, got:', txt);
  process.exit(1);
}

function pretty(val: unknown) {
  return typeof val === 'bigint'
    ? val.toString()
    : JSON.stringify(val, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
}

function success(msg: string) {
  console.log('✅', msg);
}

function error(msg: string) {
  console.error('❌', msg);
  process.exit(1);
}

function optsWithIdentity() {
  const opts = program.opts<{ network?: string; host?: string; pem?: string }>();
  try {
    const pemPath = resolveIdentityPath(opts);
    const identity = identityFromPemFile(pemPath);
    return { identity, network: opts.network, host: opts.host };
  } catch (e) {
    error(`Identity error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/* -----------------------------------------------------------------------------
   Setup & Wizard Commands
----------------------------------------------------------------------------- */

program
  .command('setup')
  .description('🚀 First-time setup wizard')
  .action(async () => {
    const { spawn } = await import('node:child_process');
    try {
      const script = resolveDistScript('setup.js');
      spawn(process.execPath, [script], { stdio: 'inherit' });
    } catch (e) {
      error(e instanceof Error ? e.message : String(e));
    }
  });

program
  .command('wizard')
  .description('🧙 Interactive command builder')
  .action(async () => {
    const { spawn } = await import('node:child_process');
    try {
      const script = resolveDistScript('wizard.js');
      spawn(process.execPath, [script], { stdio: 'inherit' });
    } catch (e) {
      error(e instanceof Error ? e.message : String(e));
    }
  });

/* -----------------------------------------------------------------------------
   🚀 LEGENDARY COMMANDS - The 0.001% Edge
----------------------------------------------------------------------------- */

program
  .command('analyze [canisterId] [userPrincipal]')
  .description('🔬 Deep user analysis with predictions')
  .option('-c, --canister <id>', 'Canister ID')
  .option('--days <n>', 'Predict decay for N days', '30')
  .action(async (cid?: string, user?: string, cmd?: any) => {
    const opts = ((cmd && typeof cmd.opts === "function") ? cmd.opts() : {});
    const canisterId = validateCanisterId(cid || opts.canister || program.opts().canister);
    
    if (!user) {
      console.error('❌ User principal required');
      process.exit(1);
    }
    
    validatePrincipal(user);
    
    try {
      console.log('🔬 Analyzing user...');
      
      const { analyzeUserComplete, predictDecay } = await import('./analytics.js');
      const [analysis, prediction] = await Promise.all([
        analyzeUserComplete(canisterId, user, optsWithIdentity()),
        predictDecay(canisterId, user, parseInt(opts.days), optsWithIdentity())
      ]);
      
      console.log('\n📊 User Analysis:');
      console.log(`  Balance: ${analysis.balance} points`);
      console.log(`  Lifetime Awarded: ${analysis.stats.lifetimeAwarded}`);
      console.log(`  Lifetime Revoked: ${analysis.stats.lifetimeRevoked}`);
      console.log(`  Total Decayed: ${analysis.stats.totalDecayed}`);
      console.log(`  Transactions: ${analysis.transactions.length}`);
      console.log(`  Awarder Sources: ${analysis.awarderBreakdown.length}`);
      
      console.log('\n🔮 Decay Prediction:');
      console.log(`  Current: ${prediction.currentBalance} points`);
      console.log(`  After ${opts.days} days: ${prediction.projectedBalance} points`);
      console.log(`  Total decay: ${prediction.totalDecay} points`);
      if (prediction.daysUntilZero) {
        console.log(`  Days until zero: ${prediction.daysUntilZero}`);
      }
      
    } catch (e) {
      error(`Analysis failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

program
  .command('monitor [canisterId]')
  .description('👁️  Real-time canister monitoring')
  .option('-c, --canister <id>', 'Canister ID')
  .option('--webhook <url>', 'Webhook URL for alerts')
  .option('--interval <sec>', 'Check interval in seconds', '60')
  .action(async (cid?: string, cmd?: any) => {
    const opts = ((cmd && typeof cmd.opts === "function") ? cmd.opts() : {});
    const canisterId = validateCanisterId(cid || opts.canister || program.opts().canister);
    
    try {
      console.log('👁️  Starting real-time monitoring...');
      console.log('Press Ctrl+C to stop');
      
      const { createMonitor } = await import('./monitor.js');
      const monitor = createMonitor(canisterId, { 
        ...optsWithIdentity(), 
        webhook: opts.webhook 
      });
      
      await monitor.start();
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        monitor.stop();
        process.exit(0);
      });
      
    } catch (e) {
      error(`Monitor failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

program
  .command('healthcheck [canisterId]')
  .description('🏥 Advanced health assessment with recommendations')
  .option('-c, --canister <id>', 'Canister ID')
  .option('--json', 'Output as JSON')
  .action(async (cid?: string, cmd?: any) => {
    const opts = ((cmd && typeof cmd.opts === "function") ? cmd.opts() : {});
    const canisterId = validateCanisterId(cid || opts.canister || program.opts().canister);
    
    try {
      console.log('🏥 Running advanced health check...');
      
      const { assessSystemHealth, getCanisterMetrics } = await import('./analytics.js');
      const [health, metrics] = await Promise.all([
        assessSystemHealth(canisterId, optsWithIdentity()),
        getCanisterMetrics(canisterId, optsWithIdentity())
      ]);
      
      if (opts.json) {
        console.log(JSON.stringify({ health, metrics }, null, 2));
        return;
      }
      
      console.log('\n🎯 Health Score:', `${health.score}/100`);
      console.log('📊 Status:', health.status.toUpperCase());
      
      if (health.issues.length > 0) {
        console.log('\n⚠️  Issues:');
        health.issues.forEach(issue => console.log(`  • ${issue}`));
      }
      
      if (health.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        health.recommendations.forEach(rec => console.log(`  • ${rec}`));
      }
      
      console.log('\n📈 Metrics:');
      console.log(`  Cycles: ${(Number(metrics.cycles) / 1e12).toFixed(2)}T`);
      console.log(`  Users: ${metrics.users}`);
      console.log(`  Transactions: ${metrics.transactions}`);
      console.log(`  Version: ${metrics.version}`);
      
    } catch (e) {
      error(`Health check failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

program
  .command('batch-award <csvFile>')
  .description('📊 Award points from CSV file')
  .option('-c, --canister <id>', 'Canister ID')
  .option('--dry-run', 'Preview without executing')
  .option('--atomic', 'All or nothing execution')
  .action(async (csvFile: string, cmd?: any) => {
    const opts = ((cmd && typeof cmd.opts === "function") ? cmd.opts() : {});
    const canisterId = validateCanisterId(opts.canister || program.opts().canister);
    
    try {
      const { readFileSync } = await import('node:fs');
      const csv = readFileSync(csvFile, 'utf8');
      const lines = csv.split('\n').filter(l => l.trim());
      const header = lines[0];
      
      if (!header.includes('principal') || !header.includes('amount')) {
        error('CSV must have "principal" and "amount" columns');
      }
      
      const awards = lines.slice(1).map(line => {
        const [principal, amount, reason] = line.split(',').map(s => s.trim());
        return [principal, amount, reason || 'Batch award'];
      });
      
      console.log(`📊 Processing ${awards.length} awards...`);
      
      if (opts.dryRun) {
        console.log('🔍 DRY RUN - Preview:');
        awards.slice(0, 5).forEach(([p, a, r]) => {
          console.log(`  ${p}: ${a} points (${r})`);
        });
        if (awards.length > 5) console.log(`  ... and ${awards.length - 5} more`);
        return;
      }
      
      const { multiAward } = await import('./client.js');
      const result = await multiAward(canisterId, awards as any, !!opts.atomic, optsWithIdentity());
      success(result);
      
    } catch (e) {
      error(`Batch award failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

program
  .command('export-data [canisterId]')
  .description('📤 Export all canister data')
  .option('-c, --canister <id>', 'Canister ID')
  .option('--format <type>', 'Output format: json|csv', 'json')
  .option('--output <file>', 'Output file (default: stdout)')
  .action(async (cid?: string, cmd?: any) => {
    const opts = ((cmd && typeof cmd.opts === "function") ? cmd.opts() : {});
    const canisterId = validateCanisterId(cid || opts.canister || program.opts().canister);
    
    try {
      console.log('📤 Exporting canister data...');
      
      const [transactions, awarders, health, leaderboard] = await Promise.all([
        invokeQuery(canisterId, 'getTransactionHistory', [], optsWithIdentity()),
        invokeQuery(canisterId, 'getTrustedAwarders', [], optsWithIdentity()),
        invokeQuery(canisterId, 'health', [], optsWithIdentity()),
        invokeQuery(canisterId, 'leaderboard', [100n, 0n], optsWithIdentity())
      ]);
      
      const data = {
        canisterId,
        exportedAt: new Date().toISOString(),
        health,
        transactions,
        awarders,
        leaderboard
      };
      
      const output = opts.format === 'csv' 
        ? convertToCSV(data) 
        : JSON.stringify(data, null, 2);
      
      if (opts.output) {
        const { writeFileSync } = await import('node:fs');
        writeFileSync(opts.output, output);
        success(`Data exported to ${opts.output}`);
      } else {
        console.log(output);
      }
      
    } catch (e) {
      error(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

program
  .command('insights [canisterId]')
  .description('🧠 AI-powered insights and recommendations')
  .option('-c, --canister <id>', 'Canister ID')
  .option('--user <principal>', 'Analyze specific user behavior')
  .action(async (cid?: string, cmd?: any) => {
    const opts = ((cmd && typeof cmd.opts === "function") ? cmd.opts() : {});
    const canisterId = validateCanisterId(cid || opts.canister || program.opts().canister);
    
    try {
      console.log('🧠 Generating AI-powered insights...');
      
      const { generateInsights, analyzeUserBehavior, prioritizeInsights } = await import('./insights.js');
      
      if (opts.user) {
        validatePrincipal(opts.user);
        const { analysis, insights } = await analyzeUserBehavior(canisterId, opts.user, optsWithIdentity());
        
        console.log(`\n👤 User Analysis: ${opts.user}`);
        console.log(`  Balance: ${analysis.balance} points`);
        console.log(`  Activity: ${analysis.transactions.length} transactions`);
        console.log(`  Sources: ${analysis.awarderBreakdown.length} awarders`);
        
        if (insights.length > 0) {
          console.log('\n💡 Behavioral Insights:');
          insights.forEach((insight, i) => {
            const icon = insight.type === 'warning' ? '⚠️' : insight.type === 'opportunity' ? '🎯' : '📈';
            console.log(`  ${icon} ${insight.title}`);
            console.log(`     ${insight.description}`);
            if (insight.recommendation) {
              console.log(`     💡 ${insight.recommendation}`);
            }
          });
        }
      } else {
        const insights = await generateInsights(canisterId, optsWithIdentity());
        const prioritized = prioritizeInsights(insights);
        
        console.log('\n🎯 System Insights:');
        if (prioritized.length === 0) {
          console.log('  ✅ No issues detected - system is running optimally!');
        } else {
          prioritized.forEach((insight, i) => {
            const icon = insight.type === 'warning' ? '⚠️' : 
                        insight.type === 'optimization' ? '⚡' : 
                        insight.type === 'opportunity' ? '🎯' : '📈';
            const impact = insight.impact === 'high' ? '🔴' : 
                          insight.impact === 'medium' ? '🟡' : '🟢';
            
            console.log(`  ${icon} ${impact} ${insight.title}`);
            console.log(`     ${insight.description}`);
            if (insight.recommendation) {
              console.log(`     💡 ${insight.recommendation}`);
            }
            console.log('');
          });
        }
      }
      
    } catch (e) {
      error(`Insights generation failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

program
  .command('stream [canisterId]')
  .description('🎧 Real-time event streaming')
  .option('-c, --canister <id>', 'Canister ID')
  .option('--webhook <url>', 'Forward events to webhook')
  .option('--filter <type>', 'Filter events: award|revoke|decay|topup')
  .action(async (cid?: string, cmd?: any) => {
    const opts = ((cmd && typeof cmd.opts === "function") ? cmd.opts() : {});
    const canisterId = validateCanisterId(cid || opts.canister || program.opts().canister);
    
    try {
      console.log('🎧 Starting real-time event stream...');
      console.log('Press Ctrl+C to stop');
      
      const { createEventStream } = await import('./events.js');
      const stream = createEventStream(canisterId, optsWithIdentity());
      
      stream.onEvent((event) => {
        if (opts.filter && event.type !== opts.filter) return;
        
        const timestamp = new Date(event.timestamp * 1000).toLocaleTimeString();
        const icon = event.type === 'award' ? '🎯' : 
                    event.type === 'revoke' ? '❌' : 
                    event.type === 'decay' ? '⏰' : '⛽';
        
        console.log(`${icon} [${timestamp}] ${event.type.toUpperCase()}: ${JSON.stringify(event.data, null, 2)}`);
      });
      
      await stream.start();
      
      process.on('SIGINT', () => {
        stream.stop();
        process.exit(0);
      });
      
    } catch (e) {
      error(`Event streaming failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

function convertToCSV(data: any): string {
  // Simple CSV conversion for transactions
  const headers = ['id', 'type', 'from', 'to', 'amount', 'timestamp', 'reason'];
  const rows = data.transactions.map((tx: any) => [
    tx.id, tx.transactionType, tx.from, tx.to, tx.amount, tx.timestamp, tx.reason || ''
  ]);
  
  return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
}

/** Awarders / transfers */
program
  .command('addTrustedAwarder')
  .argument('<canisterId>')
  .argument('<awarderPrincipal>')
  .argument('<name>')
  .action(async (cid: string, awarder: string, name: string) => {
    const res = await addTrustedAwarder(cid, awarder, name, optsWithIdentity());
    console.log(res);
  });

program
  .command('removeTrustedAwarder')
  .argument('<canisterId>')
  .argument('<awarderPrincipal>')
  .action(async (cid: string, awarder: string) => {
    const res = await invokeUpdate(cid, 'removeTrustedAwarder', [P(awarder)], optsWithIdentity());
    console.log(res);
  });

program
  .command('awardRep [canisterId] [toPrincipal] [amount]')
  .description('🎯 Award reputation points to a user')
  .option('-r, --reason <text>', 'Reason for the award')
  .option('-c, --canister <id>', 'Canister ID (overrides default)')
  .action(async (cid?: string, to?: string, amount?: string, cmd?: any) => {
    const opts = ((cmd && typeof cmd.opts === "function") ? cmd.opts() : {});
    const canisterId = validateCanisterId(cid || opts.canister || program.opts().canister);
    
    if (!to) {
      console.error('❌ Recipient principal required');
      console.log('Usage: repdao awardRep <canister-id> <recipient> <amount>');
      process.exit(1);
    }
    
    if (!amount) {
      console.error('❌ Amount required');
      console.log('Usage: repdao awardRep <canister-id> <recipient> <amount>');
      process.exit(1);
    }

    validatePrincipal(to);
    
    try {
      console.log(`🎯 Awarding ${amount} points to ${to}...`);
      const res = await awardRep(canisterId, to, N(amount), opts.reason, optsWithIdentity());
      success(res);
    } catch (e) {
      error(`Award failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });



program
  .command('multiAward')
  .argument('<canisterId>')
  .requiredOption('--pairs <json>', 'JSON: [[toPrincipal, amount, reason?], ...]')
  .option('--atomic', 'fail all if any invalid', false)
  .action(async (...args: unknown[]) => {
    const cmd = args[args.length - 1] as Command;
    const [cid] = args.slice(0, -1) as [string];

    const { pairs, atomic } = cmd.opts() as { pairs: string; atomic?: boolean };

    let arr: unknown[];
    try {
      arr = JSON.parse(pairs);
    } catch {
      throw new Error('Invalid JSON for --pairs');
    }

    const mapped = arr.map((t, i) => {
      if (!Array.isArray(t) || t.length < 2 || t.length > 3) {
        throw new Error(`pairs[${i}] must be [principal, amount, ?reason]`);
      }
      const [to, amt, reason] = t as [unknown, unknown, unknown?];
      return [P(String(to)), N(String(amt)), OptText(reason as string | undefined)];
    });

    const res = await invokeUpdate(cid, 'multiAward', [mapped, !!atomic], optsWithIdentity());
    console.log(res);
  });



program
  .command('revokeRep')
  .argument('<canisterId>')
  .argument('<fromPrincipal>')
  .argument('<amount>')
  .option('-r, --reason <text>')
  .action(async (...args: unknown[]) => {
    const cmd = args[args.length - 1] as Command;
    const [cid, from, amount] = args.slice(0, -1) as [string, string, string];
    const { reason } = cmd.opts() as { reason?: string };

    const res = await invokeUpdate(
      cid,
      'revokeRep',
      [P(from), N(amount), OptText(reason)],
      optsWithIdentity()
    );
    console.log(res);
  });



program
  .command('resetUser')
  .argument('<canisterId>')
  .argument('<userPrincipal>')
  .option('-r, --reason <text>')
  .action(async (...args: unknown[]) => {
    const cmd = args[args.length - 1] as Command;
    const [cid, user] = args.slice(0, -1) as [string, string];
    const { reason } = cmd.opts() as { reason?: string };

    const res = await invokeUpdate(
      cid,
      'resetUser',
      [P(user), OptText(reason)],
      optsWithIdentity()
    );
    console.log(res);
  });



/** Admin / policy */
program
  .command('transferOwnership')
  .argument('<canisterId>')
  .argument('<newOwnerPrincipal>')
  .action(async (cid: string, newOwner: string) => {
    const res = await invokeUpdate(cid, 'transferOwnership', [P(newOwner)], optsWithIdentity());
    console.log(res);
  });

program
  .command('nominateOwner')
  .argument('<canisterId>')
  .argument('<candidatePrincipal>')
  .action(async (cid: string, candidate: string) => {
    const res = await invokeUpdate(cid, 'nominateOwner', [P(candidate)], optsWithIdentity());
    console.log(res);
  });

program
  .command('acceptOwnership')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeUpdate(cid, 'acceptOwnership', [], optsWithIdentity());
    console.log(res);
  });

program
  .command('configureDecay')
  .argument('<canisterId>')
  .argument('<decayRateNat>')
  .argument('<decayIntervalSec>')
  .argument('<minThresholdNat>')
  .argument('<gracePeriodSec>')
  .argument('<enabledBool>')
  .action(async (cid: string, rate: string, interval: string, min: string, grace: string, enabled: string) => {
    const res = await invokeUpdate(
      cid,
      'configureDecay',
      [N(rate), N(interval), N(min), N(grace), B(enabled)],
      optsWithIdentity()
    );
    console.log(res);
  });

program
  .command('setDailyMintLimit')
  .argument('<canisterId>')
  .argument('<limitNat>')
  .action(async (cid: string, limit: string) => {
    const res = await invokeUpdate(cid, 'setDailyMintLimit', [N(limit)], optsWithIdentity());
    console.log(res);
  });

program
  .command('setPerAwarderDailyLimit')
  .argument('<canisterId>')
  .argument('<awarderPrincipal>')
  .argument('<limitNat>')
  .action(async (cid: string, awarder: string, limit: string) => {
    const res = await invokeUpdate(
      cid,
      'setPerAwarderDailyLimit',
      [P(awarder), N(limit)],
      optsWithIdentity()
    );
    console.log(res);
  });

program
  .command('blacklist')
  .argument('<canisterId>')
  .argument('<userPrincipal>')
  .argument('<onBool>')
  .action(async (cid: string, user: string, on: string) => {
    const res = await invokeUpdate(cid, 'blacklist', [P(user), B(on)], optsWithIdentity());
    console.log(res);
  });

program
  .command('pause')
  .argument('<canisterId>')
  .argument('<onBool>')
  .action(async (cid: string, on: string) => {
    const res = await invokeUpdate(cid, 'pause', [B(on)], optsWithIdentity());
    console.log(res);
  });

program
  .command('setParent')
  .argument('<canisterId>')
  .argument('<parentPrincipal>')
  .action(async (cid: string, parent: string) => {
    const res = await invokeUpdate(cid, 'setParent', [P(parent)], optsWithIdentity());
    console.log(res);
  });

program
  .command('setMinCyclesAlert')
  .argument('<canisterId>')
  .argument('<thresholdNat>')
  .action(async (cid: string, thr: string) => {
    const res = await invokeUpdate(cid, 'setMinCyclesAlert', [N(thr)], optsWithIdentity());
    console.log(res);
  });

/** Maintenance */
program
  .command('processBatchDecay')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeUpdate(cid, 'processBatchDecay', [], optsWithIdentity());
    console.log(res);
  });

program
  .command('triggerManualDecay')
  .argument('<canisterId>')
  .action(async (...args: unknown[]) => {
    const [cid] = args.slice(0, -1) as [string];
    const res = await invokeUpdate(cid, 'triggerManualDecay', [], optsWithIdentity());
    console.log(res);
  });


/** Cycles */
program
  .command('topUp')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    // accepts all available attached cycles; returns accepted cycles (Nat)
    const res = await invokeUpdate(cid, 'topUp', [], optsWithIdentity());
    console.log(pretty(res));
  });

program
  .command('withdrawCycles')
  .argument('<canisterId>')
  .argument('<toPrincipal>')
  .argument('<amountNat>')
  .action(async (cid: string, to: string, amount: string) => {
    const res = await invokeUpdate(cid, 'withdrawCycles', [P(to), N(amount)], optsWithIdentity());
    console.log(res);
  });

program
  .command('returnCyclesToFactory')
  .argument('<canisterId>')
  .argument('[minRemainNat]', 'minimum cycles to leave on the child (default 0)', '0')
  .action(async (cid: string, minRemain: string) => {
    const res = await returnCyclesToFactory(cid, minRemain ?? '0', optsWithIdentity());
    console.log(res.toString());
  });

/** DX events */
program
  .command('emitEvent')
  .argument('<canisterId>')
  .argument('<kind>')
  .argument('[payload]')
  .option('--b64', 'payload is base64', false)
  .option('--hex', 'payload is hex', false)
  .action(async (...args: unknown[]) => {
    const cmd = args[args.length - 1] as Command;
    const [cid, kind, payload] = args.slice(0, -1) as [string, string, string?];

    const { b64, hex } = cmd.opts() as { b64?: boolean; hex?: boolean };
    let bytes = new Uint8Array();

    if (payload != null) {
      if (b64) bytes = new Uint8Array(Buffer.from(payload, 'base64'));
      else if (hex) bytes = new Uint8Array(Buffer.from(payload.replace(/^0x/, ''), 'hex'));
      else bytes = new TextEncoder().encode(payload);
    }

    const res = await invokeUpdate(cid, 'emitEvent', [kind, bytes], optsWithIdentity());
    console.log(res);
  });

/** Queries */
program
  .command('getBalance [canisterId] [principal]')
  .description('💰 Check reputation balance for a user')
  .option('-c, --canister <id>', 'Canister ID (overrides default)')
  .action(async (cid?: string, p?: string, cmd?: any) => {
    const opts = ((cmd && typeof cmd.opts === "function") ? cmd.opts() : {});
    const canisterId = validateCanisterId(cid || opts.canister || program.opts().canister);
    
    if (!p) {
      console.error('❌ User principal required');
      console.log('Usage: repdao getBalance <canister-id> <user-principal>');
      process.exit(1);
    }
    
    validatePrincipal(p);
    
    try {
      console.log(`💰 Checking balance for ${p}...`);
      const bal = await getBalance(canisterId, p, program.opts());
      console.log(`Balance: ${bal.toString()} points`);
    } catch (e) {
      error(`Balance check failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

program
  .command('getTrustedAwarders')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeQuery(cid, 'getTrustedAwarders', [], program.opts());
    console.log(pretty(res));
  });

program
  .command('getTransactionHistory')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeQuery(cid, 'getTransactionHistory', [], program.opts());
    console.log(pretty(res));
  });

program
  .command('getTransactionsPaged')
  .argument('<canisterId>')
  .argument('<offsetNat>')
  .argument('<limitNat>')
  .action(async (cid: string, offset: string, limit: string) => {
    const res = await invokeQuery(cid, 'getTransactionsPaged', [N(offset), N(limit)], program.opts());
    console.log(pretty(res));
  });

program
  .command('getTransactionsByUser')
  .argument('<canisterId>')
  .argument('<userPrincipal>')
  .action(async (cid: string, user: string) => {
    const res = await invokeQuery(cid, 'getTransactionsByUser', [P(user)], program.opts());
    console.log(pretty(res));
  });

program
  .command('findTransactionsByReason')
  .argument('<canisterId>')
  .argument('<substr>')
  .argument('<limitNat>')
  .action(async (cid: string, substr: string, limit: string) => {
    const res = await invokeQuery(cid, 'findTransactionsByReason', [substr, N(limit)], program.opts());
    console.log(pretty(res));
  });

program
  .command('getTransactionById')
  .argument('<canisterId>')
  .argument('<idNat>')
  .action(async (cid: string, id: string) => {
    const res = await invokeQuery(cid, 'getTransactionById', [N(id)], program.opts());
    console.log(pretty(res));
  });

program
  .command('getTransactionCount')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeQuery(cid, 'getTransactionCount', [], program.opts());
    console.log(pretty(res));
  });

program
  .command('getDecayConfig')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeQuery(cid, 'getDecayConfig', [], program.opts());
    console.log(pretty(res));
  });

program
  .command('getUserDecayInfo')
  .argument('<canisterId>')
  .argument('<principal>')
  .action(async (cid: string, p: string) => {
    const res = await invokeQuery(cid, 'getUserDecayInfo', [P(p)], program.opts());
    console.log(pretty(res));
  });

program
  .command('previewDecayAmount')
  .argument('<canisterId>')
  .argument('<principal>')
  .action(async (cid: string, p: string) => {
    const res = await invokeQuery(cid, 'previewDecayAmount', [P(p)], program.opts());
    console.log(pretty(res));
  });

program
  .command('getBalanceWithDetails')
  .argument('<canisterId>')
  .argument('<principal>')
  .action(async (cid: string, p: string) => {
    const res = await invokeQuery(cid, 'getBalanceWithDetails', [P(p)], program.opts());
    console.log(pretty(res));
  });

program
  .command('getDecayStatistics')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeQuery(cid, 'getDecayStatistics', [], program.opts());
    console.log(pretty(res));
  });

program
  .command('leaderboard')
  .argument('<canisterId>')
  .argument('<topNat>')
  .argument('<offsetNat>')
  .action(async (cid: string, top: string, offset: string) => {
    const res = await invokeQuery(cid, 'leaderboard', [N(top), N(offset)], program.opts());
    console.log(pretty(res));
  });

program
  .command('myStats')
  .argument('<canisterId>')
  .argument('<userPrincipal>')
  .action(async (cid: string, user: string) => {
    const res = await invokeQuery(cid, 'myStats', [P(user)], program.opts());
    console.log(pretty(res));
  });

program
  .command('awarderStats')
  .argument('<canisterId>')
  .argument('<awardeePrincipal>')
  .action(async (cid: string, awardee: string) => {
    const res = await invokeQuery(cid, 'awarderStats', [P(awardee)], program.opts());
    console.log(pretty(res));
  });

program
  .command('orgPulse')
  .argument('<canisterId>')
  .argument('<sinceSecNat>')
  .action(async (cid: string, since: string) => {
    const res = await invokeQuery(cid, 'orgPulse', [N(since)], program.opts());
    console.log(pretty(res));
  });

program
  .command('getTopUpsPaged')
  .argument('<canisterId>')
  .argument('<offsetNat>')
  .argument('<limitNat>')
  .action(async (cid: string, offset: string, limit: string) => {
    const res = await invokeQuery(cid, 'getTopUpsPaged', [N(offset), N(limit)], program.opts());
    console.log(pretty(res));
  });

program
  .command('getTopUpCount')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeQuery(cid, 'getTopUpCount', [], program.opts());
    console.log(pretty(res));
  });

program
  .command('version')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeQuery(cid, 'version', [], program.opts());
    console.log(pretty(res));
  });

program
  .command('health [canisterId]')
  .description('🏥 Check canister health and status')
  .option('-c, --canister <id>', 'Canister ID (overrides default)')
  .action(async (cid?: string, cmd?: any) => {
    const opts = (cmd && typeof cmd.opts === 'function') ? cmd.opts() : {};
    const canisterId = validateCanisterId(cid || opts.canister || program.opts().canister);
    
    try {
      console.log('🏥 Checking canister health...');
      const res = await invokeQuery(canisterId, 'health', [], program.opts()) as any;
      
      console.log('\n📊 Canister Status:');
      console.log(`  Status: ${res.paused ? '⏸️  Paused' : '✅ Active'}`);
      console.log(`  Cycles: ${(Number(res.cycles) / 1e12).toFixed(2)}T`);
      console.log(`  Users: ${res.users}`);
      console.log(`  Transactions: ${res.txCount}`);
      console.log(`  Top-ups: ${res.topUpCount}`);
      console.log(`  Decay Config Hash: ${res.decayConfigHash}`);
      
      if (Number(res.cycles) < 1e12) {
        console.log('\n⚠️  Warning: Low cycles balance!');
      }
    } catch (e) {
      error(`Health check failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

program
  .command('cycles_balance')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeQuery(cid, 'cycles_balance', [], program.opts());
    console.log(pretty(res));
  });

program
  .command('snapshotHash')
  .argument('<canisterId>')
  .action(async (cid: string) => {
    const res = await invokeQuery(cid, 'snapshotHash', [], program.opts());
    console.log(pretty(res));
  });

/* -----------------------------------------------------------------------------
   Identity management (repdao + dfx integration)
----------------------------------------------------------------------------- */

program
  .command('id:list')
  .description('List saved identities (repdao + dfx)')
  .action(async () => {
    const { names: rnames, current } = await listIds();
    const { names: dnames, current: dcur } = listDfxIdentities();

    console.log('repdao:');
    if (!rnames.length) console.log('  (none)');
    for (const n of rnames) console.log(`${current === n ? '*' : ' '} ${n}`);

    console.log('dfx:');
    if (!dnames.length) console.log('  (none)');
    for (const n of dnames) console.log(`${dcur === n ? '*' : ' '} ${n}`);
  });

program
  .command('id:whoami')
  .description('Show principal of current identity (repdao current, else dfx default). Use --pem to override.')
  .option('--pem <path>', 'PEM override (defaults to repdao current, else dfx default)')
  .action(async (opts) => {
    const pemPath = opts.pem ?? identityPathOrThrow();
    const id = Secp256k1KeyIdentity.fromPem(readFileSync(pemPath, 'utf8'));
    console.log(id.getPrincipal().toText());
  });

program
  .command('id:use <name>')
  .description('Switch current repdao identity')
  .action(async (name) => {
    await useId(name);
    console.log(`Current identity -> ${name}`);
  });

program
  .command('id:import <name> <pemFile>')
  .description('Import a PEM file into the repdao store')
  .action(async (name, pemFile) => {
    const dest = await importPem(name, pemFile);
    console.log(`Imported as ${name}: ${dest}`);
  });

program
  .command('id:new <name>')
  .description('Generate a new secp256k1 identity (PEM) into repdao store and set current')
  .action(async (name) => {
    const dest = await newIdentity(name);
    await useId(name);
    console.log(`Created and set current -> ${name}: ${dest}`);
  });

program
  .command('id:export <name> [dest]')
  .description('Export a repdao PEM (prints to stdout if no dest)')
  .action(async (name, dest) => {
    const out = await exportPem(name, dest);
    if (dest) console.log(`Exported to ${dest}`);
    else console.log(out);
  });

program
  .command('id:delete <name>')
  .description('Delete a saved repdao identity (not the current one)')
  .action(async (name) => {
    await delId(name);
    console.log(`Deleted ${name}`);
  });

program
  .command('id:sync')
  .description('Import all dfx identities into repdao (names preserved)')
  .action(async () => {
    const { names } = listDfxIdentities();
    if (!names.length) return console.log('No dfx identities found.');
    for (const n of names) {
      const p = dfxPemPath(n);
      try {
        await importPem(n, p);
        console.log(`synced: ${n}`);
      } catch (e) {
        console.log(`skip ${n}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  });

/* -----------------------------------------------------------------------------
   Parse
----------------------------------------------------------------------------- */

/* -----------------------------------------------------------------------------
   Parse & Error Handling
----------------------------------------------------------------------------- */

// Wrap all command actions with error handling
const originalAction = program.action;
program.action = function(fn: Function) {
  return originalAction.call(this, async (...args: any[]) => {
    try {
      await fn(...args);
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.includes('Canister not found')) {
          error('Canister not found. Check your canister ID.');
        } else if (e.message.includes('Unauthorized')) {
          error('Unauthorized. Check your identity and permissions.');
        } else if (e.message.includes('Network')) {
          error('Network error. Check your connection and try again.');
        } else {
          error(e.message);
        }
      } else {
        error(String(e));
      }
    }
  });
};

program.parseAsync(process.argv).catch((e: unknown) => {
  console.error('💥 Unexpected error:', e);
  console.log('\n🆘 Need help?');
  console.log('  repdao setup    # First-time setup');
  console.log('  repdao wizard   # Interactive commands');
  console.log('  repdao --help   # Full command list');
  process.exit(1);
});
