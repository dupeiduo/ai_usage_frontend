/**
 * Shared API utility — wraps fetch() and automatically attaches
 * the Authorization: Bearer <token> header when a token exists
 * in localStorage.
 * On 401 responses, dispatches a custom "auth:unauthorized" event.
 */

const TOKEN_KEY = 'authToken'

function getAuthHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    const token = localStorage.getItem(TOKEN_KEY)
    const headers: Record<string, string> = { ...extraHeaders }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return headers
}

/** Call this from App to register the global 401 logout handler. */
export function handleUnauthorized(fn: () => void) {
    window.addEventListener('auth:unauthorized', fn)
    return () => window.removeEventListener('auth:unauthorized', fn)
}

async function request(url: string, init: RequestInit): Promise<Response> {
    const res = await fetch(url, init)
    if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return res
}

export async function apiGet(url: string) {
    return request(url, {
        method: 'GET',
        headers: getAuthHeaders(),
    })
}

export async function apiPost(url: string, body?: unknown) {
    return request(url, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })
}
