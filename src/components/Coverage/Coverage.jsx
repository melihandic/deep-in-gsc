import { useState, useEffect, useCallback } from 'react'
import { fetchSearchAnalytics } from '../../hooks/useGSC.js'
import { getDateRange } from '../../utils/dateUtils.js'
import { exportToCSV } from '../../utils/csvExport.js'
import { Button, Spinner, EmptyState, SectionHeader, Table } from '../Layout/UI.jsx'

const STATUS_COLORS = {
  valid: '#0F6E56',
  error: '#A32D2D',
  excluded: '#854F0B',
  warning: '#185FA5',
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null

  let cumulative = 0
  const radius = 60
  const cx = 80
  const cy = 80
  const circumference = 2 * Math.PI * radius

  const arcs = segments.map((seg) => {
    const pct = seg.value / total
    const offset = circumference * (1 - cumulative - pct)
    cumulative += pct
    return { ...seg, pct, offset, dash: circumference * pct }
  })

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={18}
          strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
          strokeDashoffset={arc.offset + circumference * 0.25}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={500} fill="currentColor">
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="#888">
        total
      </text>
    </svg>
  )
}

export default function Coverage({ token, siteUrl, onInspectUrl, t }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { start, end } = getDateRange('last28')
      const rows = await fetchSearchAnalytics({
        token,
        siteUrl,
        startDate: start,
        endDate: end,
        dimensions: ['page'],
      })
      setData(
        rows.map((r) => ({
          page: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: (r.ctr * 100).toFixed(2),
          position: r.position.toFixed(1),
          status: r.impressions > 0 ? 'valid' : 'excluded',
        }))
      )
    } catch {
      setError(t.common.error)
    } finally {
      setLoading(false)
    }
  }, [token, siteUrl, t])

  useEffect(() => { load() }, [load])

  const counts = {
    valid: data.filter((d) => d.status === 'valid').length,
    excluded: data.filter((d) => d.status === 'excluded').length,
    error: 0,
    warning: 0,
  }

  const donutSegments = [
    { label: t.coverage.valid, value: counts.valid, color: STATUS_COLORS.valid },
    { label: t.coverage.excluded, value: counts.excluded, color: STATUS_COLORS.excluded },
    { label: t.coverage.error, value: counts.error, color: STATUS_COLORS.error },
    { label: t.coverage.warning, value: counts.warning, color: STATUS_COLORS.warning },
  ].filter((s) => s.value > 0)

  const filtered = data.filter(
    (d) => !search || d.page.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = () => {
    exportToCSV('gsc-coverage.csv', [t.coverage.valid, 'URL', t.dashboard.clicks, t.dashboard.impressions, t.dashboard.ctr, t.dashboard.position], filtered.map((r) => [r.status, r.page, r.clicks, r.impressions, r.ctr + '%', r.position]))
  }

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`status-dot status-${val}`}>{val}</span>
      ),
    },
    {
      key: 'page',
      label: 'URL',
      render: (val) => (
        <span className="url-cell" title={val}>{val.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
      ),
    },
    { key: 'clicks', label: t.dashboard.clicks, align: 'right' },
    { key: 'impressions', label: t.dashboard.impressions, align: 'right' },
    { key: 'ctr', label: t.dashboard.ctr, align: 'right', render: (v) => v + '%' },
    { key: 'position', label: t.dashboard.position, align: 'right' },
    {
      key: 'page',
      label: '',
      render: (val) => (
        <button className="inspect-link" onClick={(e) => { e.stopPropagation(); onInspectUrl(val) }}>
          {t.coverage.inspectUrl} →
        </button>
      ),
    },
  ]

  return (
    <div className="view-content">
      <SectionHeader title={t.coverage.title} subtitle={t.coverage.subtitle} />

      {loading ? (
        <div className="loading-state"><Spinner /> {t.coverage.loading}</div>
      ) : error ? (
        <EmptyState message={error} />
      ) : (
        <>
          <div className="coverage-summary">
            <DonutChart segments={donutSegments} />
            <div className="coverage-legend">
              {[
                { key: 'valid', label: t.coverage.valid, count: counts.valid },
                { key: 'excluded', label: t.coverage.excluded, count: counts.excluded },
                { key: 'error', label: t.coverage.error, count: counts.error },
                { key: 'warning', label: t.coverage.warning, count: counts.warning },
              ].map((item) => (
                <div key={item.key} className="legend-item">
                  <span className="legend-dot" style={{ background: STATUS_COLORS[item.key] }} />
                  <span className="legend-label">{item.label}</span>
                  <span className="legend-count">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="table-section">
            <div className="table-toolbar">
              <input
                type="text"
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.common.search}
              />
              <Button variant="secondary" small onClick={handleExport}>
                {t.coverage.exportCSV}
              </Button>
            </div>
            {filtered.length ? (
              <Table columns={columns} rows={filtered} />
            ) : (
              <EmptyState message={t.coverage.noData} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
