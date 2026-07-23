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

## Jeff Allan Claude Skills routing

The reviewed community source `jeffallan/claude-skills` is enabled by the base profile. Workflow commands explicitly route feature, debugging, testing, review, security, and browser-verification stages to the relevant external skills. Detected profiles add focused specialists such as `typescript-pro`, `nextjs-developer`, `react-expert`, `rails-expert`, `postgres-pro`, `prompt-engineer`, and `rag-architect`.

External skills remain allowlisted in `catalog/sources/trusted.yaml` and use the source's `main` ref. Run `omnitech-rulesync plan` to review the selected source and skills before approving installation.
