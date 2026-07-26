import { createHash } from 'node:crypto';

export interface ModuleCopy {
	title: string;
	summary: string;
	exampleYaml: string;
	fallback?: boolean;
}

export type DeclarativeCopy = Record<
	string,
	{
		en: ModuleCopy;
		ru?: ModuleCopy;
	}
>;

interface ModuleFieldSchema {
	type: string;
	description?: string;
	enum?: string[];
}

interface ModuleSchema {
	title: string;
	description: string;
	type: 'object';
	additionalProperties: false;
	'x-ohtools-category': string;
	'x-ohtools-safety': 'read-only' | 'mutating';
	required?: string[];
	properties: Record<string, ModuleFieldSchema>;
}

export interface DeclarativeSchemaV1 {
	$schema: string;
	$id: string;
	title: string;
	type: 'object';
	additionalProperties: false;
	properties: Record<string, unknown>;
	$defs: Record<string, unknown> & {
		modules: {
			oneOf: Array<{ $ref: string }>;
		};
	};
}

export interface DeclarativeFieldView {
	name: string;
	type: string;
	description: string;
	required: boolean;
	values: string[];
}

export interface DeclarativeModuleView {
	id: string;
	category: string;
	safety: 'read-only' | 'mutating';
	schemaDescription: string;
	fields: DeclarativeFieldView[];
	copy: {
		en: ModuleCopy;
		ru: ModuleCopy;
	};
}

export interface VerifiedDeclarativeSchema {
	sha256: string;
	schema: DeclarativeSchemaV1;
}

export function verifyDeclarativeSchema(
	bytes: Uint8Array,
	options: { expectedId: string; expectedSha256: string; maxBytes?: number },
): VerifiedDeclarativeSchema {
	const maxBytes = options.maxBytes ?? 1024 * 1024;
	if (bytes.byteLength > maxBytes) {
		throw new Error(`declarative schema exceeds ${maxBytes} bytes`);
	}
	const sha256 = createHash('sha256').update(bytes).digest('hex');
	if (sha256 !== options.expectedSha256.toLowerCase()) {
		throw new Error('declarative schema digest mismatch');
	}

	let decoded: unknown;
	try {
		decoded = JSON.parse(Buffer.from(bytes).toString('utf8')) as unknown;
	} catch (error) {
		throw new Error('declarative schema is malformed JSON', { cause: error });
	}
	if (!isRecord(decoded) || decoded.$id !== options.expectedId) {
		throw new Error('declarative schema identity is unsupported');
	}
	assertSchemaShape(decoded);
	return { sha256, schema: decoded };
}

export function buildDeclarativeReference(
	schema: DeclarativeSchemaV1,
	copy: DeclarativeCopy,
): DeclarativeModuleView[] {
	assertSchemaShape(schema);
	const moduleIds = schema.$defs.modules.oneOf.map((entry) =>
		resolveModuleId(entry.$ref),
	);
	const known = new Set(moduleIds);
	for (const copyId of Object.keys(copy)) {
		if (!known.has(copyId)) {
			throw new Error(`copy references unknown module ${copyId}`);
		}
	}

	return moduleIds.map((id) => {
		const definition = schema.$defs[id];
		assertModuleDefinition(id, definition);
		const localized = copy[id];
		if (!localized?.en) {
			throw new Error(`English copy is missing for module ${id}`);
		}
		const required = new Set(definition.required ?? []);
		const fields = Object.entries(definition.properties).map(
			([name, field]): DeclarativeFieldView => ({
				name,
				type: field.type,
				description: field.description ?? '',
				required: required.has(name),
				values: field.enum ?? [],
			}),
		);
		const russian = localized.ru
			? { ...localized.ru }
			: { ...localized.en, fallback: true };
		return {
			id,
			category: definition['x-ohtools-category'],
			safety: definition['x-ohtools-safety'],
			schemaDescription: definition.description,
			fields,
			copy: {
				en: { ...localized.en },
				ru: russian,
			},
		};
	});
}

function assertSchemaShape(value: unknown): asserts value is DeclarativeSchemaV1 {
	if (
		!isRecord(value) ||
		typeof value.$schema !== 'string' ||
		typeof value.$id !== 'string' ||
		typeof value.title !== 'string' ||
		value.type !== 'object' ||
		value.additionalProperties !== false ||
		!isRecord(value.properties) ||
		!isRecord(value.$defs) ||
		!isRecord(value.$defs.modules) ||
		!Array.isArray(value.$defs.modules.oneOf)
	) {
		throw new Error('declarative schema shape is invalid');
	}
	for (const entry of value.$defs.modules.oneOf) {
		if (!isRecord(entry) || typeof entry.$ref !== 'string') {
			throw new Error('declarative module reference is invalid');
		}
	}
}

function resolveModuleId(reference: string): string {
	const prefix = '#/$defs/';
	if (!reference.startsWith(prefix)) {
		throw new Error(`declarative module reference ${reference} is external`);
	}
	const id = reference.slice(prefix.length);
	if (!/^[a-z][a-z0-9-]*$/.test(id)) {
		throw new Error(`declarative module id ${id} is invalid`);
	}
	return id;
}

function assertModuleDefinition(
	id: string,
	value: unknown,
): asserts value is ModuleSchema {
	if (
		!isRecord(value) ||
		value.type !== 'object' ||
		value.additionalProperties !== false ||
		typeof value.title !== 'string' ||
		typeof value.description !== 'string' ||
		typeof value['x-ohtools-category'] !== 'string' ||
		(value['x-ohtools-safety'] !== 'read-only' &&
			value['x-ohtools-safety'] !== 'mutating') ||
		!isRecord(value.properties) ||
		(value.required !== undefined && !Array.isArray(value.required))
	) {
		throw new Error(`declarative module ${id} is invalid`);
	}
	for (const [name, field] of Object.entries(value.properties)) {
		if (
			!isRecord(field) ||
			typeof field.type !== 'string' ||
			(field.description !== undefined &&
				typeof field.description !== 'string') ||
			(field.enum !== undefined &&
				(!Array.isArray(field.enum) ||
					field.enum.some((entry) => typeof entry !== 'string')))
		) {
			throw new Error(`declarative module ${id} field ${name} is invalid`);
		}
	}
}

function isRecord(value: unknown): value is Record<string, any> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

