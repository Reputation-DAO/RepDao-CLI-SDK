#!/usr/bin/env node

console.log(`
🚀 Welcome to RepDAO!

Get started in 30 seconds:
  1. repdao setup      # First-time configuration
  2. repdao wizard     # Interactive command builder
  3. repdao --help     # Full command reference

Examples:
  repdao health <canister-id>                    # Check status
  repdao awardRep <cid> <user> 100 --reason "!" # Award points
  repdao getBalance <cid> <user>                 # Check balance

Need help? Check out:
  📖 README: https://github.com/Reputation-DAO/RepDao-CLI-SDK
  🐛 Issues: https://github.com/Reputation-DAO/RepDao-CLI-SDK/issues

Happy reputation building! 🎯
`);
