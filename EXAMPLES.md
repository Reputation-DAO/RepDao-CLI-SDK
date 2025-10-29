# RepDAO CLI & SDK Examples

> **Professional testing guide with comprehensive command examples**

This document provides complete examples of every RepDAO command with expected outputs. Replace placeholder values with your actual canister and principal IDs.

---

## 🚀 Setup & Configuration

### Initial Setup
```bash
repdao setup
```
**Expected Output:**
```
🚀 RepDAO Setup Wizard

📝 Found existing config

🔧 Configuration:
Network (ic/local/custom) [ic]: ic
Default canister ID [<your-canister-id>]: <your-canister-id>

✅ Setup complete!

📚 Quick start:
  repdao wizard          # Interactive command builder
  repdao health          # Check canister status
  repdao id:new admin    # Create new identity
```

### Help Command
```bash
repdao help
```
**Expected Output:** Full command list with descriptions and examples.

---

## 🏥 Health & Status Commands

### Basic Health Check
```bash
repdao health <your-canister-id>
```
**Expected Output:**
```
🏥 Checking canister health...

📊 Canister Status:
  Status: ✅ Active
  Cycles: 1.00T
  Users: 1
  Transactions: 4
  Top-ups: 1
  Decay Config Hash: 6903752888751891163
```

### Advanced Health Assessment
```bash
repdao healthcheck <your-canister-id>
```
**Expected Output:**
```
🏥 Running advanced health check...

🎯 Health Score: 85/100
📊 Status: HEALTHY

⚠️  Issues:
  • Warning: Low cycles balance

💡 Recommendations:
  • Consider topping up cycles soon

📈 Metrics:
  Cycles: 1.00T
  Users: 1
  Transactions: 4
  Version: 1.0.1
```

### Version Check
```bash
repdao version <your-canister-id>
```
**Expected Output:**
```
"1.0.1"
```

### Cycles Balance
```bash
repdao cycles_balance <your-canister-id>
```
**Expected Output:**
```
1004783387230
```

---

## 💰 Balance & User Queries

### Check User Balance
```bash
repdao getBalance <your-canister-id> <user-principal-id>
```
**Expected Output:**
```
💰 Checking balance for <user-principal-id>...
Balance: 8 points
```

### User Statistics
```bash
repdao myStats <your-canister-id> <user-principal-id>
```
**Expected Output:**
```json
{
  "lifetimeRevoked": "4",
  "balance": "8",
  "lastActivity": "1761729180",
  "lifetimeAwarded": "12",
  "totalDecayed": "0"
}
```

### Leaderboard
```bash
repdao leaderboard <your-canister-id> 5 0
```
**Expected Output:**
```json
[
  [
    {
      "__principal__": "<top-user-principal-id>"
    },
    "8"
  ]
]
```

---

## 👥 Awarder Management

### List Trusted Awarders
```bash
repdao getTrustedAwarders <your-canister-id>
```
**Expected Output:**
```json
[
  {
    "id": {
      "__principal__": "<awarder-principal-id-1>"
    },
    "name": "Admin"
  },
  {
    "id": {
      "__principal__": "<awarder-principal-id-2>"
    },
    "name": "Manager"
  }
]
```

### Add Trusted Awarder
```bash
repdao addTrustedAwarder <your-canister-id> <new-awarder-principal-id> "Awarder Name"
```
**Expected Output:**
```
Success: Awarder added
```
**Note:** Returns "Error: Exists" if awarder already exists.

### Remove Trusted Awarder
```bash
repdao removeTrustedAwarder <your-canister-id> <awarder-principal-id>
```
**Expected Output:**
```
Success: Awarder removed
```

---

## 🎯 Reputation Operations

### Award Reputation Points
```bash
repdao awardRep <your-canister-id> <awardee-principal-id> 100 --reason "Great contribution"
```
**Expected Output:**
```
🎯 Awarding 100 points to <awardee-principal-id>...
Success: 100 points awarded
```
**Note:** Returns "Error: Cannot self-award" if awarding to yourself.

### Revoke Reputation Points
```bash
repdao revokeRep <your-canister-id> <user-principal-id> 50 --reason "Policy violation"
```
**Expected Output:**
```
Success: 50 points revoked
```

### Multi Award
```bash
repdao multiAward <your-canister-id> --pairs '[["<user1-principal-id>", 10, "Good work"], ["<user2-principal-id>", 20, "Excellent"]]'
```
**Expected Output:**
```
Success: Multi-award completed
```
**Note:** Returns "Error: Not a trusted awarder" if not authorized.

### Reset User
```bash
repdao resetUser <your-canister-id> <user-principal-id> --reason "Account reset"
```
**Expected Output:**
```
Success: user reset
```
**Verification:** User balance becomes 0 after reset.

---

## 📊 Transaction History

### Get All Transactions
```bash
repdao getTransactionHistory <your-canister-id>
```
**Expected Output:**
```json
[
  {
    "id": "4",
    "to": {
      "__principal__": "<recipient-principal-id>"
    },
    "transactionType": {
      "Award": null
    },
    "from": {
      "__principal__": "<awarder-principal-id>"
    },
    "timestamp": "1761729180",
    "amount": "100",
    "reason": [
      "Great contribution"
    ]
  }
]
```

### Get Transaction Count
```bash
repdao getTransactionCount <your-canister-id>
```
**Expected Output:**
```
4
```

### Get Paginated Transactions
```bash
repdao getTransactionsPaged <your-canister-id> 0 10
```
**Expected Output:** Returns first 10 transactions in JSON format.

### Get Transaction by ID
```bash
repdao getTransactionById <your-canister-id> 1
```
**Expected Output:**
```json
[
  {
    "id": "1",
    "to": {
      "__principal__": "<recipient-principal-id>"
    },
    "transactionType": {
      "Award": null
    },
    "from": {
      "__principal__": "<awarder-principal-id>"
    },
    "timestamp": "1761631861",
    "amount": "100",
    "reason": [
      "Initial award"
    ]
  }
]
```

### Find Transactions by Reason
```bash
repdao findTransactionsByReason <your-canister-id> "contribution" 10
```
**Expected Output:** Returns transactions containing "contribution" in reason field.

---

## ⚙️ Configuration Commands

### Get Decay Configuration
```bash
repdao getDecayConfig <your-canister-id>
```
**Expected Output:**
```json
{
  "minThreshold": "10",
  "gracePeriod": "2592000",
  "enabled": false,
  "decayInterval": "2592000",
  "decayRate": "500"
}
```

### Configure Decay Settings
```bash
repdao configureDecay <your-canister-id> 100 86400 5 3600 true
```
**Expected Output:**
```
Success: Decay config updated
```
**Parameters:** 
- `100` - Decay rate (100 basis points = 1%)
- `86400` - Decay interval (1 day in seconds)
- `5` - Minimum threshold (points below which no decay)
- `3600` - Grace period (1 hour in seconds)
- `true` - Enable decay

### Set Daily Mint Limit
```bash
repdao setDailyMintLimit <your-canister-id> 1000
```
**Expected Output:**
```
Success: Daily limit updated
```

### Set Per-Awarder Daily Limit
```bash
repdao setPerAwarderDailyLimit <your-canister-id> <awarder-principal-id> 500
```
**Expected Output:**
```
Success: Per-awarder limit set
```

---

## 🔒 Administrative Commands

### Blacklist User
```bash
repdao blacklist <your-canister-id> <user-principal-id> true
```
**Expected Output:**
```
Success: blacklist updated
```

### Unblacklist User
```bash
repdao blacklist <your-canister-id> <user-principal-id> false
```
**Expected Output:**
```
Success: blacklist updated
```

### Pause Canister
```bash
repdao pause <your-canister-id> true
```
**Expected Output:**
```
Success: pause=true
```
**Verification:** Health check shows "⏸️ Paused" status.

### Unpause Canister
```bash
repdao pause <your-canister-id> false
```
**Expected Output:**
```
Success: pause=false
```

### Set Minimum Cycles Alert
```bash
repdao setMinCyclesAlert <your-canister-id> 500000000000
```
**Expected Output:**
```
Success: alert set
```

---

## 🔄 Decay Operations

### Get User Decay Info
```bash
repdao getUserDecayInfo <your-canister-id> <user-principal-id>
```
**Expected Output:**
```json
[
  {
    "lastActivityTime": "1761729180",
    "totalDecayed": "0",
    "lastDecayTime": "1761631861",
    "registrationTime": "1761631861"
  }
]
```

### Preview Decay Amount
```bash
repdao previewDecayAmount <your-canister-id> <user-principal-id>
```
**Expected Output:**
```
5
```

### Get Decay Statistics
```bash
repdao getDecayStatistics <your-canister-id>
```
**Expected Output:**
```json
{
  "lastGlobalDecayProcess": "1761729180",
  "configEnabled": true,
  "totalDecayedPoints": "150"
}
```

### Process Batch Decay
```bash
repdao processBatchDecay <your-canister-id>
```
**Expected Output:**
```
Success: Processed 5 users; total decay 25
```

### Trigger Manual Decay
```bash
repdao triggerManualDecay <your-canister-id>
```
**Expected Output:**
```
Success: Processed 3 users; total decay 15
```

---

## 💎 Cycles Management

### Top Up Cycles
```bash
repdao topUp <your-canister-id>
```
**Expected Output:**
```
1000000000
```

### Withdraw Cycles
```bash
repdao withdrawCycles <your-canister-id> <recipient-principal-id> 1000000000
```
**Expected Output:**
```
Success: 1000000000 cycles withdrawn
```
**Note:** Requires proper permissions and sufficient cycles.

### Return Cycles to Factory
```bash
repdao returnCyclesToFactory <your-canister-id> 900000000000
```
**Expected Output:**
```
64620693046
```
**Result:** Returns excess cycles, keeping minimum specified amount (900B cycles).

### Get Top-Up History
```bash
repdao getTopUpCount <your-canister-id>
```
**Expected Output:**
```
3
```

```bash
repdao getTopUpsPaged <your-canister-id> 0 5
```
**Expected Output:**
```json
[
  {
    "id": "1",
    "from": {
      "__principal__": "<your-canister-id>"
    },
    "timestamp": "1761631595",
    "amount": "1000000000"
  }
]
```

---

## 🧠 AI-Powered Features

### Generate Insights
```bash
repdao insights <your-canister-id>
```
**Expected Output:**
```
🧠 Generating AI-powered insights...

🎯 System Insights:
  💡 Optimization: Consider increasing daily mint limit
  ⚠️  Warning: Decay rate may be too aggressive
  🚀 Opportunity: Low user engagement detected
  
📊 Recommendations:
  • Increase engagement campaigns
  • Review decay configuration
  • Monitor cycles balance
```

### Deep User Analysis
```bash
repdao analyze <your-canister-id> <user-principal-id> --days 30
```
**Expected Output:**
```
🔬 Analyzing user...

📊 User Analysis Results:
  Current Balance: 150 points
  Projected Balance (30 days): 135 points
  Total Decay Prediction: 15 points
  Risk Level: Low
  
💡 Insights:
  • Consistent activity pattern
  • Well-diversified point sources
  • Low decay risk
```

---

## 👁️ Real-Time Monitoring

### Start Monitoring (runs continuously)
```bash
repdao monitor <your-canister-id>
```
**Expected Output:**
```
👁️  Starting real-time monitoring...
Press Ctrl+C to stop
🔍 Starting monitor for <your-canister-id>
📊 [2025-10-30T02:15:20.045Z] Status changed: undefined → healthy
✅ [2025-10-30T02:15:20.045Z] Health: healthy (95/100) | Cycles: 2.50T | Users: 25
⚠️  [2025-10-30T02:16:20.045Z] Issues detected:
   - Info: High activity detected
✅ [2025-10-30T02:16:20.045Z] Health: healthy (95/100) | Cycles: 2.49T | Users: 26
```

### Start Event Streaming (runs continuously)
```bash
repdao stream <your-canister-id>
```
**Expected Output:**
```
🎧 Starting real-time event stream...
Press Ctrl+C to stop
🎧 Starting event stream for <your-canister-id>
📨 [2025-10-30T02:15:30] Award: 100 points to <user-principal-id>
📨 [2025-10-30T02:16:15] Revoke: 25 points from <user-principal-id>
📨 [2025-10-30T02:17:00] TopUp: 1T cycles added
```

---

## 📊 Batch Operations

### Batch Award from CSV
Create `awards.csv`:
```csv
principal,amount,reason
<user1-principal-id>,100,Excellent work
<user2-principal-id>,75,Good contribution
<user3-principal-id>,50,Helpful feedback
```

```bash
repdao batch-award awards.csv --dry-run
```
**Expected Output:**
```
📊 Processing 3 awards...
✅ Dry run completed successfully
  • <user1-principal-id>: 100 points - "Excellent work"
  • <user2-principal-id>: 75 points - "Good contribution"  
  • <user3-principal-id>: 50 points - "Helpful feedback"
Total: 225 points to be awarded
```

```bash
repdao batch-award awards.csv --atomic
```
**Expected Output:**
```
📊 Processing 3 awards...
✅ Batch award completed successfully
Total awarded: 225 points to 3 users
```

---

## 🆔 Identity Management

### List Identities
```bash
repdao id:list
```
**Expected Output:**
```
repdao:
  admin
  manager
* current-identity
  test-user
dfx:
  alice
  bob
  default
* current-dfx-identity
```

### Show Current Identity
```bash
repdao id:whoami
```
**Expected Output:**
```
<your-current-principal-id>
```

### Create New Identity
```bash
repdao id:new manager
```
**Expected Output:**
```
✅ Generated new identity: manager
🔑 Principal: <new-principal-id>
💾 Saved to: ~/.repdao/manager.pem
```

### Switch Identity
```bash
repdao id:use manager
```
**Expected Output:**
```
✅ Switched to identity: manager
🔑 Principal: <manager-principal-id>
```

### Import Identity
```bash
repdao id:import external-user /path/to/identity.pem
```
**Expected Output:**
```
✅ Imported identity: external-user
🔑 Principal: <imported-principal-id>
```

### Export Identity
```bash
repdao id:export manager /path/to/backup.pem
```
**Expected Output:**
```
✅ Exported identity: manager
📁 Saved to: /path/to/backup.pem
```

---

## 🧙 Interactive Features

### Setup Wizard
```bash
repdao wizard
```
**Expected Output:**
```
🧙 RepDAO Command Wizard

What would you like to do?
  1. Award reputation points
  2. Check someone's balance
  3. View leaderboard
  4. Manage trusted awarders
  5. Check canister health
  6. Configure decay settings
Choose (1-6): 1

Recipient principal: <awardee-principal-id>
Amount: 100
Reason (optional): Great contribution

🎯 Generated command:
  repdao awardRep <your-canister-id> <awardee-principal-id> 100 --reason "Great contribution"

Execute now? (y/N): y
```

---

## 📈 Analytics & Statistics

### Organization Pulse
```bash
repdao orgPulse <your-canister-id> 86400
```
**Expected Output:**
```json
{
  "revokes": "5",
  "decays": "12",
  "awards": "45"
}
```
**Note:** Shows activity in last 86400 seconds (24 hours).

### Awarder Statistics
```bash
repdao awarderStats <your-canister-id> <user-principal-id>
```
**Expected Output:**
```json
[
  {
    "total": "150",
    "lastAward": "1761729165",
    "awarder": {
      "__principal__": "<awarder1-principal-id>"
    }
  },
  {
    "total": "75",
    "lastAward": "1761687526",
    "awarder": {
      "__principal__": "<awarder2-principal-id>"
    }
  }
]
```

### Snapshot Hash
```bash
repdao snapshotHash <your-canister-id>
```
**Expected Output:**
```
625659907206355401
```

---

## 🔧 SDK Usage Examples

### Basic SDK Operations
```javascript
import { health, getBalance, awardRep, version } from 'repdao';
import { identityFromPemFile } from 'repdao/identity';

const canisterId = '<your-canister-id>';
const userPrincipal = '<user-principal-id>';
const identity = identityFromPemFile('~/.repdao/admin.pem');
const opts = { identity, network: 'ic' };

// Check health
const healthStatus = await health(canisterId, opts);
console.log('Status:', healthStatus.paused ? 'Paused' : 'Active');

// Get balance
const balance = await getBalance(canisterId, userPrincipal, opts);
console.log('Balance:', balance.toString(), 'points');

// Award points
await awardRep(canisterId, userPrincipal, 100n, 'Great work!', opts);

// Get version
const ver = await version(canisterId, opts);
console.log('Version:', ver);
```

### Advanced Analytics SDK
```javascript
import { 
  getCanisterMetrics, 
  assessSystemHealth,
  generateInsights 
} from 'repdao/analytics';

const canisterId = '<your-canister-id>';
const opts = { network: 'ic' };

// Get comprehensive metrics
const metrics = await getCanisterMetrics(canisterId, opts);
console.log(`Health Score: ${metrics.health.score}/100`);
console.log(`Users: ${metrics.users}`);

// AI health assessment
const health = await assessSystemHealth(canisterId, opts);
console.log(`Status: ${health.status}`);
health.recommendations.forEach(rec => console.log(`💡 ${rec}`));

// Generate insights
const insights = await generateInsights(canisterId, opts);
insights.forEach(insight => {
  console.log(`${insight.type}: ${insight.title}`);
  if (insight.recommendation) {
    console.log(`💡 ${insight.recommendation}`);
  }
});
```

### Real-Time Monitoring SDK
```javascript
import { createMonitor } from 'repdao/monitor';
import { createEventStream } from 'repdao/events';

const canisterId = '<your-canister-id>';
const opts = { network: 'ic' };

// Start monitoring
const monitor = createMonitor(canisterId, {
  ...opts,
  webhook: 'https://hooks.slack.com/your-webhook'
});
await monitor.start();

// Start event streaming
const stream = createEventStream(canisterId, opts);
stream.onEvent((event) => {
  console.log(`${event.type}: ${JSON.stringify(event.data)}`);
});
await stream.start();
```

---

## 🚨 Common Error Patterns

### Invalid Principal Format
```bash
repdao getBalance <your-canister-id> invalid-principal
```
**Error Output:**
```
💥 Unexpected error: Error: Principal "invalid-principal" does not have a valid checksum
```

### Permission Denied
```bash
repdao awardRep <your-canister-id> <user-principal-id> 100
```
**Error Output:**
```
Error: Not a trusted awarder
```

### Self-Award Prevention
```bash
repdao awardRep <your-canister-id> <your-own-principal-id> 100
```
**Error Output:**
```
Error: Cannot self-award
```

### Insufficient Cycles
```bash
repdao withdrawCycles <your-canister-id> <recipient-principal-id> 999999999999999
```
**Error Output:**
```
Error: Insufficient cycles balance
```

---

## 📝 Testing Checklist

### ✅ Core Functionality
- [ ] Health & status commands
- [ ] Balance & user queries  
- [ ] Awarder management
- [ ] Reputation operations
- [ ] Transaction history
- [ ] Configuration commands
- [ ] Administrative commands
- [ ] Decay operations
- [ ] Cycles management
- [ ] AI-powered features
- [ ] Real-time monitoring
- [ ] Batch operations
- [ ] Identity management
- [ ] Interactive features
- [ ] Analytics & statistics
- [ ] SDK integration

### 🎯 Environment Setup
- [ ] Network configuration (ic/local/custom)
- [ ] Identity setup and switching
- [ ] Canister deployment and configuration
- [ ] Trusted awarder permissions
- [ ] Cycles balance sufficient for operations

---

## 💡 Pro Tips for Testers

1. **Environment Setup**
   ```bash
   # Set environment variables for convenience
   export REPDAO_CANISTER_ID="<your-canister-id>"
   export REPDAO_NETWORK="ic"
   export REPDAO_PEM="~/.repdao/admin.pem"
   ```

2. **Identity Management**
   ```bash
   # Create test identities
   repdao id:new admin
   repdao id:new manager  
   repdao id:new user
   ```

3. **Batch Testing**
   ```bash
   # Use dry-run for safe testing
   repdao batch-award test.csv --dry-run
   
   # Use atomic transactions for consistency
   repdao batch-award test.csv --atomic
   ```

4. **Monitoring Setup**
   ```bash
   # Set up Slack webhook for alerts
   repdao monitor <your-canister-id> --webhook https://hooks.slack.com/your-webhook
   ```

5. **Configuration Backup**
   ```bash
   # Export current configuration
   repdao export-data <your-canister-id> --output backup.json
   ```

---

## 🔗 Quick Reference

### Essential Commands
```bash
repdao setup                                    # Initial configuration
repdao health <canister-id>                     # Basic health check
repdao getBalance <canister-id> <principal>     # Check balance
repdao awardRep <canister-id> <principal> 100   # Award points
repdao leaderboard <canister-id> 10 0          # Top 10 users
repdao insights <canister-id>                   # AI insights
```

### Configuration Files
- `~/.repdao/config.json` - Default configuration
- `~/.repdao/*.pem` - Identity files
- `~/.repdao/current` - Current identity pointer

### Environment Variables
- `REPDAO_NETWORK` - Default network (ic/local/custom)
- `REPDAO_CANISTER_ID` - Default canister ID
- `REPDAO_PEM` - Default identity file path

---

**🚀 RepDAO: Enterprise-grade reputation management made simple!**
