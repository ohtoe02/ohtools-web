---
title: Модель безопасности
description: Инварианты, обязательные для host и plugin operations.
---

# Модель безопасности

Host считает локальное состояние, plugin output, загруженные metadata и
операторский ввод недоверенными до завершения проверок.

- Operational commands не запускают shell.
- Trusted executables разрешаются в абсолютные пути и получают явный argv.
- Caller `PATH`, current directory, proxy variables и credential-bearing URLs
  не считаются доверенными.
- Mutations требуют policy authorization, durable audit, deterministic plan,
  confirmation без `--yes` и post-change verification.
- `--dry-run` не изменяет систему.
- Audit работает fail-closed для mutations.
- Output, вложенный plugin JSON, errors, debug и audit fields рекурсивно
  редактируются.
- Catalog bytes ограничены, подписаны, проверены по сроку и защищены от
  rollback.
- Plugin files проверяются по ownership, symlink, permissions, size, digest,
  manifest и command collisions.

Read-only operation может вернуть partial Result при недоступности audit или
dependency, но не должна panic.
