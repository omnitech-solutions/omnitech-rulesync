# Omnitech Rulesync

Repository-aware AI rules and workflow installation for Claude Code, Codex, Cursor, Windsurf, and GitHub Copilot.

## Run inside a target repository

No global installation is required. From the repository that should receive the rules and skills, run:

```bash
pnpm dlx github:omnitech-solutions/omnitech-rulesync plan
pnpm dlx github:omnitech-solutions/omnitech-rulesync install --yes
pnpm dlx github:omnitech-solutions/omnitech-rulesync check
```

For a private GitHub repository, use the SSH package spec with an authenticated GitHub key:

```bash
pnpm dlx git+ssh://git@github.com/omnitech-solutions/omnitech-rulesync.git plan
```

To pin the tool in a project instead of downloading it for each invocation:

```bash
pnpm add --save-dev github:omnitech-solutions/omnitech-rulesync
pnpm exec omnitech-rulesync plan
pnpm exec omnitech-rulesync install --yes
```

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
