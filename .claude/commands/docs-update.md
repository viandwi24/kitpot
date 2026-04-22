Force a full documentation sync. Follow these steps:

1. Read all 5 builder docs:
   - `docs/builder/current.md`
   - `docs/builder/tasks.md`
   - `docs/builder/changelog.md`
   - `docs/builder/decisions.md`
   - `docs/builder/memory.md`

2. Scan conversation context for:
   - Completed work not yet in changelog.md
   - Active work not reflected in current.md
   - Discovered tasks not yet in tasks.md
   - Decisions made but not in decisions.md
   - Conventions/gotchas learned but not in memory.md

3. Update each file following the protocol in CLAUDE.md:
   - current.md: ensure active phase is accurate, files listed, next steps clear
   - tasks.md: move completed items to Done with date, add any new discovered tasks
   - changelog.md: add entries for any completed work (newest on top)
   - decisions.md: add any ADRs for decisions made this session
   - memory.md: add any new conventions or gotchas discovered

4. Report what was updated (list each file and what changed).

Rules:
- Read before write — always read current state first
- Never overwrite existing entries — append/prepend only
- Each entry must be self-contained (no "see above" references)
- Include file paths in current.md and changelog.md entries
- Include WHY in decisions.md and memory.md entries
