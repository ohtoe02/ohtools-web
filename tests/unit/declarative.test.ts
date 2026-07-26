import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import {
	buildDeclarativeReference,
	verifyDeclarativeSchema,
	type DeclarativeCopy,
} from '../../src/lib/declarative/reference';

function schema() {
	return {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		$id: 'https://ohtools.dev/schema/declarative/v1',
		title: 'ohtools declarative plugin v1',
		type: 'object',
		additionalProperties: false,
		properties: {},
		$defs: {
			modules: {
				oneOf: [{ $ref: '#/$defs/directory' }, { $ref: '#/$defs/systemd' }],
			},
			directory: {
				title: 'directory',
				description: 'Manage directory state.',
				type: 'object',
				additionalProperties: false,
				'x-ohtools-category': 'files',
				'x-ohtools-safety': 'mutating',
				required: ['path', 'state'],
				properties: {
					path: { type: 'string', description: 'Absolute path.' },
					state: {
						type: 'string',
						enum: ['present', 'absent'],
						description: 'Desired state.',
					},
				},
			},
			systemd: {
				title: 'systemd',
				description: 'Manage service state.',
				type: 'object',
				additionalProperties: false,
				'x-ohtools-category': 'services',
				'x-ohtools-safety': 'mutating',
				required: ['unit'],
				properties: {
					unit: { type: 'string', description: 'Systemd unit.' },
				},
			},
		},
	};
}

const copy: DeclarativeCopy = {
	directory: {
		en: {
			title: 'Directory',
			summary: 'Converge a directory without shell execution.',
			exampleYaml: 'directory:\n  path: /etc/example\n  state: present',
		},
		ru: {
			title: 'Каталог',
			summary: 'Приводит каталог к заданному состоянию без shell.',
			exampleYaml: 'directory:\n  path: /etc/example\n  state: present',
		},
	},
	systemd: {
		en: {
			title: 'Systemd',
			summary: 'Converge service state.',
			exampleYaml: 'systemd:\n  unit: nginx.service',
		},
	},
};

describe('verifyDeclarativeSchema', () => {
	test('accepts the expected schema id and digest', () => {
		const bytes = Buffer.from(JSON.stringify(schema()));
		const digest = createHash('sha256').update(bytes).digest('hex');

		const verified = verifyDeclarativeSchema(bytes, {
			expectedId: 'https://ohtools.dev/schema/declarative/v1',
			expectedSha256: digest,
		});

		expect(verified.sha256).toBe(digest);
		expect(verified.schema.$defs.modules.oneOf).toHaveLength(2);
	});

	test('rejects digest mismatch and unsupported schema identity', () => {
		const bytes = Buffer.from(JSON.stringify(schema()));
		const digest = createHash('sha256').update(bytes).digest('hex');

		expect(() =>
			verifyDeclarativeSchema(bytes, {
				expectedId: 'https://ohtools.dev/schema/declarative/v1',
				expectedSha256: '0'.repeat(64),
			}),
		).toThrow(/digest/i);
		expect(() =>
			verifyDeclarativeSchema(bytes, {
				expectedId: 'https://ohtools.dev/schema/declarative/v2',
				expectedSha256: digest,
			}),
		).toThrow(/identity/i);
	});
});

describe('buildDeclarativeReference', () => {
	test('extracts schema-owned fields and uses explicit locale fallback', () => {
		const result = buildDeclarativeReference(schema(), copy);
		const directory = result.find((module) => module.id === 'directory');
		const systemd = result.find((module) => module.id === 'systemd');

		expect(directory?.fields).toEqual([
			{
				name: 'path',
				type: 'string',
				description: 'Absolute path.',
				required: true,
				values: [],
			},
			{
				name: 'state',
				type: 'string',
				description: 'Desired state.',
				required: true,
				values: ['present', 'absent'],
			},
		]);
		expect(systemd?.copy.ru).toEqual({
			...copy.systemd.en,
			fallback: true,
		});
	});

	test('rejects missing English copy and copy for unknown modules', () => {
		expect(() =>
			buildDeclarativeReference(schema(), {
				directory: copy.directory,
			}),
		).toThrow(/English copy.*systemd/i);
		expect(() =>
			buildDeclarativeReference(schema(), {
				...copy,
				unknown: copy.directory,
			}),
		).toThrow(/unknown module/i);
	});
});

