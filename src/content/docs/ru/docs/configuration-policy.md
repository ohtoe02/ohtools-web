---
title: Конфигурация и policy
description: Отделение предпочтений оператора от системных ограничений безопасности.
---

# Конфигурация и policy

Host использует строгий YAML. Неизвестные поля и некорректные значения
отклоняются, а не игнорируются.

```text
/etc/ohtools/config.yaml
/etc/ohtools/policies.yaml
/etc/ohtools/plugins/<name>.yaml
```

System policy находится в `/etc/ohtools/policies.yaml`. Пользовательская
конфигурация, environment variables и flags не могут её ослабить.

## Каталог

```yaml
plugin_catalog:
  index_url: https://github.com/ohtoe02/ohtools-plugin-catalog/releases/latest/download/index-v1.json
  signature_url: https://github.com/ohtoe02/ohtools-plugin-catalog/releases/latest/download/index-v1.json.sig
  allowed_hosts:
    - github.com
    - release-assets.githubusercontent.com
    - objects.githubusercontent.com
```

Root и non-root browsing используют разные caches. Install и update всё равно
проходят полный mutation lifecycle.
