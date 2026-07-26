---
title: Установка и CLI
description: Установка Debian-пакета и диагностика без скрытого повышения привилегий.
---

# Установка и CLI

Установите одобренный Debian-пакет:

```sh
sudo apt install ./ohtools_0.3.2_amd64.deb
```

Binary устанавливается в `/usr/bin/ohtools`, конфигурация и policy — в
`/etc/ohtools`, плагины — в `/usr/lib/ohtools/plugins`.

## Частые команды

```sh
ohtools system info
ohtools system health
ohtools disk usage /
ohtools service status nginx.service
ohtools plugin catalog list
ohtools plugin outdated
```

Каждая основная команда поддерживает `--json`. В JSON-режиме stdout содержит
ровно один документ Result v1, а diagnostics пишутся в stderr.

## Изменения

`ohtools` никогда не запускает `sudo`. При нехватке привилегий mutation
возвращает exit code `3` и инструкцию повторного запуска:

```sh
sudo ohtools service restart nginx.service --dry-run
sudo ohtools service restart nginx.service
```

`--yes` отключает только confirmation и не обходит policy, privilege, audit,
planning или verification.
