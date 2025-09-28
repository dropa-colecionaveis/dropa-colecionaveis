/**
 * Client-side CSRF token utilities for secure API requests
 */

let cachedToken: string | null = null
let tokenExpiry: number = 0

/**
 * Fetch a CSRF token from the server
 */
export async function getCSRFToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'same-origin',
    })

    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required for CSRF token')
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success || !data.token) {
      throw new Error('Invalid CSRF token response')
    }

    // Cache the token for 25 minutes (5 minutes before actual expiry)
    cachedToken = data.token
    tokenExpiry = Date.now() + (25 * 60 * 1000)

    return data.token
  } catch (error) {
    console.error('Error fetching CSRF token:', error)
    if (error instanceof Error && error.message.includes('Authentication required')) {
      throw error
    }
    throw new Error('Failed to get CSRF token')
  }
}

/**
 * Make a secure API request with CSRF protection
 */
export async function secureApiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getCSRFToken()

  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  })
}

/**
 * Clear cached CSRF token (useful after logout or auth changes)
 */
export function clearCSRFToken(): void {
  cachedToken = null
  tokenExpiry = 0
}