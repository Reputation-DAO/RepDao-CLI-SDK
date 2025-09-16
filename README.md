````markdown
# repdao

Reputation DAO JS **Client + CLI**.  
Use it as a **global CLI tool** for interacting with your deployed canisters, or import it as a **TypeScript/JavaScript SDK** in your projects. No `dfx` runtime required.

---

## 📦 Installation

### CLI (global install)

```bash
npm i -g repdao
repdao --help
````

This makes the `repdao` command available globally.

### API (project dependency)

```bash
npm i repdao
```

Then import in code:

```ts
import { awardRep, getBalance, health } from 'repdao';
import { identityFromPemFile } from 'repdao/identity';
```

---

## 🚀 CLI Usage

Run `repdao --help` to see all available commands.

```bash
Usage: repdao [options] [command]

Reputation DAO CLI wrapper

Options:
  --network <net>     ic | local | custom (default: "ic")
  --host <url>        host override (e.g. http://127.0.0.1:4943)
  --pem <path>        PEM for identity
  -h, --help          display help for command
```

### Common Commands

* **Award Reputation**

  ```bash
  repdao awardRep <canisterId> <toPrincipal> <amount> --reason "helpful"
  ```

* **Revoke Reputation**

  ```bash
  repdao revokeRep <canisterId> <fromPrincipal> <amount> --reason "abuse"
  ```

* **Query Balance**

  ```bash
  repdao getBalance <canisterId> <principal>
  ```

* **Inspect Health**

  ```bash
  repdao health <canisterId>
  ```

* **List Trusted Awarders**

  ```bash
  repdao getTrustedAwarders <canisterId>
  ```

* **Identity Management**

  ```bash
  repdao id:list
  repdao id:new alice
  repdao id:use alice
  repdao id:whoami
  ```

> Run `repdao help <command>` for detailed usage of a specific command.

---

## 📚 API Usage

All functions mirror the canister methods and are available in TypeScript with proper typings.

```ts
import {
  awardRep,
  revokeRep,
  getBalance,
  health,
  configureDecay
} from 'repdao';

import { identityFromPemFile } from 'repdao/identity';

const cid = "txygj-baaaa-aaaam-qd4bq-cai"; // canister id
const user = "ly6rq-d4d23-63ct7-e2j6c-257jk-627xo-wwwd4-lnxm6-qt7xb-573bv-bqe"; // principal

async function main() {
  // load identity
  const id = identityFromPemFile("~/.repdao/alice.pem");

  // award reputation
  const res = await awardRep(cid, user, 100n, "great work", { identity: id, network: "ic" });
  console.log("Award response:", res);

  // query balance
  const bal = await getBalance(cid, user, { identity: id, network: "ic" });
  console.log("User balance:", bal.toString());

  // check system health
  const h = await health(cid, { network: "ic" });
  console.log("Health:", h);
}

main().catch(console.error);
```

---

## 🔑 Identity Management

The CLI maintains its own identity store under `~/.repdao`.
Identities are PEM files (`.pem`) with secp256k1 keys.

* **Create new identity**

  ```bash
  repdao id:new alice
  ```

* **Switch identity**

  ```bash
  repdao id:use alice
  ```

* **Import PEM**

  ```bash
  repdao id:import bob /path/to/bob.pem
  ```

* **Export PEM**

  ```bash
  repdao id:export alice
  ```

* **Sync with dfx**

  ```bash
  repdao id:sync
  ```

If no identity is set, CLI will fall back to your `dfx` default identity if available.

---

## 🛠 Development

Clone the repo and build:

```bash
git clone https://github.com/<your-org>/repdao.git
cd repdao
npm install
npm run build
```

Link globally for local testing:

```bash
npm link
repdao --help
```

Unlink when done:

```bash
npm unlink -g repdao
```

---

## 📖 Notes

* Requires **Node.js 18+**
* Works with both **IC mainnet** (`--network ic`) and **local replica** (`--network local`).
* All BigInt values (`Nat`) are returned as native JavaScript `bigint`.

---

## 📜 License

MIT © 2025 Ayush Kumar Gaur

```
```
