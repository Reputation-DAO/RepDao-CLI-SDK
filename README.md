# repdao

> 🚀 **The Ultimate Reputation DAO SDK + CLI** - So easy, even your grandma can use it!

`repdao` is the most user-friendly way to interact with Reputation DAO canisters. Whether you're a developer building apps or a community manager awarding points, we've got you covered.

## ✨ Features

- 🎯 **Dead Simple CLI** - Interactive wizards and helpful error messages
- 🔌 **Fully Typed SDK** - Promise-based wrappers with TypeScript support
- 🧙 **Setup Wizard** - Get started in 30 seconds
- 🪪 **Identity Management** - Works with dfx or standalone
- 📊 **Rich Output** - Beautiful formatting and helpful status messages
- ⚡ **Smart Defaults** - Remembers your settings
- 🛡️ **Bulletproof** - Comprehensive error handling and validation

---

## 🚀 Quick Start

### 1. Install globally
```bash
npm install -g repdao
```

### 2. Run setup wizard
```bash
repdao setup
```

### 3. Start using it!
```bash
# Interactive command builder
repdao wizard

# Check canister health
repdao health

# Award points
repdao awardRep <canister-id> <user-principal> 100 --reason "Great contribution!"
```

---

## 🧙 Interactive Mode

Never remember command syntax again! Use our interactive wizards:

```bash
# First-time setup
repdao setup

# Interactive command builder
repdao wizard
```

The wizard walks you through common tasks:
- 🎯 Award reputation points
- 💰 Check balances
- 🏆 View leaderboards
- 👥 Manage trusted awarders
- 🏥 Check canister health
- ⚙️ Configure decay settings

---

## 📖 Common Commands

### Award Points
```bash
# Basic award
repdao awardRep <canister-id> <user> 100

# With reason
repdao awardRep <canister-id> <user> 100 --reason "Excellent work!"

# Using default canister (set in config)
repdao awardRep <user> 100 --reason "Great job!"
```

### Check Balances
```bash
# Check someone's balance
repdao getBalance <canister-id> <user>

# Check your own stats
repdao myStats <canister-id> <your-principal>
```

### Leaderboard
```bash
# Top 10 users
repdao leaderboard <canister-id> 10 0

# Top 20, starting from position 10
repdao leaderboard <canister-id> 20 10
```

### Canister Health
```bash
# Detailed health check
repdao health <canister-id>
```

### Identity Management
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
```

---

## ⚙️ Configuration

### Config File: `~/.repdao/config.json`
```json
{
  "network": "ic",
  "canisterId": "your-default-canister-id"
}
```

### Environment Variables
```bash
export REPDAO_NETWORK=ic
export REPDAO_CANISTER_ID=your-canister-id
export REPDAO_PEM=/path/to/identity.pem
```

### Command Line Options
```bash
repdao --network local --canister <id> --pem ./identity.pem <command>
```

---

## 🔌 SDK Usage

### Basic Example
```typescript
import { awardRep, getBalance } from 'repdao';
import { identityFromPemFile } from 'repdao/identity';

const identity = identityFromPemFile('~/.repdao/admin.pem');
const opts = { identity, network: 'ic' as const };

// Award points
await awardRep('canister-id', 'user-principal', 100n, 'Great work!', opts);

// Check balance
const balance = await getBalance('canister-id', 'user-principal', opts);
console.log(`Balance: ${balance} points`);
```

### Advanced Example
```typescript
import { 
  multiAward, 
  leaderboard, 
  health,
  configureDecay 
} from 'repdao';

// Batch award to multiple users
await multiAward('canister-id', [
  ['user1', 100n, 'Great contribution'],
  ['user2', 50n, 'Good work'],
  ['user3', 25n, 'Thanks for participating']
], true, opts); // atomic = true

// Get top 10 leaderboard
const leaders = await leaderboard('canister-id', 10n, 0n, opts);
leaders.forEach(([principal, points], i) => {
  console.log(`${i + 1}. ${principal}: ${points} points`);
});

// Check canister health
const status = await health('canister-id', opts);
console.log(`Status: ${status.paused ? 'Paused' : 'Active'}`);
console.log(`Cycles: ${status.cycles}`);
```

---

## 🛠️ Admin Commands

### Manage Awarders
```bash
# Add trusted awarder
repdao addTrustedAwarder <canister-id> <awarder-principal> "Awarder Name"

# Remove awarder
repdao removeTrustedAwarder <canister-id> <awarder-principal>

# List all awarders
repdao getTrustedAwarders <canister-id>
```

### Configure Decay
```bash
# Set decay parameters
repdao configureDecay <canister-id> 500 2592000 10 2592000 true
# Rate: 5% (500 basis points)
# Interval: 30 days (2592000 seconds)
# Min threshold: 10 points
# Grace period: 30 days
# Enabled: true
```

### Cycles Management
```bash
# Check cycles balance
repdao cycles_balance <canister-id>

# Top up canister (attach cycles)
repdao topUp <canister-id>

# Return cycles to factory
repdao returnCyclesToFactory <canister-id> 100000000000
```

---

## 🚨 Error Handling

The CLI provides helpful error messages:

```bash
❌ Canister ID required. Use --canister <id> or run: repdao setup
❌ Invalid principal format: not-a-principal
❌ Expected number, got: abc
❌ Identity error: PEM file not found
```

Common solutions:
- Run `repdao setup` for first-time configuration
- Use `repdao id:new <name>` to create an identity
- Check your canister ID format
- Ensure you have the right permissions

---

## 🔍 Troubleshooting

### "Canister ID required"
```bash
# Set default canister
repdao setup

# Or use --canister flag
repdao health --canister <your-canister-id>
```

### "Identity error"
```bash
# Create new identity
repdao id:new admin

# Or import existing
repdao id:import admin ./path/to/identity.pem

# Or sync from dfx
repdao id:sync
```

### "Network connection failed"
```bash
# Try local network
repdao --network local health <canister-id>

# Or specify custom host
repdao --host http://127.0.0.1:4943 health <canister-id>
```

---

## 📚 Full Command Reference

| Command | Description |
|---------|-------------|
| `setup` | 🚀 First-time setup wizard |
| `wizard` | 🧙 Interactive command builder |
| `health` | 🏥 Check canister status |
| `awardRep` | 🎯 Award reputation points |
| `multiAward` | 🎯 Award to multiple users |
| `revokeRep` | ❌ Revoke points (admin only) |
| `getBalance` | 💰 Check user balance |
| `leaderboard` | 🏆 View top users |
| `myStats` | 📊 Get user statistics |
| `getTrustedAwarders` | 👥 List awarders |
| `addTrustedAwarder` | ➕ Add awarder (admin) |
| `removeTrustedAwarder` | ➖ Remove awarder (admin) |
| `configureDecay` | ⚙️ Set decay parameters |
| `processBatchDecay` | 🔄 Process decay manually |
| `topUp` | ⛽ Add cycles to canister |
| `withdrawCycles` | 💸 Withdraw cycles |
| `returnCyclesToFactory` | 🔄 Return cycles to factory |

### Identity Commands
| Command | Description |
|---------|-------------|
| `id:list` | 📋 List all identities |
| `id:whoami` | 🤔 Show current principal |
| `id:new <name>` | ➕ Create new identity |
| `id:use <name>` | 🔄 Switch identity |
| `id:import <name> <file>` | 📥 Import PEM file |
| `id:export <name>` | 📤 Export PEM file |
| `id:sync` | 🔄 Sync with dfx identities |

---

## 🤝 Support

- 📖 **Documentation**: This README + `repdao --help`
- 🧙 **Interactive Help**: `repdao wizard`
- 🐛 **Issues**: [GitHub Issues](https://github.com/reputation-dao/repdao/issues)
- 💬 **Community**: Join our Discord/Telegram

---

## 📄 License

MIT © Reputation DAO Contributors

---

**Made with ❤️ for the Internet Computer community**

