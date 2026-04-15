import { useState, useEffect, useCallback } from 'react'
import { fetchSearchAnalytics } from '../../hooks/useGSC.js'
import { getDateRange } from '../../utils/dateUtils.js'
import { exportToCSV } from '../../utils/csvExport.js'
import { filterPromptQueries } from '../../utils/queryPatterns.js'
import { paginate } from '../../utils/pagination.js'
import { Button, Spinner, EmptyState, SectionHeader, Table, SearchInput, Pagination } from '../Layout/UI.jsx'

const TABS = ['all', 'questions', 'longTail']

export default function PromptInsights({ token, siteUrl, t }) {
  const [allData, setAllData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { start, end } = getDateRange('last90')
      const rows = await fetchSearchAnalytics({
        token, siteUrl, startDate: start, endDate: end,
        dimensions: ['query'],
      })
      const classified = filterPromptQueries(
        rows.map((r) => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: (r.ctr * 100).toFixed(2),
          position: r.position.toFixed(1),
        }))
      )
      setAllData(classified)
    } catch { setError(t.common.error) }
    finally { setLoading(false) }
  }, [token, siteUrl, t])

  useEffect(() => { load() }, [load])

  const filtered = allData
    .filter((r) => {
      if (tab === 'questions') return r.isQuestion
      if (tab === 'longTail') return r.isLongTail
      return true
    })
    .filter((r) => !search || r.query.toLowerCase().includes(search.toLowerCase()))

  const paged = paginate(filtered, page)

  const handleExport = () => {
    exportToCSV('deep-in-gsc-prompt-insights.csv',
      [t.promptInsights.query, t.promptInsights.clicks, t.promptInsights.impressions, t.promptInsights.position, t.promptInsights.type],
      filtered.map((r) => [
        r.query, r.clicks, r.impressions, r.position,
        r.isQuestion && r.isLongTail ? `${t.promptInsights.typeQuestion} + ${t.promptInsights.typeLongTail}`
          : r.isQuestion ? t.promptInsights.typeQuestion
          : t.promptInsights.typeLongTail,
      ])
    )
  }

  const columns = [
    { key: 'query', label: t.promptInsights.query },
    {
      key: 'type', label: t.promptInsights.type,
      render: (_, row) => (
        <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {row.isQuestion && <span className="type-badge type-question">{t.promptInsights.typeQuestion}</span>}
          {row.isLongTail && <span className="type-badge type-longtail">{t.promptInsights.typeLongTail}</span>}
        </span>
      ),
    },
    { key: 'clicks', label: t.promptInsights.clicks, align: 'right' },
    { key: 'impressions', label: t.promptInsights.impressions, align: 'right' },
    { key: 'position', label: t.promptInsights.position, align: 'right' },
  ]

  return (
    <div className="view-content">
      <SectionHeader title={t.promptInsights.title} subtitle={t.promptInsights.subtitle} />

      <div className="insight-card info" style={{ marginBottom: 20 }}>
        <span className="insight-card-icon">ℹ</span>
        <div className="insight-card-body">
          <div className="insight-card-desc">{t.promptInsights.insightBanner}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><Spinner /> {t.promptInsights.loading}</div>
      ) : error ? (
        <EmptyState message={error} />
      ) : (
        <div className="table-section">
          <div className="table-toolbar">
            <div className="table-tabs">
              {TABS.map((tabKey) => (
                <button key={tabKey}
                  className={`tab-btn${tab === tabKey ? ' active' : ''}`}
                  onClick={() => { setTab(tabKey); setPage(1) }}>
                  {t.promptInsights[tabKey]}
                  <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.6 }}>
                    ({allData.filter((r) => tabKey === 'all' ? true : tabKey === 'questions' ? r.isQuestion : r.isLongTail).length})
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder={t.common.search} />
              <Button variant="secondary" small onClick={handleExport}>{t.promptInsights.exportCSV}</Button>
            </div>
          </div>
          {paged.totalItems > 0 ? (
            <>
              <Table columns={columns} rows={paged.items} />
              <Pagination {...paged} onPage={setPage} t={t} />
            </>
          ) : <EmptyState message={t.promptInsights.noData} />}
        </div>
      )}
    </div>
  )
}
