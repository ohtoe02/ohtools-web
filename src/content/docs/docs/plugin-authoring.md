---
title: Author and publish plugins
description: Choose direct Go implementation or the constrained declarative toolchain.
---

# Author and publish plugins

First-party source lives in
[`ohtoe02/ohtools-plugins`](https://github.com/ohtoe02/ohtools-plugins).
Installable metadata lives in the curated
[`ohtoe02/ohtools-plugin-catalog`](https://github.com/ohtoe02/ohtools-plugin-catalog).

Plugins may implement protocol v1 directly in Go. The planned
`ohtools-plugin-build` toolchain packages strict declarative YAML and sealed
assets into a standalone static executable without changing the host protocol.

## Publication order

1. Test and publish immutable plugin binary assets.
2. Record exact URL, size, SHA-256, manifest, description, and minimum host
   version in a catalog pull request.
3. Run secretless catalog validation and sandboxed manifest inspection.
4. Publish the next monotonically increasing signed snapshot.
5. Verify the released host against `releases/latest` in a restricted
   non-root container.

Never reuse a tag, replace a release asset, decrease a catalog sequence, or
publish placeholder plugins.
