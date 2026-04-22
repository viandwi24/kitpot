# Changelog — Completed Changes Log

> Chronological record of every completed change. Newest on top.

---

## 2026-04-20 — Implementation plans created (10 plans)

Created 10 detailed implementation plans in `docs/plans/`. Each plan has clear scope, non-goals, file outputs, and dependency chain. Plans 01-09 are pure code writing (no testing/building). Plan 10 covers dev environment setup, contract deploy, and E2E testing — marked as requiring manual user confirmation before execution.

**Plans:**
01-project-skeleton, 02-contract-circle-core, 03-contract-payments-distribution, 04-contract-auto-signing, 05-contract-deploy-mock, 06-frontend-shell-providers-auth, 07-frontend-create-invite, 08-frontend-dashboard, 09-frontend-autosign-bridge, 10-dev-setup-deploy-testing

**Files:** `docs/plans/01-*.md` through `docs/plans/10-*.md`

---

## 2026-04-20 — Automated docs infrastructure setup

Established the AI builder docs system based on the Jiku reference pattern. This ensures context survives across sessions, decisions are logged, and no knowledge is lost.

**What was created:**
- `CLAUDE.md` — root instruction file with engineering standards, tech stack rules, project context map, and automated docs protocol
- `docs/builder/current.md` — active work & context recovery
- `docs/builder/tasks.md` — backlog populated from execution-plan.md (Day 1-7)
- `docs/builder/changelog.md` — this file
- `docs/builder/decisions.md` — ADR log (seeded with ADR-001)
- `docs/builder/memory.md` — persistent conventions & gotchas (seeded from tech-stack.md)
- `.claude/commands/docs-update.md` — slash command for manual docs sync

**Files:** `CLAUDE.md`, `docs/builder/*`, `.claude/commands/docs-update.md`
