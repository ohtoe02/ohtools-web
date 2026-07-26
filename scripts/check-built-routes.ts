import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import catalogData from "../src/generated/catalog.json";
import { declarativeModules } from "../src/data/declarative";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const docs = [
  "",
  "configuration-policy",
  "install-cli",
  "plugin-authoring",
  "plugin-protocol",
  "security-model",
];
const routes = [
  "",
  "plugins",
  "declarative",
  "docs",
  "ru",
  "ru/plugins",
  "ru/declarative",
  "ru/docs",
  ...catalogData.plugins.flatMap((plugin) => [
    `plugins/${plugin.name}`,
    `ru/plugins/${plugin.name}`,
  ]),
  ...declarativeModules.flatMap((moduleEntry) => [
    `declarative/${moduleEntry.id}`,
    `ru/declarative/${moduleEntry.id}`,
  ]),
  ...docs
    .filter(Boolean)
    .flatMap((slug) => [`docs/${slug}`, `ru/docs/${slug}`]),
];

await Promise.all(
  routes.map((route) => access(resolve(dist, route, "index.html"))),
);

const home = await readFile(resolve(dist, "index.html"), "utf8");
if (
  !home.includes('href="/ohtools-web/plugins/"') ||
  !home.includes('src="/ohtools-web/_astro/')
) {
  throw new Error("GitHub Pages base path is missing from generated links");
}

const state = JSON.parse(
  await readFile(resolve(dist, "data/catalog-state.json"), "utf8"),
) as Record<string, unknown>;
const expectedKeys = [
  "built_at",
  "expires_at",
  "generated_at",
  "index_sha256",
  "schema_version",
  "sequence",
  "verified_key_id",
];
if (
  JSON.stringify(Object.keys(state).sort()) !== JSON.stringify(expectedKeys)
) {
  throw new Error("catalog-state-v1 exposes an unexpected field set");
}

console.log(`Verified ${routes.length} routes and catalog-state-v1`);
