import previewSchema from "./declarative-schema-preview.json";
import { declarativeCopy } from "./declarative-copy";
import {
  buildDeclarativeReference,
  type DeclarativeSchemaV1,
} from "../lib/declarative/reference";

export const declarativeModules = buildDeclarativeReference(
  previewSchema as DeclarativeSchemaV1,
  declarativeCopy,
);

export const declarativeSource = {
  status: "contract-preview" as const,
  schemaId: previewSchema.$id,
  moduleCount: declarativeModules.length,
};
