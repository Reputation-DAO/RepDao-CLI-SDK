#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { Principal } from '@dfinity/principal';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question: string): Promise<string> => 
  new Promise(resolve => rl.question(question, resolve));

async function setup() {
  console.log('🚀 RepDAO Setup Wizard\n');
  
  const repdaoDir = join(homedir(), '.repdao');
  if (!existsSync(repdaoDir)) {
    mkdirSync(repdaoDir, { recursive: true });
    console.log('✅ Created ~/.repdao directory');
  }

  const configPath = join(repdaoDir, 'config.json');
  let config: any = {};
  
  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
    console.log('📝 Found existing config');
  }

  const allowedNetworks = ['ic', 'local', 'custom'];
  if (typeof config.network === 'string') {
    const normalized = config.network.toLowerCase();
    if (allowedNetworks.includes(normalized)) {
      config.network = normalized;
    } else {
      config.network = 'ic';
    }
  } else {
    config.network = 'ic';
  }

  console.log('\n🔧 Configuration:');

  let network = '';
  while (true) {
    const raw = (await ask(`Network (ic/local/custom) [${config.network}]: `)).trim();
    const val = raw || config.network;
    const normalized = val.toLowerCase();
    if (['ic', 'local', 'custom'].includes(normalized)) {
      network = normalized;
      break;
    }
    console.log('❌ Invalid network. Choose ic, local, or custom.');
  }

  let canisterId = '';
  while (true) {
    const raw = (await ask(`Default canister ID [${config.canisterId || ''}]: `)).trim();
    if (!raw) {
      canisterId = config.canisterId || '';
      break;
    }
    try {
      Principal.fromText(raw);
      canisterId = raw;
      break;
    } catch {
      console.log('❌ Invalid canister ID format. Enter a valid principal or leave blank.');
    }
  }
  
  config = { network, canisterId };
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('\n✅ Setup complete!');
  console.log('\n📚 Quick start:');
  console.log('  repdao wizard          # Interactive command builder');
  console.log('  repdao health          # Check canister status');
  console.log('  repdao id:new admin    # Create new identity');
  
  rl.close();
}

setup().catch(console.error);
