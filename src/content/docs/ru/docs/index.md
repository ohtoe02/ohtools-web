---
title: Документация
description: Начните с host и следуйте стабильным интерфейсам.
---

# Документация

`ohtools` — ориентированный на безопасность CLI для диагностики и управляемых
операций на Debian 10–13 и Ubuntu 20.04, 22.04 и 24.04 LTS.

Host — статический `linux/amd64` binary. Он отвечает за policy, audit,
confirmation, redaction, rendering, exit mapping, discovery плагинов и клиент
подписанного каталога. Доменное поведение обычно находится в executable
plugins.

## С чего начать

- [Установка и CLI](./install-cli/)
- [Конфигурация и policy](./configuration-policy/)
- [Модель безопасности](./security-model/)
- [Контракты protocol и Result](./plugin-protocol/)
- [Разработка и публикация плагина](./plugin-authoring/)

Портал объясняет контракты. Выполняемый host и подписанный каталог остаются
источниками истины для запуска и установки.
