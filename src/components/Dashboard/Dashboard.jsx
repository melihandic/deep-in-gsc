import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchSearchAnalytics } from '../../hooks/useGSC.js'
import { getDateRange } from '../../utils/dateUtils.js'
import { exportToCSV } from '../../utils/csvExport.js'
import { paginate } from '../../utils/pagination.js'
import { MetricCard, Button, Spinner, EmptyState, SectionHeader, Table, SearchInput, Badge, Pagination } from '../Layout/UI.jsx'

const PRESETS = ['last7', 'last28', 'last90']

const POSITION_FILTERS = [
  { key: 'all',       test: () => true },
  { key: 'pos1',      test: (p) => parseFloat(p) < 1.8 },
  { key: 'top3',      test: (p) => parseFloat(p) <= 3 },
  { key: 'page1',     test: (p) => parseFloat(p) <= 10 },
  { key: 'page2',     test: (p) => parseFloat(p) > 10 && parseFloat(p) <= 20 },
  { key: 'page3plus', test: (p) => parseFloat(p) > 20 },
  { key: 'lowCtr',    test: () => true, ctrOnly: true },
]

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return Math.round(n).toString()
}

function calcMetrics(rows) {
  if (!rows.length) return { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  const clicks = rows.reduce((s, r) => s + (r.clicks || 0), 0)
  const impressions = rows.reduce((s, r) => s + (r.impressions || 0), 0)
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
  const position = rows.reduce((s, r) => s + (r.position || 0), 0) / rows.length
  return { clicks, impressions, ctr: ctr.toFixed(2), position: position.toFixed(1) }
}

function buildInsights(pageData, metrics, t) {
  const insights = []
  const lowCtr = pageData.filter((p) => p.impressions > 100 && parseFloat(p.ctr) < 2)
  if (lowCtr.length > 0) {
    insights.push({ variant: 'warning', icon: '⚠', title: t.dashboard.ctrWarning, desc: `${lowCtr.length} ${t.dashboard.ctrWarningDesc}` })
  }
  const highImpNoClick = pageData.filter((p) => p.impressions > 500 && p.clicks === 0)
  if (highImpNoClick.length > 0) {
    insights.push({ variant: 'error', icon: '✕', title: t.dashboard.zeroClickTitle, desc: `${highImpNoClick.length} ${t.dashboard.zeroClickDesc}` })
  }
  if (parseFloat(metrics.position) > 20) {
    insights.push({ variant: 'warning', icon: '◎', title: t.dashboard.avgPosWarning, desc: t.dashboard.avgPosDesc })
  }
  return insights
}

export default function Dashboard({ token, siteUrl, t, lang }) {
  const [preset, setPreset] = useState('last28')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [tab, setTab] = useState('pages')
  const [posFilter, setPosFilter] = useState('all')
  const [chartData, setChartData] = useState([])
  const [pageData, setPageData] = useState([])
  const [queryData, setQueryData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [pagePage, setPagePage] = useState(1)
  const [queryPage, setQueryPage] = useState(1)

  const getActiveDates = useCallback(() => {
    if (isCustom && customStart && customEnd) return { start: customStart, end: customEnd }
    return getDateRange(preset)
  }, [preset, isCustom, customStart, customEnd])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { start, end } = getActiveDates()
      const [byDate, byPage, byQuery] = await Promise.all([
        fetchSearchAnalytics({ token, siteUrl, startDate: start, endDate: end, dimensions: ['date'] }),
        fetchSearchAnalytics({ token, siteUrl, startDate: start, endDate: end, dimensions: ['page'] }),
        fetchSearchAnalytics({ token, siteUrl, startDate: start, endDate: end, dimensions: ['query'] }),
      ])
      setChartData(byDate.map((r) => ({
        date: r.keys[0], clicks: r.clicks, impressions: r.impressions,
        ctr: parseFloat((r.ctr * 100).toFixed(2)), position: parseFloat(r.position.toFixed(1)),
      })))
      setPageData(byPage.sort((a, b) => b.clicks - a.clicks).map((r) => ({
        page: r.keys[0], clicks: r.clicks, impressions: r.impressions,
        ctr: (r.ctr * 100).toFixed(2), position: r.position.toFixed(1),
        lowCtr: r.impressions > 100 && r.ctr < 0.02,
      })))
      setQueryData(byQuery.sort((a, b) => b.clicks - a.clicks).map((r) => ({
        query: r.keys[0], clicks: r.clicks, impressions: r.impressions,
        ctr: (r.ctr * 100).toFixed(2), position: r.position.toFixed(1),
        lowCtr: r.impressions > 100 && r.ctr < 0.02,
      })))
    } catch { setError(t.common.error) }
    finally { setLoading(false) }
  }, [token, siteUrl, getActiveDates, t])

  useEffect(() => { load() }, [load])

  const filterRows = (rows) => {
    const filterDef = POSITION_FILTERS.find((f) => f.key === posFilter) || POSITION_FILTERS[0]
    return rows
      .filter((r) => filterDef.ctrOnly ? r.lowCtr : filterDef.test(r.position))
      .filter((r) => !search || (tab === 'pages'
        ? r.page.toLowerCase().includes(search.toLowerCase())
        : r.query.toLowerCase().includes(search.toLowerCase())))
  }

  const metrics = calcMetrics(chartData)
  const insights = buildInsights(pageData, metrics, t)
  const filteredPages = filterRows(pageData)
  const filteredQueries = filterRows(queryData)

  const pagedPages = paginate(filteredPages, pagePage)
  const pagedQueries = paginate(filteredQueries, queryPage)

  const handleExport = () => {
    const data = tab === 'pages' ? filteredPages : filteredQueries
    const key = tab === 'pages' ? t.dashboard.page : t.dashboard.query
    exportToCSV(`deep-in-gsc-${tab}.csv`,
      [key, t.dashboard.clicks, t.dashboard.impressions, t.dashboard.ctr, t.dashboard.position],
      data.map((r) => [tab === 'pages' ? r.page : r.query, r.clicks, r.impressions, r.ctr + '%', r.position])
    )
  }

  const pageColumns = [
    {
      key: 'page', label: t.dashboard.page,
      render: (val, row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="url-cell">{val.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
          {row.lowCtr && <Badge variant="warning">{t.dashboard.lowCtr}</Badge>}
        </span>
      ),
    },
    { key: 'clicks', label: t.dashboard.clicks, align: 'right', render: (v) => formatNum(v) },
    { key: 'impressions', label: t.dashboard.impressions, align: 'right', render: (v) => formatNum(v) },
    { key: 'ctr', label: t.dashboard.ctr, align: 'right', render: (v) => v + '%' },
    { key: 'position', label: t.dashboard.position, align: 'right' },
  ]

  const queryColumns = [
    {
      key: 'query', label: t.dashboard.query,
      render: (val, row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{val}</span>
          {row.lowCtr && <Badge variant="warning">{t.dashboard.lowCtr}</Badge>}
        </span>
      ),
    },
    { key: 'clicks', label: t.dashboard.clicks, align: 'right', render: (v) => formatNum(v) },
    { key: 'impressions', label: t.dashboard.impressions, align: 'right', render: (v) => formatNum(v) },
    { key: 'ctr', label: t.dashboard.ctr, align: 'right', render: (v) => v + '%' },
    { key: 'position', label: t.dashboard.position, align: 'right' },
  ]

  const filterLabel = (key) => ({
    all: t.dashboard.filterAll, pos1: t.dashboard.filterPos1, top3: t.dashboard.filterTop3,
    page1: t.dashboard.filterPage1, page2: t.dashboard.filterPage2,
    page3plus: t.dashboard.filterPage3plus, lowCtr: t.dashboard.filterLowCtr,
  })[key]

  return (
    <div className="view-content">
      <SectionHeader
        title={t.dashboard.title}
        subtitle={t.dashboard.subtitle}
        action={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRESETS.map((p) => (
                <button key={p} className={`preset-btn${!isCustom && preset === p ? ' active' : ''}`}
                  onClick={() => { setPreset(p); setIsCustom(false) }}>{t.dashboard[p]}</button>
              ))}
              <button className={`preset-btn${isCustom ? ' active' : ''}`} onClick={() => setIsCustom(true)}>
                {t.dashboard.custom}
              </button>
            </div>
            {isCustom && (
              <div className="custom-date-row">
                <input type="date" className="date-input" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                <span style={{ color: 'var(--text-3)', fontSize: 12 }}>→</span>
                <input type="date" className="date-input" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                <Button small onClick={load} disabled={!customStart || !customEnd}>{t.dashboard.apply}</Button>
              </div>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="loading-state"><Spinner /> {t.dashboard.loading}</div>
      ) : error ? (
        <EmptyState message={error} />
      ) : (
        <>
          <div className="metrics-grid">
            <MetricCard label={t.dashboard.totalClicks} value={formatNum(metrics.clicks)} />
            <MetricCard label={t.dashboard.totalImpressions} value={formatNum(metrics.impressions)} />
            <MetricCard label={t.dashboard.avgCTR} value={metrics.ctr + '%'} />
            <MetricCard label={t.dashboard.avgPosition} value={metrics.position} />
          </div>

          {insights.length > 0 && (
            <div className="insight-grid">
              {insights.map((ins, i) => (
                <div key={i} className={`insight-card ${ins.variant}`}>
                  <span className="insight-card-icon">{ins.icon}</span>
                  <div className="insight-card-body">
                    <div className="insight-card-title">{ins.title}</div>
                    <div className="insight-card-desc">{ins.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="chart-card">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="clicks" stroke="#1750a0" strokeWidth={2.5} dot={false} name={t.dashboard.clicks} />
                <Line type="monotone" dataKey="impressions" stroke="#2d9e6b" strokeWidth={1.5} dot={false} strokeOpacity={0.5} name={t.dashboard.impressions} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="table-section">
            <div className="table-toolbar">
              <div className="table-tabs">
                <button className={`tab-btn${tab === 'pages' ? ' active' : ''}`}
                  onClick={() => { setTab('pages'); setSearch(''); setPagePage(1) }}>{t.dashboard.topPages}</button>
                <button className={`tab-btn${tab === 'queries' ? ' active' : ''}`}
                  onClick={() => { setTab('queries'); setSearch(''); setQueryPage(1) }}>{t.dashboard.topQueries}</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <SearchInput value={search} onChange={(v) => { setSearch(v); setPagePage(1); setQueryPage(1) }} placeholder={t.common.search} />
                <Button variant="secondary" small onClick={handleExport}>{t.dashboard.exportCSV}</Button>
              </div>
            </div>

            <div className="filter-bar">
              {POSITION_FILTERS.map((f) => (
                <button key={f.key} className={`filter-btn${posFilter === f.key ? ' active' : ''}`}
                  onClick={() => { setPosFilter(f.key); setPagePage(1); setQueryPage(1) }}>
                  {filterLabel(f.key)}
                </button>
              ))}
            </div>

            {tab === 'pages' ? (
              pagedPages.totalItems > 0 ? (
                <>
                  <Table columns={pageColumns} rows={pagedPages.items} />
                  <Pagination {...pagedPages} onPage={setPagePage} t={t} />
                </>
              ) : <EmptyState message={t.dashboard.noData} />
            ) : (
              pagedQueries.totalItems > 0 ? (
                <>
                  <Table columns={queryColumns} rows={pagedQueries.items} />
                  <Pagination {...pagedQueries} onPage={setQueryPage} t={t} />
                </>
              ) : <EmptyState message={t.dashboard.noData} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
