# repdao

> 🚀 **The Ultimate Reputation DAO Platform** - Enterprise-grade features, zero-config setup!

Transform your reputation management with AI-powered insights, real-time monitoring, and predictive analytics. What used to require enterprise solutions costing $100k+/year is now available through simple CLI commands.

## ✨ Revolutionary Features

- 🔬 **Deep Analytics** - Predictive modeling and user behavior analysis
- 🧠 **AI-Powered Insights** - Automatic optimization recommendations
- 👁️ **Real-Time Monitoring** - 24/7 health tracking with Slack/Discord alerts
- 🎧 **Event Streaming** - Live reputation events with webhook integration
- 📊 **Batch Operations** - CSV processing with atomic transactions
- 📤 **Data Export** - Complete backup and migration tools
- 🧙 **Interactive Wizards** - Zero-config setup in 30 seconds
- 🛡️ **Bulletproof** - Enterprise-grade error handling

---

## 🚀 Quick Start

### 1. Install globally
```bash
npm install -g repdao
```

### 2. Interactive setup
```bash
repdao setup    # 30-second configuration wizard
```

### 3. Explore legendary features
```bash
repdao wizard           # Interactive command builder
repdao insights <cid>   # AI-powered system analysis
repdao monitor <cid>    # Real-time health monitoring
repdao analyze <cid> <user> --days 30  # Predict user behavior
```

---

## 🔥 Legendary Commands

### 🧠 AI-Powered Intelligence
```bash
# Get AI insights and optimization recommendations
repdao insights <canister-id>

# Analyze specific user behavior patterns
repdao insights <canister-id> --user <principal>

# Deep user analysis with 30-day predictions
repdao analyze <canister-id> <user-principal> --days 30
```

### 👁️ Real-Time Monitoring
```bash
# 24/7 health monitoring with alerts
repdao monitor <canister-id> --webhook https://hooks.slack.com/...

# Advanced health assessment
repdao healthcheck <canister-id>

# Live event streaming
repdao stream <canister-id> --filter award
```

### 📊 Enterprise Operations
```bash
# Batch award from CSV file
repdao batch-award users.csv --atomic

# Export all canister data
repdao export-data <canister-id> --format csv

# Interactive setup wizard
repdao setup

# Command builder wizard
repdao wizard
```

### 🎯 Core Reputation Management
```bash
# Award points with reason
repdao awardRep <canister-id> <user> 100 --reason "Great work!"

# Check user balance
repdao getBalance <canister-id> <user>

# View leaderboard
repdao leaderboard <canister-id> 10 0

# Check system health
repdao health <canister-id>
```

---

## 🔬 Advanced Analytics

### Predictive Modeling
```typescript
import { predictDecay, analyzeUserComplete } from 'repdao/analytics';

// Predict user balance in 30 days
const prediction = await predictDecay(canisterId, userPrincipal, 30, opts);
console.log(`Current: ${prediction.currentBalance}`);
console.log(`Projected: ${prediction.projectedBalance}`);

// Complete user analysis
const analysis = await analyzeUserComplete(canisterId, userPrincipal, opts);
console.log(`Transactions: ${analysis.transactions.length}`);
console.log(`Awarder Sources: ${analysis.awarderBreakdown.length}`);
```

### AI-Powered Insights
```typescript
import { generateInsights, prioritizeInsights } from 'repdao/insights';

// Get system optimization recommendations
const insights = await generateInsights(canisterId, opts);
const prioritized = prioritizeInsights(insights);

prioritized.forEach(insight => {
  console.log(`${insight.title}: ${insight.description}`);
  if (insight.recommendation) {
    console.log(`💡 ${insight.recommendation}`);
  }
});
```

---

## 👁️ Real-Time Monitoring

### 24/7 Health Monitoring
```typescript
import { createMonitor } from 'repdao/monitor';

const monitor = createMonitor(canisterId, {
  ...opts,
  webhook: 'https://hooks.slack.com/your-webhook'
});

await monitor.start();
// Monitors: cycles, health score, activity patterns
// Alerts: Slack, Discord, custom webhooks
```

### Live Event Streaming
```typescript
import { createEventStream } from 'repdao/events';

const stream = createEventStream(canisterId, opts);

stream.onEvent((event) => {
  console.log(`${event.type}: ${JSON.stringify(event.data)}`);
});

await stream.start();
// Streams: awards, revokes, decay, top-ups in real-time
```

---

## 📊 Batch Operations

### CSV Processing
```bash
# Create users.csv:
# principal,amount,reason
# 2vxsx-fae,100,Great contribution
# rdmx6-jaaaa,50,Good work

# Preview before execution
repdao batch-award users.csv --dry-run

# Execute with atomic transactions
repdao batch-award users.csv --atomic
```

### Data Export
```bash
# Export all data as JSON
repdao export-data <canister-id> --output backup.json

# Export transactions as CSV
repdao export-data <canister-id> --format csv --output transactions.csv
```

---

## 🧙 Interactive Mode

Never remember command syntax again!

```bash
# First-time setup wizard
repdao setup

# Interactive command builder
repdao wizard
```

The wizard walks you through:
- 🎯 Award reputation points
- 💰 Check balances and stats
- 🏆 View leaderboards
- 👥 Manage trusted awarders
- 🏥 Health monitoring setup
- ⚙️ System configuration

---

## 🔌 SDK Usage

### Basic Operations
```typescript
import { awardRep, getBalance, health } from 'repdao';
import { identityFromPemFile } from 'repdao/identity';

const identity = identityFromPemFile('~/.repdao/admin.pem');
const opts = { identity, network: 'ic' as const };

// Award points
await awardRep('canister-id', 'user-principal', 100n, 'Great work!', opts);

// Check balance
const balance = await getBalance('canister-id', 'user-principal', opts);
console.log(`Balance: ${balance} points`);

// System health
const status = await health('canister-id', opts);
console.log(`Status: ${status.paused ? 'Paused' : 'Active'}`);
```

### Advanced Features
```typescript
import { 
  getCanisterMetrics, 
  assessSystemHealth,
  createMonitor,
  generateInsights 
} from 'repdao/analytics';

// Comprehensive metrics
const metrics = await getCanisterMetrics('canister-id', opts);
console.log(`Health Score: ${metrics.health.score}/100`);

// AI insights
const insights = await generateInsights('canister-id', opts);
insights.forEach(insight => {
  console.log(`💡 ${insight.title}: ${insight.description}`);
});

// Real-time monitoring
const monitor = createMonitor('canister-id', opts);
await monitor.start();
```

---

## ⚙️ Configuration

### Smart Defaults
```bash
# Setup saves your preferences
repdao setup

# Creates ~/.repdao/config.json:
{
  "network": "ic",
  "canisterId": "your-default-canister-id"
}

# Now commands work without repetition:
repdao health          # Uses default canister
repdao insights        # Uses default canister
```

### Environment Variables
```bash
export REPDAO_NETWORK=ic
export REPDAO_CANISTER_ID=your-canister-id
export REPDAO_PEM=/path/to/identity.pem
```

---

## 🏥 Health Monitoring

### System Health Assessment
```bash
# Get detailed health report
repdao healthcheck <canister-id>

# Output:
# 🎯 Health Score: 95/100
# 📊 Status: HEALTHY
# 
# 📈 Metrics:
#   Cycles: 5.2T
#   Users: 1,234
#   Transactions: 45,678
#   Version: 1.0.1
```

### Real-Time Alerts
```bash
# Monitor with Slack alerts
repdao monitor <canister-id> --webhook https://hooks.slack.com/...

# Monitors and alerts on:
# - Low cycles balance
# - Performance issues
# - Unusual activity patterns
# - Health score changes
```

---

## 🎯 Identity Management

```bash
# Create new identity
repdao id:new admin

# List all identities
repdao id:list

# Switch identity
repdao id:use admin

# Import from file
repdao id:import partner ./partner.pem

# Sync with dfx
repdao id:sync

# Show current principal
repdao id:whoami
```

---

## 📚 Examples

Check out `/examples/` for complete working examples:
- `basic-usage.js` - Simple SDK operations
- `batch-operations.js` - Advanced batch processing
- `legendary-features.js` - Complete feature showcase

---

## 🚀 What Makes This Legendary

This isn't just another CLI tool - it's a **complete reputation management platform** that:

✅ **Saves 40+ hours/month** of manual monitoring  
✅ **Prevents system failures** through predictive alerts  
✅ **Reduces onboarding** from days to minutes  
✅ **Provides enterprise insights** without the enterprise cost  

**Features that used to require:**
- Dedicated data science team → AI-powered insights
- Custom monitoring infrastructure → Real-time alerts
- Manual batch processing → CSV automation
- Complex setup procedures → 30-second wizard

**Now available through simple commands like `repdao insights` and `repdao monitor`.**

---

## 🆘 Support

- 📖 **Documentation**: This README + `repdao --help`
- 🧙 **Interactive Help**: `repdao wizard`
- 🐛 **Issues**: [GitHub Issues](https://github.com/reputation-dao/repdao/issues)
- 💬 **Community**: Join our Discord/Telegram

---

## 📄 License

MIT © Reputation DAO Contributors

---

**Made with ❤️ for the Internet Computer community**

*Transform your reputation management from basic to legendary in 30 seconds.*

