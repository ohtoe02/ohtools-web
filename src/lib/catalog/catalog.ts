import {
	createHash,
	createPublicKey,
	verify as verifySignature,
} from 'node:crypto';
import Ajv2020, { type JSONSchemaType } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export type Locale = 'en' | 'ru';

export interface CatalogArgument {
	name: string;
	description?: string;
	required: boolean;
	variadic: boolean;
}

export interface CatalogFlag {
	name: string;
	type: string;
	description?: string;
	default?: unknown;
}

export interface CatalogCommand {
	path: string[];
	use: string;
	short: string;
	category: 'diagnostic' | 'operational' | 'runbook';
	arguments: CatalogArgument[];
	flags: CatalogFlag[];
	requires_root: boolean;
	requires_force: boolean;
	supports_dry_run: boolean;
	requires_confirmation: boolean;
}

export interface CatalogManifest {
	protocol_version: number;
	name: string;
	version: string;
	description?: string;
	commands: CatalogCommand[];
}

export interface CatalogAsset {
	os: 'linux';
	arch: 'amd64';
	url: string;
	sha256: string;
	size_bytes: number;
}

export interface CatalogVersion {
	version: string;
	minimum_ohtools_version: string;
	published_at: string;
	yanked: boolean;
	manifest: CatalogManifest;
	assets: CatalogAsset[];
}

export interface CatalogPlugin {
	name: string;
	description?: string;
	homepage?: string;
	versions: CatalogVersion[];
}

export interface CatalogIndexV1 {
	schema_version: '1';
	sequence: number;
	generated_at: string;
	expires_at: string;
	plugins: CatalogPlugin[];
}

interface SignatureEnvelope {
	schema_version: '1';
	signatures: Array<{
		key_id: string;
		algorithm: 'ed25519';
		value: string;
	}>;
}

export interface CatalogStateReference {
	sequence: number;
	index_sha256: string;
}

export interface CatalogVerificationOptions {
	now?: Date;
	trustedKeys: Record<string, string>;
	minimumSequence: number;
	previousState?: CatalogStateReference;
	maxIndexBytes?: number;
	maxSignatureBytes?: number;
}

export interface VerifiedCatalogSnapshot {
	sequence: number;
	generatedAt: string;
	expiresAt: string;
	indexSha256: string;
	verifiedKeyId: string;
	index: CatalogIndexV1;
}

export interface CatalogVersionView extends CatalogVersion {
	asset: CatalogAsset;
	installCommand: string | null;
}

export interface CatalogPluginView {
	name: string;
	description: string;
	homepage: string | null;
	latest: CatalogVersionView | null;
	versions: CatalogVersionView[];
	installCommand: string | null;
	commands: CatalogCommand[];
}

const VERSION_PATTERN = '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$';
const IDENTIFIER_PATTERN = '^[a-z][a-z0-9-]*$';

const argumentSchema = {
	type: 'object',
	additionalProperties: false,
	required: ['name', 'required', 'variadic'],
	properties: {
		name: { type: 'string', pattern: IDENTIFIER_PATTERN },
		description: { type: 'string' },
		required: { type: 'boolean' },
		variadic: { type: 'boolean' },
	},
} as const;

const flagSchema = {
	type: 'object',
	additionalProperties: false,
	required: ['name', 'type'],
	properties: {
		name: { type: 'string', pattern: IDENTIFIER_PATTERN },
		type: { type: 'string' },
		description: { type: 'string' },
		default: {
			anyOf: [
				{ type: 'string' },
				{ type: 'boolean' },
				{ type: 'number' },
				{ type: 'null' },
			],
		},
	},
} as const;

const catalogSchema = {
	type: 'object',
	additionalProperties: false,
	required: ['schema_version', 'sequence', 'generated_at', 'expires_at', 'plugins'],
	properties: {
		schema_version: { const: '1', type: 'string' },
		sequence: { type: 'integer', minimum: 1 },
		generated_at: { type: 'string', format: 'date-time' },
		expires_at: { type: 'string', format: 'date-time' },
		plugins: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['name', 'versions'],
				properties: {
					name: { type: 'string', pattern: IDENTIFIER_PATTERN },
					description: { type: 'string' },
					homepage: { type: 'string', format: 'uri' },
					versions: {
						type: 'array',
						minItems: 1,
						items: {
							type: 'object',
							additionalProperties: false,
							required: [
								'version',
								'minimum_ohtools_version',
								'published_at',
								'yanked',
								'manifest',
								'assets',
							],
							properties: {
								version: { type: 'string', pattern: VERSION_PATTERN },
								minimum_ohtools_version: {
									type: 'string',
									pattern: VERSION_PATTERN,
								},
								published_at: { type: 'string', format: 'date-time' },
								yanked: { type: 'boolean' },
								manifest: {
									type: 'object',
									additionalProperties: false,
									required: [
										'protocol_version',
										'name',
										'version',
										'commands',
									],
									properties: {
										protocol_version: { const: 1, type: 'integer' },
										name: { type: 'string', pattern: IDENTIFIER_PATTERN },
										version: { type: 'string', pattern: VERSION_PATTERN },
										description: { type: 'string' },
										commands: {
											type: 'array',
											minItems: 1,
											maxItems: 128,
											items: {
												type: 'object',
												additionalProperties: false,
												required: [
													'path',
													'use',
													'short',
													'category',
													'arguments',
													'flags',
													'requires_root',
													'requires_force',
													'supports_dry_run',
													'requires_confirmation',
												],
												properties: {
													path: {
														type: 'array',
														minItems: 2,
														items: {
															type: 'string',
															pattern: IDENTIFIER_PATTERN,
														},
													},
													use: { type: 'string' },
													short: { type: 'string' },
													category: {
														enum: ['diagnostic', 'operational', 'runbook'],
														type: 'string',
													},
													arguments: {
														type: 'array',
														items: argumentSchema,
													},
													flags: { type: 'array', items: flagSchema },
													requires_root: { type: 'boolean' },
													requires_force: { type: 'boolean' },
													supports_dry_run: { type: 'boolean' },
													requires_confirmation: { type: 'boolean' },
												},
											},
										},
									},
								},
								assets: {
									type: 'array',
									minItems: 1,
									items: {
										type: 'object',
										additionalProperties: false,
										required: ['os', 'arch', 'url', 'sha256', 'size_bytes'],
										properties: {
											os: { const: 'linux', type: 'string' },
											arch: { const: 'amd64', type: 'string' },
											url: { type: 'string' },
											sha256: {
												type: 'string',
												pattern: '^[0-9a-fA-F]{64}$',
											},
											size_bytes: {
												type: 'integer',
												minimum: 1,
												maximum: 104_857_600,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	},
} as const;

const signatureSchema = {
	type: 'object',
	additionalProperties: false,
	required: ['schema_version', 'signatures'],
	properties: {
		schema_version: { const: '1', type: 'string' },
		signatures: {
			type: 'array',
			minItems: 1,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['key_id', 'algorithm', 'value'],
				properties: {
					key_id: { type: 'string', minLength: 1 },
					algorithm: { const: 'ed25519', type: 'string' },
					value: { type: 'string', minLength: 1 },
				},
			},
		},
	},
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateCatalog = ajv.compile(catalogSchema);
const validateEnvelope = ajv.compile(signatureSchema);

export function verifyCatalogSnapshot(
	indexBytes: Uint8Array,
	signatureBytes: Uint8Array,
	options: CatalogVerificationOptions,
): VerifiedCatalogSnapshot {
	const maxIndexBytes = options.maxIndexBytes ?? 5 * 1024 * 1024;
	const maxSignatureBytes = options.maxSignatureBytes ?? 64 * 1024;
	if (indexBytes.byteLength > maxIndexBytes) {
		throw new Error(`catalog index exceeds ${maxIndexBytes} bytes`);
	}
	if (signatureBytes.byteLength > maxSignatureBytes) {
		throw new Error(`catalog signature envelope exceeds ${maxSignatureBytes} bytes`);
	}

	const envelope = parseJson(signatureBytes, 'catalog signature envelope');
	if (!validateEnvelope(envelope)) {
		throw new Error(`catalog signature schema rejected: ${ajv.errorsText(validateEnvelope.errors)}`);
	}

	const verifiedKeyId = verifyEnvelope(
		indexBytes,
		envelope as SignatureEnvelope,
		options.trustedKeys,
	);
	const decoded = parseJson(indexBytes, 'catalog index');
	if (!validateCatalog(decoded)) {
		throw new Error(`catalog schema rejected: ${ajv.errorsText(validateCatalog.errors)}`);
	}

	const index = decoded as CatalogIndexV1;
	validateCatalogSemantics(index);
	const now = options.now ?? new Date();
	const generatedAt = new Date(index.generated_at);
	const expiresAt = new Date(index.expires_at);
	if (!(expiresAt > generatedAt)) {
		throw new Error('catalog timestamps are invalid');
	}
	if (!(expiresAt > now)) {
		throw new Error('catalog index is expired');
	}

	const indexSha256 = createHash('sha256').update(indexBytes).digest('hex');
	const lowerBound = Math.max(
		options.minimumSequence,
		options.previousState?.sequence ?? 0,
	);
	if (index.sequence < lowerBound) {
		throw new Error(
			`catalog rollback rejected: received sequence ${index.sequence} after ${lowerBound}`,
		);
	}
	if (
		options.previousState &&
		index.sequence === options.previousState.sequence &&
		indexSha256 !== options.previousState.index_sha256
	) {
		throw new Error(`catalog sequence ${index.sequence} digest conflict`);
	}

	return {
		sequence: index.sequence,
		generatedAt: index.generated_at,
		expiresAt: index.expires_at,
		indexSha256,
		verifiedKeyId,
		index,
	};
}

export function normalizeCatalog(index: CatalogIndexV1): CatalogPluginView[] {
	validateCatalogSemantics(index);
	return [...index.plugins]
		.sort((left, right) => left.name.localeCompare(right.name))
		.map((plugin) => {
			const versions = [...plugin.versions]
				.sort((left, right) => compareVersions(right.version, left.version))
				.map((version): CatalogVersionView => {
					const asset = version.assets[0];
					validateAssetUrl(asset.url);
					return {
						...version,
						asset,
						installCommand: version.yanked
							? null
							: `sudo ohtools plugin install ${plugin.name} --version ${version.version}`,
					};
				});
			const latest = versions.find((version) => !version.yanked) ?? null;
			return {
				name: plugin.name,
				description: plugin.description ?? '',
				homepage: plugin.homepage ?? null,
				latest,
				versions,
				installCommand: latest
					? `sudo ohtools plugin install ${plugin.name}`
					: null,
				commands: latest?.manifest.commands ?? [],
			};
		});
}

function parseJson(bytes: Uint8Array, label: string): unknown {
	try {
		return JSON.parse(Buffer.from(bytes).toString('utf8')) as unknown;
	} catch (error) {
		throw new Error(`${label} is malformed JSON`, { cause: error });
	}
}

function verifyEnvelope(
	indexBytes: Uint8Array,
	envelope: SignatureEnvelope,
	trustedKeys: Record<string, string>,
): string {
	for (const signature of envelope.signatures) {
		const rawKey = trustedKeys[signature.key_id];
		if (!rawKey) continue;
		try {
			const raw = Buffer.from(rawKey, 'base64');
			if (raw.byteLength !== 32) continue;
			const spki = Buffer.concat([
				Buffer.from('302a300506032b6570032100', 'hex'),
				raw,
			]);
			const publicKey = createPublicKey({
				key: spki,
				format: 'der',
				type: 'spki',
			});
			if (
				verifySignature(
					null,
					indexBytes,
					publicKey,
					Buffer.from(signature.value, 'base64'),
				)
			) {
				return signature.key_id;
			}
		} catch {
			continue;
		}
	}
	throw new Error('catalog index has no valid signature from a trusted key');
}

function validateCatalogSemantics(index: CatalogIndexV1): void {
	const pluginNames = new Set<string>();
	for (const plugin of index.plugins) {
		if (pluginNames.has(plugin.name)) {
			throw new Error(`duplicate catalog plugin ${plugin.name}`);
		}
		pluginNames.add(plugin.name);
		validateDescription(plugin.description ?? '');
		if (plugin.homepage) validateCredentialFreeHttps(plugin.homepage, 'homepage');

		const versions = new Set<string>();
		for (const version of plugin.versions) {
			if (versions.has(version.version)) {
				throw new Error(`plugin ${plugin.name} has duplicate version ${version.version}`);
			}
			versions.add(version.version);
			if (
				version.manifest.name !== plugin.name ||
				version.manifest.version !== version.version
			) {
				throw new Error(`plugin ${plugin.name} manifest identity mismatch`);
			}
			if ((version.manifest.description ?? '') !== (plugin.description ?? '')) {
				throw new Error(`plugin ${plugin.name} description does not match manifest`);
			}
			for (const asset of version.assets) validateAssetUrl(asset.url);
		}
	}
}

function validateDescription(description: string): void {
	if (
		description.includes('\n') ||
		description.includes('\r') ||
		Buffer.byteLength(description, 'utf8') > 512
	) {
		throw new Error('catalog description must be a single line of at most 512 bytes');
	}
}

function validateAssetUrl(value: string): void {
	validateCredentialFreeHttps(value, 'asset URL');
}

function validateCredentialFreeHttps(value: string, label: string): void {
	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		throw new Error(`${label} must use credential-free HTTPS`);
	}
	if (
		parsed.protocol !== 'https:' ||
		!parsed.hostname ||
		parsed.username ||
		parsed.password
	) {
		throw new Error(`${label} must use credential-free HTTPS`);
	}
}

function compareVersions(left: string, right: string): number {
	const leftParts = left.split('.').map(Number);
	const rightParts = right.split('.').map(Number);
	for (let index = 0; index < 3; index += 1) {
		const difference = leftParts[index] - rightParts[index];
		if (difference !== 0) return difference;
	}
	return 0;
}
