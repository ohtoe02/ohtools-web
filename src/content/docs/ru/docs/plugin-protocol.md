---
title: Protocol v1 и Result v1
description: Стабильные process и JSON-контракты между host и executable plugins.
---

# Protocol v1 и Result v1

Executable plugin реализует три verb:

```text
plugin-file manifest --protocol=1
plugin-file plan --protocol=1
plugin-file execute --protocol=1
```

`manifest` описывает CLI paths, typed arguments и flags, category и safety
properties. Operational и runbook commands поддерживают `plan`. `execute`
получает подтверждённый plan digest и возвращает canonical Result v1 JSON.

Host проверяет command collisions, reserved flags, argument layout, timeout,
output bounds, protocol identity, Result status и exit mapping.

## Result v1

JSON всегда содержит обязательные поля:

```json
{
  "schema_version": "1.0",
  "command": "system.info",
  "status": "pass",
  "checks": [],
  "data": {},
  "changes": [],
  "errors": []
}
```

Пустые `checks`, `changes` и `errors` всё равно обязательны. С `--json` stdout
содержит только этот документ.
