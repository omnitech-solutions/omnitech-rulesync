# Omnitech Rulesync

Repository-aware AI rules and workflow installation for Claude Code, Codex, Cursor, Windsurf, and GitHub Copilot.

```bash
pnpm install
pnpm build
node dist/cli.js inspect /path/to/repository --json
node dist/cli.js plan /path/to/repository --json
node dist/cli.js install /path/to/repository --yes
node dist/cli.js check /path/to/repository
```

The installer commits canonical `.rulesync` sources, `omnitech-rulesync.yaml`, and `omnitech-rulesync.lock.yaml`. Agent-specific outputs are reproducible and should not be maintained by hand.

## Target configuration
```yaml
schemaVersion: 1
targets: [claudecode, codexcli, cursor, windsurf, copilot]
profiles: { include: [nextjs, langgraph], exclude: [] }
sources:
  - source: vercel-labs/agent-skills
    ref: main
    skills: [react-best-practices]
    trust: vendor
workflows: { policy: risk-adaptive, include: [], exclude: [] }
```

Profiles, detectors, sources, workflows, gates, prompt signals, and targets are catalog data. Installation previews by default, never overwrites unmanaged files, and requires `--force` for locally modified owned files.
