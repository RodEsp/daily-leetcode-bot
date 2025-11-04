/**
 * Retries a fetch call with exponential backoff
 */
export async function fetchWithRetry(
	url: string,
	options?: RequestInit,
	maxRetries = 3,
): Promise<Response> {
	let lastError: Error | undefined;
	let lastResponse: Response | undefined;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const response = await fetch(url, options);
			lastResponse = response;

			// Don't retry on 4xx errors (client errors) except 408 (timeout) and 429 (rate limit)
			if (!response.ok && response.status >= 400 && response.status < 500) {
				if (response.status !== 408 && response.status !== 429) {
					return response; // Return immediately for client errors
				}
			}

			// Success or non-5xx error - return response
			if (response.ok || response.status < 500) {
				return response;
			}

			// 5xx server error - will retry below if we have attempts left
			lastError = new Error(
				`Server returned ${response.status} ${response.statusText}`,
			);
		} catch (error) {
			// Catch block handles network errors (DNS failures, connection timeouts, network unreachable)
			lastError = error instanceof Error ? error : new Error(String(error));
		}

		if (attempt < maxRetries - 1) {
			const delay = 3 ** attempt * 1000; // Exponential backoff: 1s, 3s, 9s
			const errorType = lastResponse
				? `returned ${lastResponse.status}`
				: `failed: ${lastError.message}`;
			console.warn(
				`Fetch attempt ${attempt + 1}/${maxRetries} ${errorType} for ${url}. Retrying in ${delay}ms...`,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		} else {
			// Last attempt - return response if we have one, otherwise throw
			if (lastResponse) {
				return lastResponse;
			}
			throw new Error(
				`Failed to fetch ${url} after ${maxRetries} attempts. Last error: ${lastError?.message}`,
			);
		}
	}

	// This should never be reached, but TypeScript needs it
	throw new Error(
		`Failed to fetch ${url} after ${maxRetries} attempts. Last error: ${lastError?.message}`,
	);
}

/**
 * Returns a random number from 0 to max
 */
export function random(max: number): number {
	return Math.floor(Math.random() * (max + 1));
}

