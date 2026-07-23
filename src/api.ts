/**
 * Shared API utility — wraps fetch() and automatically attaches
 * the Authorization: Bearer <token> header when a token exists
 * in localStorage.
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

export async function apiGet(url: string) {
    return fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
    })
}

export async function apiPost(url: string, body?: unknown) {
    return fetch(url, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })
}
