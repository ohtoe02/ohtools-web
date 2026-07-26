---
title: Разработка и публикация плагинов
description: Прямая Go-реализация или ограниченный декларативный toolchain.
---

# Разработка и публикация плагинов

Исходники first-party plugins находятся в
[`ohtoe02/ohtools-plugins`](https://github.com/ohtoe02/ohtools-plugins), а
installable metadata — в курируемом
[`ohtoe02/ohtools-plugin-catalog`](https://github.com/ohtoe02/ohtools-plugin-catalog).

Плагин может напрямую реализовать protocol v1 на Go. Планируемый
`ohtools-plugin-build` упаковывает строгий декларативный YAML и sealed assets в
автономный static executable, не меняя host protocol.

## Порядок публикации

1. Протестировать и опубликовать immutable plugin assets.
2. Записать точные URL, size, SHA-256, manifest, description и minimum host
   version в catalog pull request.
3. Выполнить secretless validation и sandboxed manifest inspection.
4. Опубликовать следующий монотонно возрастающий signed snapshot.
5. Проверить released host с `releases/latest` в ограниченном non-root
   container.

Нельзя переиспользовать tag, заменять release asset, уменьшать catalog sequence
или публиковать placeholder plugins.
