import { useState, useEffect, useCallback } from 'react'
import { fetchSearchAnalytics } from '../../hooks/useGSC.js'
import { getDateRange } from '../../utils/dateUtils.js'
import { exportToCSV } from '../../utils/csvExport.js'
import { paginate } from '../../utils/pagination.js'
import { Button, Spinner, EmptyState, SectionHeader, Table, SearchInput, Pagination } from '../Layout/UI.jsx'

export default function QueryPage({ token, siteUrl, t }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { start, end } = getDateRange('last28')
      const rows = await fetchSearchAnalytics({
        token, siteUrl, startDate: start, endDate: end,
        dimensions: ['query', 'page'],
      })
      setData(rows.sort((a, b) => b.clicks - a.clicks).map((r) => ({
        query: r.keys[0],
        page: r.keys[1],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: (r.ctr * 100).toFixed(2),
        position: r.position.toFixed(1),
      })))
    } catch { setError(t.common.error) }
    finally { setLoading(false) }
  }, [token, siteUrl, t])

  useEffect(() => { load() }, [load])

  const filtered = data.filter((r) => {
    if (!search) return true
    const s = search.toLowerCase()
    return r.query.toLowerCase().includes(s) || r.page.toLowerCase().includes(s)
  })

  const paged = paginate(filtered, page)

  const handleExport = () => {
    exportToCSV('deep-in-gsc-query-page.csv',
      [t.queryPage.query, t.queryPage.page, t.queryPage.clicks, t.queryPage.impressions, t.queryPage.ctr, t.queryPage.position],
      filtered.map((r) => [r.query, r.page, r.clicks, r.impressions, r.ctr + '%', r.position])
    )
  }

  const columns = [
    { key: 'query', label: t.queryPage.query },
    { key: 'page', label: t.queryPage.page, render: (v) => <span className="url-cell">{v.replace(/^https?:\/\/[^/]+/, '') || '/'}</span> },
    { key: 'clicks', label: t.queryPage.clicks, align: 'right' },
    { key: 'impressions', label: t.queryPage.impressions, align: 'right' },
    { key: 'ctr', label: t.queryPage.ctr, align: 'right', render: (v) => v + '%' },
    { key: 'position', label: t.queryPage.position, align: 'right' },
  ]

  return (
    <div className="view-content">
      <SectionHeader title={t.queryPage.title} subtitle={t.queryPage.subtitle} />
      {loading ? (
        <div className="loading-state"><Spinner /> {t.queryPage.loading}</div>
      ) : error ? (
        <EmptyState message={error} />
      ) : (
        <div className="table-section">
          <div className="table-toolbar">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder={t.queryPage.search} />
            <Button variant="secondary" small onClick={handleExport}>{t.queryPage.exportCSV}</Button>
          </div>
          {paged.totalItems > 0 ? (
            <>
              <Table columns={columns} rows={paged.items} />
              <Pagination {...paged} onPage={setPage} t={t} />
            </>
          ) : <EmptyState message={t.queryPage.noData} />}
        </div>
      )}
    </div>
  )
}
