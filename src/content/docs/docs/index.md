---
title: Documentation
description: Start with the host, then follow the stable interfaces.
---

# Documentation

`ohtools` is a safety-oriented CLI for routine diagnostics and controlled
operations on Debian 10–13 and Ubuntu 20.04, 22.04, and 24.04 LTS.

The host is a static `linux/amd64` binary. It owns policy, audit, confirmation,
redaction, rendering, exit mapping, plugin discovery, and the signed catalog
client. Domain behavior normally belongs in executable plugins.

## Start here

- [Install and use the CLI](./install-cli/)
- [Configure host policy](./configuration-policy/)
- [Understand the security model](./security-model/)
- [Read protocol and Result contracts](./plugin-protocol/)
- [Author and publish a plugin](./plugin-authoring/)

The portal is explanatory. The running host and the signed catalog remain the
authority for execution and installation.
