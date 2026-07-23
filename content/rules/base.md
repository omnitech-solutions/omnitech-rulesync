---
root: true
targets: ["*"]
description: Omnitech engineering and automatic workflow routing contract
---
# Omnitech engineering contract

- Inspect existing code and repository instructions before proposing changes.
- Prefer the smallest complete solution that preserves current architecture.
- Never claim completion without current verification evidence.
- Preserve user changes and unmanaged agent configuration.
- Treat authentication, authorization, migrations, secrets, external side effects, and destructive operations as high risk.

## Automatic routing

Route every request to the closest generated workflow without requiring a slash command. Read the `omnitech-router` skill when routes overlap. Activate every skill named by a workflow stage before performing that stage. Use discovery for ambiguity and trivial-change only for clear localized work without high-risk signals.
