import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import type { CatalogPluginView } from "../../src/lib/catalog/catalog";
import {
  renderPluginMarkdown,
  verifyPluginDocumentationBundle,
  type PluginDocumentationBundleV1,
} from "../../src/lib/plugin-docs/plugin-docs";

function catalogPlugin(): CatalogPluginView {
  const command = {
    path: ["system", "info"],
    use: "info",
    short: "Show system information",
    category: "diagnostic" as const,
    arguments: [],
    flags: [],
    requires_root: false,
    requires_force: false,
    supports_dry_run: false,
    requires_confirmation: false,
  };
  const asset = {
    os: "linux" as const,
    arch: "amd64" as const,
    url: "https://github.com/ohtoe02/ohtools-plugins/releases/download/system-base-v1.0.1/system-base_linux_amd64",
    sha256: "a".repeat(64),
    size_bytes: 1024,
  };
  const latest = {
    version: "1.0.1",
    minimum_ohtools_version: "0.3.2",
    published_at: "2026-07-24T00:00:00Z",
    yanked: false,
    manifest: {
      protocol_version: 1,
      name: "system-base",
      version: "1.0.1",
      commands: [command],
    },
    assets: [asset],
    asset,
    installCommand: "sudo ohtools plugin install system-base --version 1.0.1",
  };
  return {
    name: "system-base",
    description: "System diagnostics.",
    homepage: "https://github.com/ohtoe02/ohtools-plugins",
    latest,
    versions: [latest],
    installCommand: "sudo ohtools plugin install system-base",
    commands: [command],
  };
}

function bundle(): PluginDocumentationBundleV1 {
  const markdown = `# System base

## Purpose and supported scenarios

Inspect the local host.

## Quick start

Run the command.

## Commands

The command is documented.

## How it works

Bounded local probes are used.

## Data access

Only local data is read.

## Results and exit behavior

Result schema v1 is emitted.

## Configuration

Strict YAML is used.

## What can be changed

Thresholds can be changed.

## Fixed behavior

Protocol behavior is fixed.

## Safety

The command is read-only.

## Troubleshooting

Dependency failures are reported.

## Limitations and TODO

Remote execution is not supported.

## Compatibility and source

See [source](https://github.com/ohtoe02/ohtools-plugins).
`;
  return {
    schema_version: 1,
    source_commit: "b".repeat(40),
    plugins: [
      {
        plugin_id: "system-base",
        documented_version: "1.0.1",
        local_only: false,
        locales: {
          en: {
            title: "System base",
            summary: "Inspect the local host.",
            command_paths: ["system info"],
            markdown,
          },
          ru: {
            title: "Системная диагностика",
            summary: "Проверка локального сервера.",
            command_paths: ["system info"],
            markdown: markdown.replace("System base", "Системная диагностика"),
          },
        },
      },
    ],
  };
}

function encoded(value: PluginDocumentationBundleV1) {
  const bytes = Buffer.from(JSON.stringify(value));
  return {
    bytes,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

describe("verifyPluginDocumentationBundle", () => {
  test("accepts a digest-pinned bundle matching the signed catalog", () => {
    const input = encoded(bundle());

    const verified = verifyPluginDocumentationBundle(input.bytes, {
      expectedSha256: input.sha256,
      catalogPlugins: [catalogPlugin()],
    });

    expect(verified.sourceCommit).toBe("b".repeat(40));
    expect(verified.plugins["system-base"].locales.ru.title).toBe(
      "Системная диагностика",
    );
  });

  test("rejects malformed, oversized, and digest-mismatched bytes", () => {
    const input = encoded(bundle());

    expect(() =>
      verifyPluginDocumentationBundle(Buffer.from("{"), {
        expectedSha256: input.sha256,
        catalogPlugins: [catalogPlugin()],
      }),
    ).toThrow(/digest|malformed/i);
    expect(() =>
      verifyPluginDocumentationBundle(input.bytes, {
        expectedSha256: "f".repeat(64),
        catalogPlugins: [catalogPlugin()],
      }),
    ).toThrow(/digest/i);
    expect(() =>
      verifyPluginDocumentationBundle(input.bytes, {
        expectedSha256: input.sha256,
        catalogPlugins: [catalogPlugin()],
        maxBytes: input.bytes.byteLength - 1,
      }),
    ).toThrow(/exceeds/i);
  });

  test("rejects missing locales and catalog identity mismatches", () => {
    const missingLocale = bundle();
    delete (missingLocale.plugins[0].locales as { ru?: unknown }).ru;
    const missingInput = encoded(missingLocale);
    expect(() =>
      verifyPluginDocumentationBundle(missingInput.bytes, {
        expectedSha256: missingInput.sha256,
        catalogPlugins: [catalogPlugin()],
      }),
    ).toThrow(/schema|locale/i);

    const wrongVersion = bundle();
    wrongVersion.plugins[0].documented_version = "1.0.0";
    const wrongInput = encoded(wrongVersion);
    expect(() =>
      verifyPluginDocumentationBundle(wrongInput.bytes, {
        expectedSha256: wrongInput.sha256,
        catalogPlugins: [catalogPlugin()],
      }),
    ).toThrow(/version/i);
  });

  test("rejects command drift and executable Markdown", () => {
    const commandDrift = bundle();
    commandDrift.plugins[0].locales.en.command_paths = ["system health"];
    const commandInput = encoded(commandDrift);
    expect(() =>
      verifyPluginDocumentationBundle(commandInput.bytes, {
        expectedSha256: commandInput.sha256,
        catalogPlugins: [catalogPlugin()],
      }),
    ).toThrow(/command/i);

    const unsafe = bundle();
    unsafe.plugins[0].locales.en.markdown += "\n<script>alert(1)</script>\n";
    const unsafeInput = encoded(unsafe);
    expect(() =>
      verifyPluginDocumentationBundle(unsafeInput.bytes, {
        expectedSha256: unsafeInput.sha256,
        catalogPlugins: [catalogPlugin()],
      }),
    ).toThrow(/HTML|Markdown/i);
  });
});

describe("renderPluginMarkdown", () => {
  test("renders headings, links, and code without executable HTML", async () => {
    const result = await renderPluginMarkdown(
      "## Quick start\n\nRun `ohtools system info`.\n\nSee the [roadmap](../../roadmap/system-base.md).\n\n```text\nohtools system info\n```\n",
      {
        sourceCommit: "b".repeat(40),
        pluginId: "system-base",
        locale: "en",
      },
    );

    expect(result.code).toContain('id="quick-start"');
    expect(result.code).toContain("<code>ohtools system info</code>");
    expect(result.code).toContain(
      `href="https://github.com/ohtoe02/ohtools-plugins/blob/${"b".repeat(40)}/docs/roadmap/system-base.md"`,
    );
    expect(result.code).not.toContain("<script");
  });
});
