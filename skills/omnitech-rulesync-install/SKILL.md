---
name: omnitech-rulesync-install
description: Inspect a repository and preview, install, update, migrate, or audit Omnitech Rulesync rules, workflows, commands, and skills across Claude Code, Codex, Cursor, Windsurf, and GitHub Copilot.
---
# Install Omnitech Rulesync
1. Resolve the repository root.
2. Run `omnitech-rulesync inspect <target> --json`.
3. Run `omnitech-rulesync plan <target> --json`.
4. Present evidence, profiles, workflows, sources, targets, conflicts, and changed paths.
5. Pause for explicit approval.
6. Run `omnitech-rulesync install <target> --yes`.
7. Run `omnitech-rulesync check <target>` and report evidence.

Never pass `--force` without explicit approval. Never alter unmanaged configuration. For migrations, read `references/migration.md` first.
