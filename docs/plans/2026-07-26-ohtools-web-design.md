# ohtools web portal design

**Date:** 2026-07-26
**Status:** Approved

## Goal

Publish a bilingual, read-only developer portal for ohtools documentation,
declarative module reference, and the verified public plugin catalog.

## Architecture

The public `ohtoe02/ohtools-web` repository owns the Astro/Starlight site,
English and Russian content, upstream validation, and GitHub Pages automation.
The site is completely static. It has no backend, accounts, forms, analytics,
cookies, or browser-side access to GitHub.

Build-time adapters fetch an immutable declarative schema release and the
latest signed catalog snapshot. They validate size, origin, schema, digest,
Ed25519 signature, expiry, and rollback state before normalizing upstream data
for presentation. A failed validation prevents a new deployment and leaves the
previous Pages version intact.

## Information architecture

English is served at the repository root and Russian under `/ru/`. Both
locales expose documentation, declarative module reference, and plugin catalog
sections. The portal uses a calm, high-density developer-documentation visual
language with strong typographic hierarchy, explicit trust states, and
accessible light and dark themes.

The catalog displays only plugins and versions present in the signed
`catalog-index-v1`. The declarative reference is generated from the released
schema and enriched with local bilingual explanations and examples.

## Security and scope

Upstream descriptions are rendered as plain text. Plugin binaries and external
code are never downloaded or executed. Fetches use credential-free HTTPS,
bounded responses, an allowlist of GitHub release hosts, and a redirect limit.
The repository embeds only the catalog public verification key.

The first release excludes a visual YAML editor, plugin installation from the
browser, authentication, draft plugin discovery, custom domains, and runtime
services.

