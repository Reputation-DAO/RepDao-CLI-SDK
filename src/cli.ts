#!/usr/bin/env node
import { Command } from 'commander';
import { config as loadEnv } from 'dotenv';
import { identityFromPemFile } from './identity.js';
import { addTrustedAwarder, awardRep, getBalance } from './client.js';

loadEnv();

const program = new Command();
program
  .name('repdao')
  .description('Reputation DAO CLI wrapper')
  .option('--network <net>', 'ic | local | custom', process.env.REPDAO_NETWORK ?? 'ic')
  .option('--host <url>', 'host override (e.g. http://127.0.0.1:4943)')
  .option('--pem <path>', 'PEM for identity', process.env.REPDAO_PEM);

program
  .command('addTrustedAwarder')
  .argument('<canisterId>')
  .argument('<awarderPrincipal>')
  .argument('<name>')
  .action(async (cid: string, awarder: string, name: string) => {
    const opts = program.opts<{ network?: string; host?: string; pem?: string }>();
    const identity = opts.pem ? identityFromPemFile(opts.pem) : undefined;
    const res = await addTrustedAwarder(cid, awarder, name, { identity, network: opts.network, host: opts.host });
    console.log(res);
  });

program
  .command('awardRep')
  .argument('<canisterId>')
  .argument('<toPrincipal>')
  .argument('<amount>')
  .option('-r, --reason <text>')
  .action(async (cid: string, to: string, amount: string, cmd: Command) => {
    const opts = program.opts<{ network?: string; host?: string; pem?: string }>();
    const identity = opts.pem ? identityFromPemFile(opts.pem) : undefined;
    const { reason } = cmd.opts<{ reason?: string }>();
    const res = await awardRep(cid, to, BigInt(amount), reason, { identity, network: opts.network, host: opts.host });
    console.log(res);
  });

program
  .command('getBalance')
  .argument('<canisterId>')
  .argument('<principal>')
  .action(async (cid: string, p: string) => {
    const opts = program.opts<{ network?: string; host?: string }>();
    const bal = await getBalance(cid, p, { network: opts.network, host: opts.host });
    console.log(bal.toString());
  });

program.parseAsync(process.argv).catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
