# ohtools web shell workspace design

**Date:** 2026-07-27
**Status:** Approved and implemented

## Goal

Present the complete bilingual ohtools developer portal as a modern operations
console without sacrificing the navigation, readability, accessibility, or
static trust model expected from a documentation site.

## Visual system

The portal uses a dark-first shell workspace with a paper-terminal light theme.
IBM Plex Mono is the only interface typeface. Green communicates verified or
successful state, amber is reserved for previews and warnings, and red is
reserved for errors. Paths, prompts, ASCII separators, output rows, and a
restrained grid create the terminal character without CRT effects, fake window
controls, or decorative hacker imagery.

The global header shows the current portal path and verified catalog sequence.
The existing Starlight sidebar, table of contents, search, locale switcher,
theme switcher, and mobile drawer remain the primary accessible navigation.

## Interaction model

The home page includes a local terminal prompt as an additional navigation
method. It accepts only `help`, `docs`, `plugins`, `modules`, `lang en|ru`,
`theme dark|light|system`, and `clear`. The parser never invokes a shell, uses
`eval`, accepts external URLs, or makes browser network requests. Conventional
links duplicate every navigation command and remain available without
JavaScript.

Catalogs use dense terminal output rows instead of dashboard cards. Detail
pages present install commands, YAML, manifests, schemas, version history, and
metadata as structured output while retaining semantic tables. Long-form
documentation stays conventionally readable inside the shared shell frame.

## Compatibility and verification

Public routes, locale structure, catalog and declarative data contracts, CSP,
build-time signature verification, and GitHub Pages deployment remain
unchanged. The interface supports keyboard navigation, visible focus,
`prefers-reduced-motion`, both color themes, desktop and mobile layouts, and
screen-reader announcements for prompt output.
