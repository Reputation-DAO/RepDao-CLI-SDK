#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

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

  console.log('\n🔧 Configuration:');
  
  const network = await ask(`Network (ic/local) [${config.network || 'ic'}]: `) || config.network || 'ic';
  const canisterId = await ask(`Default canister ID [${config.canisterId || ''}]: `) || config.canisterId || '';
  
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
