#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question: string): Promise<string> => 
  new Promise(resolve => rl.question(question, resolve));

const select = async (question: string, options: string[]): Promise<string> => {
  console.log(question);
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
  const answer = await ask('Choose (1-' + options.length + '): ');
  const index = parseInt(answer) - 1;
  return options[index] || options[0];
};

function loadConfig() {
  const configPath = join(homedir(), '.repdao', 'config.json');
  if (existsSync(configPath)) {
    return JSON.parse(readFileSync(configPath, 'utf8'));
  }
  return {};
}

async function wizard() {
  console.log('🧙 RepDAO Command Wizard\n');
  
  const config = loadConfig();
  const canisterId = config.canisterId || await ask('Canister ID: ');
  
  if (!canisterId) {
    console.log('❌ Canister ID required. Run: repdao setup');
    process.exit(1);
  }

  const action = await select('What would you like to do?', [
    'Award reputation points',
    'Check someone\'s balance', 
    'View leaderboard',
    'Manage trusted awarders',
    'Check canister health',
    'Configure decay settings'
  ]);

  let command = '';

  switch (action) {
    case 'Award reputation points':
      const recipient = await ask('Recipient principal: ');
      const amount = await ask('Amount: ');
      const reason = await ask('Reason (optional): ');
      command = `repdao awardRep ${canisterId} ${recipient} ${amount}${reason ? ` --reason "${reason}"` : ''}`;
      break;
      
    case 'Check someone\'s balance':
      const user = await ask('User principal: ');
      command = `repdao getBalance ${canisterId} ${user}`;
      break;
      
    case 'View leaderboard':
      const top = await ask('Top N users [10]: ') || '10';
      command = `repdao leaderboard ${canisterId} ${top} 0`;
      break;
      
    case 'Manage trusted awarders':
      const awarderAction = await select('Awarder action:', ['Add awarder', 'Remove awarder', 'List awarders']);
      if (awarderAction === 'Add awarder') {
        const awarder = await ask('Awarder principal: ');
        const name = await ask('Awarder name: ');
        command = `repdao addTrustedAwarder ${canisterId} ${awarder} "${name}"`;
      } else if (awarderAction === 'Remove awarder') {
        const awarder = await ask('Awarder principal: ');
        command = `repdao removeTrustedAwarder ${canisterId} ${awarder}`;
      } else {
        command = `repdao getTrustedAwarders ${canisterId}`;
      }
      break;
      
    case 'Check canister health':
      command = `repdao health ${canisterId}`;
      break;
      
    case 'Configure decay settings':
      console.log('Current decay config:');
      console.log('Run this first: repdao getDecayConfig ' + canisterId);
      const rate = await ask('Decay rate (basis points, 500 = 5%): ');
      const interval = await ask('Decay interval (seconds, 2592000 = 30 days): ');
      const threshold = await ask('Min threshold (points below which no decay): ');
      const grace = await ask('Grace period (seconds): ');
      const enabled = await ask('Enable decay? (true/false): ');
      command = `repdao configureDecay ${canisterId} ${rate} ${interval} ${threshold} ${grace} ${enabled}`;
      break;
  }

  console.log('\n🎯 Generated command:');
  console.log('  ' + command);
  console.log('\n📋 Copy and run this command, or press Enter to execute now');
  
  const execute = await ask('Execute now? (y/N): ');
  if (execute.toLowerCase() === 'y') {
    const { spawn } = await import('node:child_process');
    const args = command.split(' ').slice(1);
    spawn('repdao', args, { stdio: 'inherit' });
  }
  
  rl.close();
}

wizard().catch(console.error);
