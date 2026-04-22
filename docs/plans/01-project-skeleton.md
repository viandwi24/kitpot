# Plan 01 — Project Skeleton & Monorepo Config

> Goal: Seluruh struktur directory, config files, dan dependencies sudah ada. Belum ada logic — hanya kerangka.

---

## Scope

- Root monorepo (Bun workspaces)
- Next.js 16 app shell (`apps/web/`)
- Foundry project skeleton (`contracts/`)
- Semua config files (tsconfig, tailwind, foundry.toml, .gitignore, etc.)
- shadcn/ui init

## Non-goals

- Tidak menulis logic apapun (contract maupun frontend)
- Tidak setup rollup/testnet
- Tidak run `bun dev` atau `forge build`

---

## Steps

### 1. Root monorepo

Buat `package.json` root:

```json
{
  "name": "kitpot",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "bun --cwd apps/web dev",
    "build": "bun --cwd apps/web build",
    "test:contracts": "forge test --root contracts -vv"
  }
}
```

Run `bun install` dari root untuk generate `bun.lock`.

### 2. Next.js 16 app

```bash
mkdir -p apps
bunx create-next-app@latest apps/web --typescript --tailwind --app --src-dir --no-git
```

Flags: TypeScript ✅, ESLint ✅, Tailwind CSS ✅, src/ dir ✅, App Router ✅, Turbopack ✅

### 3. Frontend dependencies

```bash
cd apps/web
bun add @initia/interwovenkit-react wagmi viem@2.x @tanstack/react-query
bun add @privy-io/react-auth@latest
cd ../..
```

### 4. shadcn/ui

```bash
bunx shadcn@latest init -t next --monorepo
bunx shadcn@latest add button card dialog badge input label separator avatar -c apps/web
```

### 5. Foundry project

```bash
forge init contracts --no-git
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
cd ..
```

Bersihkan template files dari `forge init` (Counter.sol, Counter.t.sol, dll).

### 6. .gitignore

```gitignore
node_modules/
.next/
out/
contracts/cache/
contracts/out/
.env
.env.local
bun.lock
```

### 7. Environment variables template

Buat `.env.example`:

```env
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_PRIVY_CLIENT_ID=

# Chain
NEXT_PUBLIC_KITPOT_RPC_URL=http://localhost:8545
NEXT_PUBLIC_KITPOT_CHAIN_ID=
NEXT_PUBLIC_CONTRACT_ADDRESS=

# Foundry deploy
PRIVATE_KEY=
KITPOT_RPC_URL=http://localhost:8545
```

---

## Output files

```
kitpot/
├── package.json
├── bun.lock
├── .gitignore
├── .env.example
├── apps/
│   └── web/
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.ts (atau CSS config Tailwind 4)
│       ├── components.json (shadcn)
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   └── page.tsx
│           ├── components/ui/  (shadcn components)
│           └── lib/
│               └── utils.ts (shadcn cn helper)
├── contracts/
│   ├── foundry.toml
│   ├── src/          (empty, siap untuk Plan 02)
│   ├── test/         (empty)
│   ├── script/       (empty)
│   └── lib/
│       └── openzeppelin-contracts/
└── .initia/          (empty dir, siap untuk submission)
```

---

## Dependencies on other plans

- **Blocks:** Plan 02-09 (semua butuh skeleton ini)
- **Blocked by:** nothing
