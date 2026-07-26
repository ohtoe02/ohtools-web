---
title: Configuration and policy
description: Keep operator preferences separate from system-enforced safety.
---

# Configuration and policy

Host configuration is strict YAML. Unknown fields and malformed values are
rejected instead of silently ignored.

```text
/etc/ohtools/config.yaml
/etc/ohtools/policies.yaml
/etc/ohtools/plugins/<name>.yaml
```

System policy is rooted at `/etc/ohtools/policies.yaml`. User configuration,
environment variables, and flags cannot weaken it.

## Catalog defaults

```yaml
plugin_catalog:
  index_url: https://github.com/ohtoe02/ohtools-plugin-catalog/releases/latest/download/index-v1.json
  signature_url: https://github.com/ohtoe02/ohtools-plugin-catalog/releases/latest/download/index-v1.json.sig
  allowed_hosts:
    - github.com
    - release-assets.githubusercontent.com
    - objects.githubusercontent.com
```

Root and non-root catalog browsing use separate caches. Installation and update
still require the mutation lifecycle.
