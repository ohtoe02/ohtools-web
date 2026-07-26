export interface UpstreamConfig {
  catalog: {
    indexUrl: string;
    signatureUrl: string;
    previousStateUrl: string;
    allowedHosts: string[];
    maxIndexBytes: number;
    maxSignatureBytes: number;
    minimumSequence: number;
    bootstrapDigest: string;
    trustedKeys: Record<string, string>;
  };
  declarative: {
    releaseReady: boolean;
    schemaUrl: string | null;
    schemaId: string;
    schemaSha256: string | null;
  };
}

export const upstreamConfig: UpstreamConfig = {
  catalog: {
    indexUrl:
      "https://github.com/ohtoe02/ohtools-plugin-catalog/releases/latest/download/index-v1.json",
    signatureUrl:
      "https://github.com/ohtoe02/ohtools-plugin-catalog/releases/latest/download/index-v1.json.sig",
    previousStateUrl:
      "https://ohtoe02.github.io/ohtools-web/data/catalog-state.json",
    allowedHosts: [
      "github.com",
      "release-assets.githubusercontent.com",
      "objects.githubusercontent.com",
      "ohtoe02.github.io",
    ],
    maxIndexBytes: 5 * 1024 * 1024,
    maxSignatureBytes: 64 * 1024,
    minimumSequence: 3,
    bootstrapDigest:
      "dd045ca051375bbbad37de0684cc32cd0ae83334d90f76f7d11a265ddda600ed",
    trustedKeys: {
      "8da7e19e8cff6c33": "8jW7I5G75M8Bgv+lfDZxBRB6Z6ycGXpxhUbekVppugk=",
    },
  },
  declarative: {
    releaseReady: false,
    schemaUrl: null,
    schemaId: "https://ohtools.dev/schema/declarative/v1",
    schemaSha256: null,
  },
};
