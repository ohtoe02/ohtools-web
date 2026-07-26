---
title: Install and use the CLI
description: Install the Debian package and run diagnostics without hidden privilege escalation.
---

# Install and use the CLI

Install an approved Debian package:

```sh
sudo apt install ./ohtools_0.3.2_amd64.deb
```

The binary is installed at `/usr/bin/ohtools`. Configuration and policy live
under `/etc/ohtools`; plugins are installed under `/usr/lib/ohtools/plugins`.

## Common commands

```sh
ohtools system info
ohtools system health
ohtools disk usage /
ohtools service status nginx.service
ohtools plugin catalog list
ohtools plugin outdated
```

Every primary command supports `--json`. JSON mode writes exactly one Result v1
document to stdout; diagnostics belong on stderr.

## Mutations

`ohtools` never invokes `sudo`. A mutation that requires privilege returns exit
code `3` with rerun guidance:

```sh
sudo ohtools service restart nginx.service --dry-run
sudo ohtools service restart nginx.service
```

Use `--yes` only to bypass confirmation. It cannot bypass policy, privilege,
audit, planning, or verification.
