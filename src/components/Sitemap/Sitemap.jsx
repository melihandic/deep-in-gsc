import { useState, useEffect, useCallback } from 'react'
import { fetchSitemaps } from '../../hooks/useGSC.js'
import { exportToCSV } from '../../utils/csvExport.js'
import { formatDisplayDate } from '../../utils/dateUtils.js'
import { Button, Spinner, EmptyState, SectionHeader, Table } from '../Layout/UI.jsx'

function sitemapStatus(sitemap) {
  if ((sitemap.errors || 0) > 0) return 'error'
  if ((sitemap.warnings || 0) > 0) return 'warning'
  return 'valid'
}

// GSC returns contents as an array with multiple type entries (web, image, video etc.)
// Sum all content entries to get accurate totals
function sumContents(contents = [], field) {
  return contents.reduce((sum, c) => sum + (parseInt(c[field], 10) || 0), 0)
}

export default function Sitemap({ token, siteUrl, t }) {
  const [sitemaps, setSitemaps] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSitemaps(token, siteUrl)
      setSitemaps(data)
    } catch {
      setError(t.common.error)
    } finally {
      setLoading(false)
    }
  }, [token, siteUrl, t])

  useEffect(() => { load() }, [load])

  const totalSubmitted = sitemaps.reduce((sum, s) => sum + sumContents(s.contents, 'submitted'), 0)
  const totalIndexed = sitemaps.reduce((sum, s) => sum + sumContents(s.contents, 'indexed'), 0)
  const totalErrors = sitemaps.reduce((sum, s) => sum + (s.errors || 0), 0)

  const handleExport = () => {
    exportToCSV('deep-in-gsc-sitemaps.csv',
      [t.sitemap.url, t.sitemap.submitted, t.sitemap.indexed, t.sitemap.warnings, t.sitemap.errors, t.sitemap.lastDownloaded, t.sitemap.status],
      sitemaps.map((s) => [
        s.path,
        sumContents(s.contents, 'submitted'),
        sumContents(s.contents, 'indexed'),
        s.warnings || 0,
        s.errors || 0,
        s.lastDownloaded || '',
        sitemapStatus(s),
      ])
    )
  }

  const columns = [
    {
      key: 'path',
      label: t.sitemap.url,
      render: (val) => <span className="url-cell">{val}</span>,
    },
    {
      key: 'submitted',
      label: t.sitemap.submitted,
      align: 'right',
      render: (_, row) => sumContents(row.contents, 'submitted').toLocaleString(),
    },
    {
      key: 'indexed',
      label: t.sitemap.indexed,
      align: 'right',
      render: (_, row) => {
        const sub = sumContents(row.contents, 'submitted')
        const idx = sumContents(row.contents, 'indexed')
        const pct = sub > 0 ? Math.round((idx / sub) * 100) : 0
        return (
          <span>
            {idx.toLocaleString()}
            <span style={{ color: pct < 80 ? '#c03030' : '#1a6b4a', marginLeft: 4, fontSize: 11 }}>
              {pct}%
            </span>
          </span>
        )
      },
    },
    {
      key: 'warnings',
      label: t.sitemap.warnings,
      align: 'right',
      render: (_, row) => row.warnings || 0,
    },
    {
      key: 'errors',
      label: t.sitemap.errors,
      align: 'right',
      render: (_, row) => {
        const e = row.errors || 0
        return e > 0 ? <span style={{ color: '#c03030', fontWeight: 500 }}>{e}</span> : 0
      },
    },
    {
      key: 'lastDownloaded',
      label: t.sitemap.lastDownloaded,
      render: (val) => formatDisplayDate(val),
    },
    {
      key: 'status',
      label: t.sitemap.status,
      render: (_, row) => {
        const s = sitemapStatus(row)
        return <span className={`status-dot status-${s}`}>{s}</span>
      },
    },
  ]

  const rows = sitemaps.map((s) => ({ ...s }))

  return (
    <div className="view-content">
      <SectionHeader title={t.sitemap.title} subtitle={t.sitemap.subtitle} />

      {loading ? (
        <div className="loading-state"><Spinner /> {t.sitemap.loading}</div>
      ) : error ? (
        <EmptyState message={error} />
      ) : (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">{t.sitemap.url}</span>
              <span className="metric-value">{sitemaps.length}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">{t.sitemap.submitted}</span>
              <span className="metric-value">{totalSubmitted.toLocaleString()}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">{t.sitemap.indexed}</span>
              <span className="metric-value">{totalIndexed.toLocaleString()}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">{t.sitemap.errors}</span>
              <span className="metric-value" style={{ color: totalErrors > 0 ? '#c03030' : 'inherit' }}>
                {totalErrors}
              </span>
            </div>
          </div>

          {totalErrors > 0 && (
            <div className="insight-card error" style={{ marginBottom: 20 }}>
              <span className="insight-card-icon">✕</span>
              <div className="insight-card-body">
                <div className="insight-card-desc">{totalErrors} sitemap error(s) detected — review and resubmit affected sitemaps.</div>
              </div>
            </div>
          )}

          <div className="table-section">
            <div className="table-toolbar">
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{sitemaps.length} sitemaps</span>
              <Button variant="secondary" small onClick={handleExport}>{t.sitemap.exportCSV}</Button>
            </div>
            {rows.length ? <Table columns={columns} rows={rows} /> : <EmptyState message={t.sitemap.noData} />}
          </div>
        </>
      )}
    </div>
  )
}
