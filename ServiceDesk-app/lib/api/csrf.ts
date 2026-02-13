/**
 * CSRF Token Management
 * Handles fetching and storing CSRF tokens for API requests
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

let cachedToken: string | null = null;

/**
 * Fetch CSRF token from server
 * Makes a GET request to trigger token generation
 */
export async function fetchCsrfToken(): Promise<string> {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Extract token from response header
    const token = response.headers.get(CSRF_HEADER_NAME);
    if (token) {
      cachedToken = token;
      return token;
    }

    throw new Error('CSRF token not found in response headers');
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
}

/**
 * Get CSRF token from cookies
 */
export function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Clear cached CSRF token
 */
export function clearCsrfToken(): void {
  cachedToken = null;
}

/**
 * Get CSRF token (from cache or fetch if needed)
 */
export async function getCsrfToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  // Try to get from cookie first
  const cookieToken = getCsrfTokenFromCookie();
  if (cookieToken) {
    cachedToken = cookieToken;
    return cookieToken;
  }

  // Fetch from server if not in cookie
  return fetchCsrfToken();
}

/**
 * Add CSRF token to request headers
 */
export async function addCsrfHeader(headers: Record<string, string>): Promise<Record<string, string>> {
  const token = await getCsrfToken();
  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  };
}

/**
 * Wrapper for fetch that automatically adds CSRF token
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method || 'GET';

  // Only add CSRF token for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const headers = await addCsrfHeader(
      (options.headers as Record<string, string>) || {}
    );
    options.headers = headers;
  }

  // Ensure credentials are included for cookie-based auth
  if (options.credentials === undefined) {
    options.credentials = 'include';
  }

  return fetch(url, options);
}
