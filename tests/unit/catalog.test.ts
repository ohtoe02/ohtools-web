import {
	createHash,
	generateKeyPairSync,
	sign,
	type KeyObject,
} from 'node:crypto';
import { describe, expect, test } from 'vitest';
import {
	normalizeCatalog,
	verifyCatalogSnapshot,
	type CatalogIndexV1,
} from '../../src/lib/catalog/catalog';

function keyMaterial() {
	const { privateKey, publicKey } = generateKeyPairSync('ed25519');
	const der = publicKey.export({ format: 'der', type: 'spki' });
	return {
		privateKey,
		publicKeyBase64: Buffer.from(der).subarray(-32).toString('base64'),
	};
}

function catalog(overrides: Partial<CatalogIndexV1> = {}): CatalogIndexV1 {
	return {
		schema_version: '1',
		sequence: 3,
		generated_at: '2026-07-26T00:00:00Z',
		expires_at: '2026-07-28T00:00:00Z',
		plugins: [
			{
				name: 'system-base',
				description: 'System diagnostics.',
				homepage: 'https://github.com/ohtoe02/ohtools-plugins',
				versions: [
					{
						version: '1.0.0',
						minimum_ohtools_version: '0.3.0',
						published_at: '2026-07-24T00:00:00Z',
						yanked: true,
						manifest: manifest('1.0.0'),
						assets: [asset('1')],
					},
					{
						version: '1.0.1',
						minimum_ohtools_version: '0.3.2',
						published_at: '2026-07-25T00:00:00Z',
						yanked: false,
						manifest: manifest('1.0.1'),
						assets: [asset('2')],
					},
				],
			},
		],
		...overrides,
	};
}

function manifest(version: string) {
	return {
		protocol_version: 1,
		name: 'system-base',
		version,
		description: 'System diagnostics.',
		commands: [
			{
				path: ['system', 'info'],
				use: 'info',
				short: 'Show system information',
				category: 'diagnostic' as const,
				arguments: [],
				flags: [],
				requires_root: false,
				requires_force: false,
				supports_dry_run: false,
				requires_confirmation: false,
			},
		],
	};
}

function asset(seed: string) {
	return {
		os: 'linux' as const,
		arch: 'amd64' as const,
		url: `https://github.com/ohtoe02/ohtools-plugins/releases/download/v1.0.${seed}/system-base`,
		sha256: seed.repeat(64),
		size_bytes: 1_024,
	};
}

function signed(index: CatalogIndexV1, privateKey: KeyObject) {
	const indexBytes = Buffer.from(JSON.stringify(index));
	const signature = sign(null, indexBytes, privateKey).toString('base64');
	return {
		indexBytes,
		signatureBytes: Buffer.from(
			JSON.stringify({
				schema_version: '1',
				signatures: [
					{ key_id: 'test-key', algorithm: 'ed25519', value: signature },
				],
			}),
		),
	};
}

describe('verifyCatalogSnapshot', () => {
	test('verifies signed bytes and returns trusted state', () => {
		const keys = keyMaterial();
		const input = signed(catalog(), keys.privateKey);

		const result = verifyCatalogSnapshot(input.indexBytes, input.signatureBytes, {
			now: new Date('2026-07-26T12:00:00Z'),
			trustedKeys: { 'test-key': keys.publicKeyBase64 },
			minimumSequence: 3,
		});

		expect(result.sequence).toBe(3);
		expect(result.verifiedKeyId).toBe('test-key');
		expect(result.indexSha256).toBe(
			createHash('sha256').update(input.indexBytes).digest('hex'),
		);
	});

	test('rejects an unknown top-level field', () => {
		const keys = keyMaterial();
		const input = signed(
			{ ...catalog(), unexpected: true } as CatalogIndexV1,
			keys.privateKey,
		);

		expect(() =>
			verifyCatalogSnapshot(input.indexBytes, input.signatureBytes, {
				now: new Date('2026-07-26T12:00:00Z'),
				trustedKeys: { 'test-key': keys.publicKeyBase64 },
				minimumSequence: 3,
			}),
		).toThrow(/schema/i);
	});

	test('rejects invalid signatures and expired snapshots', () => {
		const trusted = keyMaterial();
		const attacker = keyMaterial();
		const invalid = signed(catalog(), attacker.privateKey);
		const expired = signed(
			catalog({ expires_at: '2026-07-26T11:59:59Z' }),
			trusted.privateKey,
		);
		const options = {
			now: new Date('2026-07-26T12:00:00Z'),
			trustedKeys: { 'test-key': trusted.publicKeyBase64 },
			minimumSequence: 3,
		};

		expect(() =>
			verifyCatalogSnapshot(invalid.indexBytes, invalid.signatureBytes, options),
		).toThrow(/signature/i);
		expect(() =>
			verifyCatalogSnapshot(expired.indexBytes, expired.signatureBytes, options),
		).toThrow(/expired/i);
	});

	test('rejects rollback and same-sequence digest conflicts', () => {
		const keys = keyMaterial();
		const rollback = signed(catalog({ sequence: 2 }), keys.privateKey);
		const conflict = signed(catalog(), keys.privateKey);
		const options = {
			now: new Date('2026-07-26T12:00:00Z'),
			trustedKeys: { 'test-key': keys.publicKeyBase64 },
			minimumSequence: 3,
		};

		expect(() =>
			verifyCatalogSnapshot(rollback.indexBytes, rollback.signatureBytes, options),
		).toThrow(/rollback/i);
		expect(() =>
			verifyCatalogSnapshot(conflict.indexBytes, conflict.signatureBytes, {
				...options,
				previousState: {
					sequence: 3,
					index_sha256: 'f'.repeat(64),
				},
			}),
		).toThrow(/digest conflict/i);
	});
});

describe('normalizeCatalog', () => {
	test('selects the latest non-yanked version and preserves history', () => {
		const [plugin] = normalizeCatalog(catalog());

		expect(plugin.latest.version).toBe('1.0.1');
		expect(plugin.installCommand).toBe('sudo ohtools plugin install system-base');
		expect(plugin.versions.map((version) => version.version)).toEqual([
			'1.0.1',
			'1.0.0',
		]);
		expect(plugin.versions[1].yanked).toBe(true);
	});

	test('rejects credential-bearing or non-HTTPS asset URLs', () => {
		const unsafe = catalog();
		unsafe.plugins[0].versions[0].assets[0].url =
			'https://user:secret@github.com/release';
		unsafe.plugins[0].versions[1].assets[0].url = 'http://github.com/release';

		expect(() => normalizeCatalog(unsafe)).toThrow(/credential-free HTTPS/i);
	});
});

