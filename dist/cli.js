#!/usr/bin/env node
import { Command } from 'commander';
import { config as loadEnv } from 'dotenv';
import { identityFromPemFile } from './identity.js';
import { addTrustedAwarder, awardRep, getBalance } from './client.js';
loadEnv(); // allows REPDAO_PEM=... in .env
const program = new Command()
    .name('repdao')
    .description('Reputation DAO CLI (no dfx runtime)')
    .version('0.1.0');
function resolveIdentity(pemPath) {
    const pem = process.env.REPDAO_PEM;
    if (pemPath)
        return identityFromPemFile(pemPath);
    if (pem)
        return identityFromPemFile(pem);
    return undefined; // anonymous for queries
}
program
    .option('--network <ic|local|host>', 'network or custom host', 'ic')
    .option('--pem <path>', 'PEM file for identity (owner/trusted awarder)');
program
    .command('add-trusted-awarder')
    .argument('<cid>', 'child canister id')
    .argument('<awarderPrincipal>', 'principal to trust')
    .argument('<name>', 'label')
    .action(async (cid, awarder, name, cmd) => {
    const opts = program.opts();
    const identity = resolveIdentity(opts.pem);
    const res = await addTrustedAwarder(cid, awarder, name, { identity, network: opts.network });
    console.log(res);
});
program
    .command('award-rep')
    .argument('<cid>')
    .argument('<toPrincipal>')
    .argument('<amount>', 'Nat')
    .option('--reason <text>', 'optional reason')
    .action(async (cid, to, amount, cmd) => {
    const opts = program.opts();
    const identity = resolveIdentity(opts.pem);
    const res = await awardRep(cid, to, BigInt(amount), cmd.reason, { identity, network: opts.network });
    console.log(res);
});
program
    .command('get-balance')
    .argument('<cid>')
    .argument('<principal>')
    .action(async (cid, p) => {
    const opts = program.opts();
    const bal = await getBalance(cid, p, { network: opts.network });
    console.log(bal.toString());
});
program.parseAsync(process.argv).catch((e) => {
    console.error(e?.message ?? e);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map