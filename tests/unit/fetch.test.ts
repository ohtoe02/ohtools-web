import { describe, expect, test } from 'vitest';
import { fetchBoundedResource } from '../../src/lib/catalog/fetch';

describe('fetchBoundedResource', () => {
	test('rejects non-HTTPS, credentials, and hosts outside the allowlist', async () => {
		const neverFetch = async () => {
			throw new Error('transport should not be called');
		};
		const options = {
			allowedHosts: ['github.com'],
			maxBytes: 1024,
			fetchImpl: neverFetch as typeof fetch,
		};

		await expect(
			fetchBoundedResource('http://github.com/index.json', options),
		).rejects.toThrow(/credential-free HTTPS/i);
		await expect(
			fetchBoundedResource('https://user:secret@github.com/index.json', options),
		).rejects.toThrow(/credential-free HTTPS/i);
		await expect(
			fetchBoundedResource('https://example.com/index.json', options),
		).rejects.toThrow(/not allowed/i);
	});

	test('validates every redirect and returns a bounded response', async () => {
		const seen: string[] = [];
		const fetchImpl = async (input: string | URL | Request) => {
			const url = input.toString();
			seen.push(url);
			if (url === 'https://github.com/latest') {
				return new Response(null, {
					status: 302,
					headers: {
						location:
							'https://release-assets.githubusercontent.com/catalog/index.json',
					},
				});
			}
			return new Response('verified catalog', {
				status: 200,
				headers: { 'content-length': '16' },
			});
		};

		const bytes = await fetchBoundedResource('https://github.com/latest', {
			allowedHosts: ['github.com', 'release-assets.githubusercontent.com'],
			maxBytes: 32,
			fetchImpl: fetchImpl as typeof fetch,
		});

		expect(Buffer.from(bytes).toString('utf8')).toBe('verified catalog');
		expect(seen).toEqual([
			'https://github.com/latest',
			'https://release-assets.githubusercontent.com/catalog/index.json',
		]);
	});

	test('rejects responses that exceed the byte limit', async () => {
		const declaredTooLarge = async () =>
			new Response('small', {
				status: 200,
				headers: { 'content-length': '4097' },
			});
		const streamedTooLarge = async () =>
			new Response('x'.repeat(33), { status: 200 });

		await expect(
			fetchBoundedResource('https://github.com/index.json', {
				allowedHosts: ['github.com'],
				maxBytes: 4096,
				fetchImpl: declaredTooLarge as typeof fetch,
			}),
		).rejects.toThrow(/exceeds/i);
		await expect(
			fetchBoundedResource('https://github.com/index.json', {
				allowedHosts: ['github.com'],
				maxBytes: 32,
				fetchImpl: streamedTooLarge as typeof fetch,
			}),
		).rejects.toThrow(/exceeds/i);
	});
});

