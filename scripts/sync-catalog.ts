import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  normalizeCatalog,
  verifyCatalogSnapshot,
  type CatalogStateReference,
} from "../src/lib/catalog/catalog";
import { fetchBoundedResource } from "../src/lib/catalog/fetch";
import { mayUsePinnedBootstrap } from "../src/lib/catalog/state";
import { upstreamConfig } from "../src/data/upstream";

const projectRoot = resolve(import.meta.dirname, "..");
const config = upstreamConfig.catalog;
const [indexBytes, signatureBytes] = await Promise.all([
  fetchBoundedResource(config.indexUrl, {
    allowedHosts: config.allowedHosts,
    maxBytes: config.maxIndexBytes,
  }),
  fetchBoundedResource(config.signatureUrl, {
    allowedHosts: config.allowedHosts,
    maxBytes: config.maxSignatureBytes,
  }),
]);

const previousState = await loadPreviousState();
const snapshot = verifyCatalogSnapshot(indexBytes, signatureBytes, {
  trustedKeys: config.trustedKeys,
  minimumSequence: config.minimumSequence,
  previousState,
  maxIndexBytes: config.maxIndexBytes,
  maxSignatureBytes: config.maxSignatureBytes,
});

if (
  !previousState &&
  (snapshot.sequence !== config.minimumSequence ||
    snapshot.indexSha256 !== config.bootstrapDigest)
) {
  throw new Error(
    `catalog bootstrap state mismatch: expected sequence ${config.minimumSequence} and pinned digest`,
  );
}

const builtAt = new Date().toISOString();
const state = {
  schema_version: "1",
  sequence: snapshot.sequence,
  index_sha256: snapshot.indexSha256,
  verified_key_id: snapshot.verifiedKeyId,
  generated_at: snapshot.generatedAt,
  expires_at: snapshot.expiresAt,
  built_at: builtAt,
};
const generated = {
  state,
  plugins: normalizeCatalog(snapshot.index),
};

await mkdir(resolve(projectRoot, "src/generated"), { recursive: true });
await mkdir(resolve(projectRoot, "public/data"), { recursive: true });
await Promise.all([
  writeFile(
    resolve(projectRoot, "src/generated/catalog.json"),
    `${JSON.stringify(generated, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 },
  ),
  writeFile(
    resolve(projectRoot, "public/data/catalog-state.json"),
    `${JSON.stringify(state, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 },
  ),
]);

console.log(
  `Verified catalog sequence ${snapshot.sequence} with ${generated.plugins.length} plugins`,
);

async function loadPreviousState(): Promise<CatalogStateReference | undefined> {
  if (process.env.OHTOOLS_CATALOG_BOOTSTRAP === "1") return undefined;
  try {
    const bytes = await fetchBoundedResource(config.previousStateUrl, {
      allowedHosts: config.allowedHosts,
      maxBytes: 16 * 1024,
    });
    const decoded = JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown;
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      Array.isArray(decoded) ||
      (decoded as Record<string, unknown>).schema_version !== "1" ||
      !Number.isSafeInteger((decoded as Record<string, unknown>).sequence) ||
      typeof (decoded as Record<string, unknown>).index_sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(
        (decoded as Record<string, unknown>).index_sha256 as string,
      )
    ) {
      throw new Error("published catalog state has an invalid schema");
    }
    return {
      sequence: (decoded as Record<string, number>).sequence,
      index_sha256: (decoded as Record<string, string>).index_sha256,
    };
  } catch (error) {
    if (mayUsePinnedBootstrap(error, process.env.CI === "true"))
      return undefined;
    throw error;
  }
}
