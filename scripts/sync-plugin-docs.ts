import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import catalogData from "../src/generated/catalog.json";
import { upstreamConfig } from "../src/data/upstream";
import type { CatalogPluginView } from "../src/lib/catalog/catalog";
import { fetchBoundedResource } from "../src/lib/catalog/fetch";
import { verifyPluginDocumentationBundle } from "../src/lib/plugin-docs/plugin-docs";

const projectRoot = resolve(import.meta.dirname, "..");
const config = upstreamConfig.pluginDocs;
const useBootstrap = process.env.OHTOOLS_PLUGIN_DOCS_BOOTSTRAP === "1";

let bytes: Uint8Array;
let expectedSha256: string;
if (useBootstrap) {
  bytes = await readFile(
    resolve(projectRoot, "src/data/plugin-docs-bootstrap.json"),
  );
  expectedSha256 = createHash("sha256").update(bytes).digest("hex");
} else {
  if (!config.bundleUrl || !config.bundleSha256) {
    throw new Error(
      "immutable plugin documentation release URL and SHA-256 are not pinned",
    );
  }
  bytes = await fetchBoundedResource(config.bundleUrl, {
    allowedHosts: config.allowedHosts,
    maxBytes: config.maxBytes,
  });
  expectedSha256 = config.bundleSha256;
}

const verified = verifyPluginDocumentationBundle(bytes, {
  expectedSha256,
  catalogPlugins: catalogData.plugins as CatalogPluginView[],
  maxBytes: config.maxBytes,
});
const output = resolve(projectRoot, "src/generated/plugin-docs.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(verified, null, 2)}\n`, "utf8");
console.log(
  `Verified documentation for ${Object.keys(verified.plugins).length} plugins at ${verified.sourceCommit}`,
);
