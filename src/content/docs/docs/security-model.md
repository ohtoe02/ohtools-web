---
title: Security model
description: The invariants that every host and plugin operation must preserve.
---

# Security model

The host treats local state, plugin output, downloaded metadata, and operator
input as untrusted until checked.

- Operational commands never invoke a shell.
- Trusted executables are resolved to absolute paths and receive explicit argv.
- Caller `PATH`, current directory, proxy variables, and credential-bearing
  URLs are not trusted.
- Mutations require policy authorization, durable audit, a deterministic plan,
  confirmation unless `--yes`, and post-change verification.
- `--dry-run` cannot mutate the system.
- Audit is fail-closed for mutations.
- Output, nested plugin JSON, errors, debug messages, and audit fields are
  recursively redacted.
- Catalog bytes are bounded, signed, expiry-checked, and protected against
  rollback.
- Plugin files pass ownership, symlink, permission, size, digest, manifest, and
  collision checks before execution.

Read-only operations may return a partial Result when audit or a dependency is
unavailable. They must not panic.
