export interface BoundedFetchOptions {
	allowedHosts: string[];
	maxBytes: number;
	maxRedirects?: number;
	fetchImpl?: typeof fetch;
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export async function fetchBoundedResource(
	input: string,
	options: BoundedFetchOptions,
): Promise<Uint8Array> {
	const fetchImpl = options.fetchImpl ?? fetch;
	const maxRedirects = options.maxRedirects ?? 5;
	let current = validateUrl(input, options.allowedHosts);

	for (let redirects = 0; ; redirects += 1) {
		const response = await fetchImpl(current, {
			redirect: 'manual',
			credentials: 'omit',
			referrerPolicy: 'no-referrer',
			headers: { accept: 'application/json' },
		});

		if (REDIRECT_STATUSES.has(response.status)) {
			if (redirects >= maxRedirects) {
				throw new Error(`upstream redirect limit ${maxRedirects} exceeded`);
			}
			const location = response.headers.get('location');
			if (!location) throw new Error('upstream redirect has no location');
			current = validateUrl(
				new URL(location, current).toString(),
				options.allowedHosts,
			);
			continue;
		}

		if (!response.ok) {
			throw new Error(`upstream request failed with HTTP ${response.status}`);
		}
		return readBounded(response, options.maxBytes);
	}
}

function validateUrl(input: string, allowedHosts: string[]): string {
	let parsed: URL;
	try {
		parsed = new URL(input);
	} catch {
		throw new Error('upstream URL must use credential-free HTTPS');
	}
	if (
		parsed.protocol !== 'https:' ||
		!parsed.hostname ||
		parsed.username ||
		parsed.password
	) {
		throw new Error('upstream URL must use credential-free HTTPS');
	}
	if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
		throw new Error(`upstream host ${parsed.hostname} is not allowed`);
	}
	return parsed.toString();
}

async function readBounded(
	response: Response,
	maxBytes: number,
): Promise<Uint8Array> {
	const declaredLength = response.headers.get('content-length');
	if (declaredLength) {
		const parsed = Number.parseInt(declaredLength, 10);
		if (Number.isFinite(parsed) && parsed > maxBytes) {
			throw new Error(`upstream response exceeds ${maxBytes} bytes`);
		}
	}
	if (!response.body) return new Uint8Array();

	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			throw new Error(`upstream response exceeds ${maxBytes} bytes`);
		}
		chunks.push(value);
	}

	const result = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return result;
}

