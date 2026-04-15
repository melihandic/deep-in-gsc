import { useState } from 'react'
import { fetchSearchAnalytics } from '../../hooks/useGSC.js'
import { formatDate } from '../../utils/dateUtils.js'
import { exportToCSV } from '../../utils/csvExport.js'
import { Button, Spinner, EmptyState, SectionHeader, Table } from '../Layout/UI.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function defaultPeriod(offsetDays, rangeDays) {
  const end = new Date()
  end.setDate(end.getDate() - offsetDays)
  const start = new Date(end)
  start.setDate(start.getDate() - rangeDays)
  return { start: formatDate(start), end: formatDate(end) }
}

function pctChange(a, b) {
  if (!a || a === 0) return null
  return ((b - a) / a) * 100
}

function ChangeCell({ value }) {
  if (value === null) return <span>—</span>
  const pos = value > 0
  const zero = Math.abs(value) < 0.1
  return (
    <span style={{ color: zero ? 'inherit' : pos ? '#0F6E56' : '#A32D2D', fontWeight: 500 }}>
      {pos ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

export default function Comparison({ token, siteUrl, t, lang }) {
  const pa = defaultPeriod(31, 28)
  const pb = defaultPeriod(3, 28)

  const [aStart, setAStart] = useState(pa.start)
  const [aEnd, setAEnd] = useState(pa.end)
  const [bStart, setBStart] = useState(pb.start)
  const [bEnd, setBEnd] = useState(pb.end)

  const [aName, setAName] = useState(t.comparison.periodA)
  const [bName, setBName] = useState(t.comparison.periodB)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCompare = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const [aDate, bDate, aPage, bPage, aQuery, bQuery] = await Promise.all([
        fetchSearchAnalytics({ token, siteUrl, startDate: aStart, endDate: aEnd, dimensions: ['date'] }),
        fetchSearchAnalytics({ token, siteUrl, startDate: bStart, endDate: bEnd, dimensions: ['date'] }),
        fetchSearchAnalytics({ token, siteUrl, startDate: aStart, endDate: aEnd, dimensions: ['page'] }),
        fetchSearchAnalytics({ token, siteUrl, startDate: bStart, endDate: bEnd, dimensions: ['page'] }),
        fetchSearchAnalytics({ token, siteUrl, startDate: aStart, endDate: aEnd, dimensions: ['query'] }),
        fetchSearchAnalytics({ token, siteUrl, startDate: bStart, endDate: bEnd, dimensions: ['query'] }),
      ])

      const sumRows = (rows) => rows.reduce(
        (acc, r) => ({
          clicks: acc.clicks + r.clicks,
          impressions: acc.impressions + r.impressions,
          ctr: acc.ctr + r.ctr,
          position: acc.position + r.position,
          count: acc.count + 1,
        }),
        { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }
      )

      const aSum = sumRows(aDate)
      const bSum = sumRows(bDate)

      const metrics = [
        { metric: 'Clicks', a: aSum.clicks, b: bSum.clicks },
        { metric: 'Impressions', a: aSum.impressions, b: bSum.impressions },
        { metric: 'Avg CTR', a: aSum.count ? ((aSum.ctr / aSum.count) * 100).toFixed(2) : 0, b: bSum.count ? ((bSum.ctr / bSum.count) * 100).toFixed(2) : 0 },
        { metric: 'Avg Position', a: aSum.count ? (aSum.position / aSum.count).toFixed(1) : 0, b: bSum.count ? (bSum.position / bSum.count).toFixed(1) : 0 },
      ]

      const pageMap = {}
      aPage.forEach((r) => { pageMap[r.keys[0]] = { page: r.keys[0], aClicks: r.clicks, bClicks: 0 } })
      bPage.forEach((r) => {
        if (pageMap[r.keys[0]]) pageMap[r.keys[0]].bClicks = r.clicks
        else pageMap[r.keys[0]] = { page: r.keys[0], aClicks: 0, bClicks: r.clicks }
      })

      const pages = Object.values(pageMap).map((p) => ({
        ...p,
        change: pctChange(p.aClicks, p.bClicks),
      }))

      const MIN_CLICKS = 100

      const winners = pages
        .filter((p) => p.change !== null && p.change > 0 && p.aClicks >= MIN_CLICKS && p.bClicks >= MIN_CLICKS)
        .sort((a, b) => b.change - a.change)
        .slice(0, 10)

      const losers = pages
        .filter((p) => p.change !== null && p.change < 0 && p.aClicks >= MIN_CLICKS && p.bClicks >= MIN_CLICKS)
        .sort((a, b) => a.change - b.change)
        .slice(0, 10)

      const chartData = metrics.map((m) => ({
        name: m.metric,
        [aName]: parseFloat(m.a),
        [bName]: parseFloat(m.b),
      }))

      setResult({ metrics, winners, losers, chartData })
    } catch {
      setError(t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!result) return
    exportToCSV('deep-in-gsc-comparison.csv',
      [t.comparison.metric, aName, bName, t.comparison.change],
      result.metrics.map((m) => [m.metric, m.a, m.b, pctChange(parseFloat(m.a), parseFloat(m.b))?.toFixed(1) + '%'])
    )
  }

  const metricsColumns = [
    { key: 'metric', label: t.comparison.metric },
    { key: 'a', label: `${aName} (${aStart} → ${aEnd})`, align: 'right' },
    { key: 'b', label: `${bName} (${bStart} → ${bEnd})`, align: 'right' },
    {
      key: 'change',
      label: t.comparison.change,
      align: 'right',
      render: (_, row) => <ChangeCell value={pctChange(parseFloat(row.a), parseFloat(row.b))} />,
    },
  ]

  const pageColumns = [
    { key: 'page', label: 'URL', render: (v) => <span className="url-cell">{v.replace(/^https?:\/\/[^/]+/, '') || '/'}</span> },
    { key: 'aClicks', label: aName, align: 'right' },
    { key: 'bClicks', label: bName, align: 'right' },
    { key: 'change', label: t.comparison.change, align: 'right', render: (v) => <ChangeCell value={v} /> },
  ]

  return (
    <div className="view-content">
      <SectionHeader title={t.comparison.title} subtitle={t.comparison.subtitle} />

      <div className="comparison-form">
        <div className="period-block">
          <input
            className="period-name-input period-a"
            value={aName}
            onChange={(e) => setAName(e.target.value)}
            maxLength={24}
          />
          <div className="date-range">
            <input type="date" className="date-input" value={aStart} onChange={(e) => setAStart(e.target.value)} />
            <span className="date-sep">→</span>
            <input type="date" className="date-input" value={aEnd} onChange={(e) => setAEnd(e.target.value)} />
          </div>
        </div>

        <span className="vs-label">VS</span>

        <div className="period-block">
          <input
            className="period-name-input period-b"
            value={bName}
            onChange={(e) => setBName(e.target.value)}
            maxLength={24}
          />
          <div className="date-range">
            <input type="date" className="date-input" value={bStart} onChange={(e) => setBStart(e.target.value)} />
            <span className="date-sep">→</span>
            <input type="date" className="date-input" value={bEnd} onChange={(e) => setBEnd(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleCompare} disabled={loading}>
          {loading ? <><Spinner /> {t.comparison.comparing}</> : t.comparison.compare}
        </Button>
      </div>

      {error && <div className="insight-banner error">{error}</div>}

      {!result && !loading && <EmptyState message={t.comparison.noData} />}

      {result && (
        <>
          <div className="table-section">
            <div className="table-toolbar">
              <span style={{ fontWeight: 500, fontSize: 14 }}>Summary</span>
              <Button variant="secondary" small onClick={handleExport}>{t.comparison.exportCSV}</Button>
            </div>
            <Table columns={metricsColumns} rows={result.metrics} />
          </div>

          <div className="chart-card">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={result.chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey={aName} fill="#1750a0" radius={[3,3,0,0]} />
                <Bar dataKey={bName} fill="#2d9e6b" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="winners-losers-stack">
            <div className="wl-section">
              <h3 className="wl-title winners">{t.comparison.winners}</h3>
              <p className="wl-hint">{lang === 'tr' ? 'Her iki dönemde de min. 100 tıklama' : 'Min. 100 clicks in both periods'}</p>
              {result.winners.length
                ? <Table columns={pageColumns} rows={result.winners} />
                : <EmptyState message={lang === 'tr' ? 'Eşik değerini karşılayan artış yok.' : 'No gainers meeting the threshold.'} />}
            </div>
            <div className="wl-section">
              <h3 className="wl-title losers">{t.comparison.losers}</h3>
              <p className="wl-hint">{lang === 'tr' ? 'Her iki dönemde de min. 100 tıklama' : 'Min. 100 clicks in both periods'}</p>
              {result.losers.length
                ? <Table columns={pageColumns} rows={result.losers} />
                : <EmptyState message={lang === 'tr' ? 'Eşik değerini karşılayan düşüş yok.' : 'No losers meeting the threshold.'} />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
