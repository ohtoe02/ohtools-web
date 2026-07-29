import { createHash } from "node:crypto";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import Ajv2020 from "ajv/dist/2020.js";
import type { CatalogPluginView, Locale } from "../catalog/catalog";

export interface LocalizedPluginDocumentation {
  title: string;
  summary: string;
  command_paths: string[];
  markdown: string;
}

export interface PluginDocumentationV1 {
  plugin_id: string;
  documented_version: string;
  local_only: boolean;
  locales: Record<Locale, LocalizedPluginDocumentation>;
}

export interface PluginDocumentationBundleV1 {
  schema_version: 1;
  source_commit: string;
  plugins: PluginDocumentationV1[];
}

export interface VerifiedPluginDocumentation {
  sourceCommit: string;
  bundleSha256: string;
  plugins: Record<string, PluginDocumentationV1>;
}

export interface PluginDocumentationVerificationOptions {
  expectedSha256: string;
  catalogPlugins: CatalogPluginView[];
  maxBytes?: number;
}

const VERSION_PATTERN = "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$";
const IDENTIFIER_PATTERN = "^[a-z][a-z0-9-]*$";
const COMMAND_PATTERN = "^[a-z][a-z0-9-]*(?: [a-z][a-z0-9-]*)+$";
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const LEGACY_NON_LOCAL = new Set([
  "system-base",
  "storage-base",
  "systemd-base",
  "docker-base",
]);

const localizedSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "command_paths", "markdown"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 512 },
    summary: { type: "string", minLength: 1, maxLength: 512 },
    command_paths: {
      type: "array",
      minItems: 1,
      maxItems: 128,
      uniqueItems: true,
      items: { type: "string", pattern: COMMAND_PATTERN },
    },
    markdown: { type: "string", minLength: 1, maxLength: 524_288 },
  },
} as const;

const bundleSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "source_commit", "plugins"],
  properties: {
    schema_version: { const: 1, type: "integer" },
    source_commit: { type: "string", pattern: "^[0-9a-f]{40}$" },
    plugins: {
      type: "array",
      minItems: 1,
      maxItems: 128,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["plugin_id", "documented_version", "local_only", "locales"],
        properties: {
          plugin_id: { type: "string", pattern: IDENTIFIER_PATTERN },
          documented_version: { type: "string", pattern: VERSION_PATTERN },
          local_only: { type: "boolean" },
          locales: {
            type: "object",
            additionalProperties: false,
            required: ["en", "ru"],
            properties: {
              en: localizedSchema,
              ru: localizedSchema,
            },
          },
        },
      },
    },
  },
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateBundle = ajv.compile(bundleSchema);
const markdownProcessor = createMarkdownProcessor({ syntaxHighlight: false });

export function verifyPluginDocumentationBundle(
  bytes: Uint8Array,
  options: PluginDocumentationVerificationOptions,
): VerifiedPluginDocumentation {
  const maxBytes = options.maxBytes ?? 5 * 1024 * 1024;
  if (bytes.byteLength > maxBytes) {
    throw new Error(`plugin documentation bundle exceeds ${maxBytes} bytes`);
  }
  if (!SHA256_PATTERN.test(options.expectedSha256)) {
    throw new Error("plugin documentation expected SHA-256 is invalid");
  }
  const bundleSha256 = createHash("sha256").update(bytes).digest("hex");
  if (bundleSha256 !== options.expectedSha256) {
    throw new Error("plugin documentation bundle digest mismatch");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown;
  } catch (error) {
    throw new Error("plugin documentation bundle is malformed JSON", {
      cause: error,
    });
  }
  if (!validateBundle(decoded)) {
    throw new Error(
      `plugin documentation schema rejected: ${ajv.errorsText(validateBundle.errors)}`,
    );
  }

  const bundle = decoded as PluginDocumentationBundleV1;
  const byID = new Map<string, PluginDocumentationV1>();
  for (const plugin of bundle.plugins) {
    if (byID.has(plugin.plugin_id)) {
      throw new Error(`duplicate plugin documentation ${plugin.plugin_id}`);
    }
    byID.set(plugin.plugin_id, plugin);
    validateLocalOnly(plugin);
    validateLocalizedMarkdown(plugin.locales.en.markdown);
    validateLocalizedMarkdown(plugin.locales.ru.markdown);
  }

  const catalogNames = new Set(
    options.catalogPlugins.map((plugin) => plugin.name),
  );
  for (const documented of byID.keys()) {
    if (!catalogNames.has(documented)) {
      throw new Error(`documentation exists for unknown plugin ${documented}`);
    }
  }
  for (const catalogPlugin of options.catalogPlugins) {
    const documented = byID.get(catalogPlugin.name);
    if (!documented) {
      throw new Error(`documentation is missing for ${catalogPlugin.name}`);
    }
    if (!catalogPlugin.latest) {
      throw new Error(
        `catalog plugin ${catalogPlugin.name} has no current version`,
      );
    }
    if (documented.documented_version !== catalogPlugin.latest.version) {
      throw new Error(
        `documentation version mismatch for ${catalogPlugin.name}`,
      );
    }
    const manifestCommands = catalogPlugin.commands.map((command) =>
      command.path.join(" "),
    );
    for (const locale of ["en", "ru"] as const) {
      if (
        !sameStringSet(
          documented.locales[locale].command_paths,
          manifestCommands,
        )
      ) {
        throw new Error(
          `${locale} documentation command mismatch for ${catalogPlugin.name}`,
        );
      }
    }
  }

  return {
    sourceCommit: bundle.source_commit,
    bundleSha256,
    plugins: Object.fromEntries(
      [...byID.entries()].sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
}

interface PluginMarkdownSource {
  sourceCommit: string;
  pluginId: string;
  locale: "en" | "ru";
}

export async function renderPluginMarkdown(
  markdown: string,
  source?: PluginMarkdownSource,
) {
  validateLocalizedMarkdown(markdown);
  const processor = await markdownProcessor;
  return processor.render(
    source ? rewriteSourceLinks(markdown, source) : markdown,
  );
}

function rewriteSourceLinks(
  markdown: string,
  source: PluginMarkdownSource,
): string {
  if (
    !/^[0-9a-f]{40}$/.test(source.sourceCommit) ||
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(source.pluginId) ||
    (source.locale !== "en" && source.locale !== "ru")
  ) {
    throw new Error("invalid plugin documentation source coordinates");
  }

  const repositoryPath = `/ohtoe02/ohtools-plugins/blob/${source.sourceCommit}/`;
  const sourceURL = new URL(
    `https://github.com${repositoryPath}docs/plugins/${source.locale}/${source.pluginId}.md`,
  );
  let inFence = false;
  return markdown
    .split(/\r?\n/)
    .map((rawLine) => {
      if (rawLine.trim().startsWith("```")) {
        inFence = !inFence;
        return rawLine;
      }
      if (inFence) return rawLine;
      return rawLine.replace(
        /\]\(((?:\.{1,2}\/)[^)\s]+)\)/g,
        (_, target: string) => {
          const resolved = new URL(target, sourceURL);
          if (
            resolved.protocol !== "https:" ||
            resolved.hostname !== "github.com" ||
            !resolved.pathname.startsWith(repositoryPath)
          ) {
            throw new Error(
              "plugin documentation source link escapes its repository",
            );
          }
          return `](${resolved.toString()})`;
        },
      );
    })
    .join("\n");
}

function validateLocalOnly(plugin: PluginDocumentationV1): void {
  const expected = !LEGACY_NON_LOCAL.has(plugin.plugin_id);
  if (plugin.local_only !== expected) {
    throw new Error(
      `local_only classification mismatch for ${plugin.plugin_id}`,
    );
  }
}

function validateLocalizedMarkdown(markdown: string): void {
  let inFence = false;
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/<[/!?A-Za-z][^>]*>/.test(rawLine)) {
      throw new Error("raw HTML is forbidden in plugin documentation Markdown");
    }
    if (line.startsWith("import ") || line.startsWith("export ")) {
      throw new Error("MDX is forbidden in plugin documentation Markdown");
    }
    for (const match of rawLine.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      validateDocumentationLink(match[1]);
    }
  }
  if (inFence) {
    throw new Error("plugin documentation Markdown has an unterminated fence");
  }
}

function validateDocumentationLink(raw: string): void {
  if (raw.startsWith("#") || raw.startsWith("./") || raw.startsWith("../")) {
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("plugin documentation link is unsafe");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.hostname !== "github.com" ||
    !parsed.pathname.startsWith("/ohtoe02/")
  ) {
    throw new Error("plugin documentation link is unsafe");
  }
}

function sameStringSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}
