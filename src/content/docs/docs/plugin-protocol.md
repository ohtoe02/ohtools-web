---
title: Protocol v1 and Result v1
description: Stable process and JSON contracts between the host and executable plugins.
---

# Protocol v1 and Result v1

An executable plugin implements three verbs:

```text
plugin-file manifest --protocol=1
plugin-file plan --protocol=1
plugin-file execute --protocol=1
```

`manifest` describes first-class CLI paths, typed arguments and flags, category,
and safety properties. Operational and runbook commands support `plan`.
`execute` receives the confirmed plan digest and returns canonical Result v1
JSON.

The host validates command collisions, reserved flags, argument layout,
timeouts, output bounds, protocol identity, Result status, and exit mapping.

## Result v1

JSON results always include:

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

Empty `checks`, `changes`, and `errors` arrays are still required. With
`--json`, stdout contains only this document.
