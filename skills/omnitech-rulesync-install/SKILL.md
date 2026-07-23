---
name: omnitech-rulesync-install
description: Inspect a repository and preview, install, update, migrate, or audit Omnitech Rulesync rules, workflows, commands, and skills across Claude Code, Codex, Cursor, Windsurf, and GitHub Copilot.
---
# Install Omnitech Rulesync
When `omnitech-rulesync` is not installed, invoke it from the target repository with `pnpm dlx --allow-build=@omnitech/rulesync github:omnitech-solutions/omnitech-rulesync#v0.1.2` followed by the command and arguments below.

1. Resolve the repository root.
2. Run `omnitech-rulesync inspect <target> --json`.
3. Run `omnitech-rulesync plan <target> --json`.
4. Present evidence, profiles, workflows, sources, targets, conflicts, and changed paths.
5. Pause for explicit approval.
6. Run `omnitech-rulesync install <target> --yes`.
7. Run `omnitech-rulesync check <target>` and report evidence.

Never pass `--force` without explicit approval. Never alter unmanaged configuration. For migrations, read `references/migration.md` first.
