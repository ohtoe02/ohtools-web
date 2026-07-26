export interface DeclarativeReleaseConfig {
  releaseReady: boolean;
  schemaUrl: string | null;
  schemaId: string;
  schemaSha256: string | null;
}

export function assertDeclarativeReleaseReady(
  config: DeclarativeReleaseConfig,
): void {
  if (!config.releaseReady || !config.schemaUrl || !config.schemaSha256) {
    throw new Error("declarative schema release is not ready");
  }
  if (config.schemaId !== "https://ohtools.dev/schema/declarative/v1") {
    throw new Error("declarative schema identity is unsupported");
  }
  const immutableRelease =
    /^https:\/\/github\.com\/ohtoe02\/ohtools-plugins\/releases\/download\/[^/]+\/[^/]+$/;
  if (
    !immutableRelease.test(config.schemaUrl) ||
    config.schemaUrl.includes("/latest/")
  ) {
    throw new Error(
      "declarative schema URL must identify an immutable release",
    );
  }
  if (!/^[0-9a-f]{64}$/.test(config.schemaSha256)) {
    throw new Error("declarative schema SHA-256 is invalid");
  }
}
