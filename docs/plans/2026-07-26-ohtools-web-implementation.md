# ohtools Web Portal Implementation Plan

**Goal:** Build and publish a bilingual static developer portal for ohtools.

**Architecture:** Astro and Starlight render local MDX plus normalized,
verified upstream data. Build-time validation fails closed before GitHub Pages
deployment.

**Tech stack:** Node.js 24, pnpm, TypeScript, Astro, Starlight, Vitest,
Playwright, Pagefind, AJV, and Node.js Ed25519 verification.

## Tasks

1. Configure the repository, bilingual Starlight routes, visual system, and
   proprietary project metadata.
2. Add test-first catalog parsing, signature verification, normalization,
   rollback checks, and fixture coverage.
3. Add test-first declarative schema verification and module normalization.
4. Add English and Russian documentation, module reference, and catalog pages.
5. Add content, accessibility, browser, route, and production-build checks.
6. Add least-privilege CI, scheduled upstream refresh, and GitHub Pages
   deployment.
7. Verify the current signed catalog, build the complete site, publish the
   repository, enable protections and Pages, then link the portal from the
   project repositories.

