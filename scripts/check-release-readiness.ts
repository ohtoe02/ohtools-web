import { upstreamConfig } from "../src/data/upstream";
import { assertDeclarativeReleaseReady } from "../src/lib/declarative/release";

assertDeclarativeReleaseReady(upstreamConfig.declarative);
console.log("Declarative schema release is pinned and ready for deployment");
