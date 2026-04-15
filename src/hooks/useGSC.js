const BASE = 'https://www.googleapis.com/webmasters/v3'
const INSPECT_BASE = 'https://searchconsole.googleapis.com/v1'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
})

export async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: HTTP ${res.status}`)
  const data = await res.json()
  if (!data.access_token) throw new Error('No access_token in response')
  return data.access_token
}

export async function fetchProperties(token) {
  const res = await fetch(`${BASE}/sites`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return (data.siteEntry || []).map((s) => ({
    url: s.siteUrl,
    permissionLevel: s.permissionLevel,
  }))
}

export async function fetchSearchAnalytics({ token, siteUrl, startDate, endDate, dimensions = ['date'] }) {
  const res = await fetch(
    `${BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 500 }),
    }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.rows || []
}

export async function fetchSitemaps(token, siteUrl) {
  const res = await fetch(
    `${BASE}/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
    { headers: authHeaders(token) }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.sitemap || []
}

export async function inspectUrl(token, siteUrl, inspectTarget) {
  const res = await fetch(`${INSPECT_BASE}/urlInspection/index:inspect`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ inspectionUrl: inspectTarget, siteUrl }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
