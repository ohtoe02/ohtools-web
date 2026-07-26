# ohtools web

The public, read-only developer portal for
[`ohtools`](https://github.com/ohtoe02/ohtools): bilingual documentation,
schema-driven declarative module reference, and a cryptographically verified
plugin catalog.

## Trust model

- Catalog bytes are fetched only from allowlisted, credential-free GitHub
  release URLs.
- `index-v1.json` is bounded, schema-checked, expiry-checked, and verified with
  the pinned Ed25519 key before any page is generated.
- Published state prevents sequence rollback and same-sequence digest changes.
- Upstream descriptions are rendered as text. Plugin binaries and external
  code are never downloaded or executed.
- The browser receives a static site and makes no catalog requests.

## Development

Node.js 24 and pnpm 10.11.1 are required.

```sh
corepack enable
pnpm install
pnpm sync:catalog
pnpm dev --background
```

Quality gates:

```sh
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:e2e
SITE_BASE=/ohtools-web pnpm astro build
```

The generated catalog and public state file are intentionally not tracked.
They are recreated from the signed release during build.

## Declarative schema status

The module reference currently uses the approved `declarative/v1` contract
preview. Production Pages deployment is gated by the
`DECLARATIVE_SCHEMA_RELEASE_READY` repository variable until an immutable
schema artifact URL and SHA-256 are published by `ohtools-plugins` and pinned
in this repository.

## Deployment

GitHub Actions builds the static site for
`https://ohtoe02.github.io/ohtools-web/`. The workflow runs on `main`, every
six hours, and by manual dispatch. A validation failure leaves the previous
Pages deployment untouched.

## License

Publicly visible, proprietary source. See [LICENSE](LICENSE).
