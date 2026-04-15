import { useState } from 'react'
import { inspectUrl } from '../../hooks/useGSC.js'
import { Button, Spinner, SectionHeader } from '../Layout/UI.jsx'
import { formatDisplayDate } from '../../utils/dateUtils.js'

function ResultRow({ label, value, highlight }) {
  return (
    <div className="inspect-row">
      <span className="inspect-label">{label}</span>
      <span className={`inspect-value${highlight ? ' highlight' : ''}`}>{value || '—'}</span>
    </div>
  )
}

function StatusBadge({ state }) {
  const map = {
    PASS: { label: 'Pass', cls: 'valid' },
    FAIL: { label: 'Fail', cls: 'error' },
    NEUTRAL: { label: 'Neutral', cls: 'warning' },
    VERDICT_UNSPECIFIED: { label: 'Unknown', cls: 'excluded' },
  }
  const { label, cls } = map[state] || { label: state, cls: 'excluded' }
  return <span className={`status-dot status-${cls}`}>{label}</span>
}

export default function URLInspect({ token, siteUrl, initialUrl = '', t }) {
  const [url, setUrl] = useState(initialUrl)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInspect = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await inspectUrl(token, siteUrl, url.trim())
      setResult(data)
    } catch {
      setError(t.inspect.error)
    } finally {
      setLoading(false)
    }
  }

  const idx = result?.inspectionResult?.indexStatusResult
  const mobile = result?.inspectionResult?.mobileUsabilityResult
  const rich = result?.inspectionResult?.richResultsResult

  return (
    <div className="view-content">
      <SectionHeader title={t.inspect.title} subtitle={t.inspect.subtitle} />

      <div className="inspect-form">
        <div className="inspect-input-row">
          <input
            type="url"
            className="search-input inspect-url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t.inspect.urlPlaceholder}
            onKeyDown={(e) => e.key === 'Enter' && handleInspect()}
          />
          <Button onClick={handleInspect} disabled={!url.trim() || loading}>
            {loading ? <><Spinner /> {t.inspect.inspecting}</> : t.inspect.inspect}
          </Button>
        </div>
      </div>

      {error && <div className="insight-banner error"><span className="insight-icon">✕</span> {error}</div>}

      {!result && !loading && !error && (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <span className="empty-icon">◎</span>
          <p>{t.inspect.noData}</p>
        </div>
      )}

      {idx && (
        <div className="inspect-results">
          <div className="inspect-section">
            <h3 className="inspect-section-title">{t.inspect.coverageState}</h3>
            <div className="inspect-card">
              <ResultRow label={t.inspect.coverageState} value={<StatusBadge state={idx.verdict} />} />
              <ResultRow label={t.inspect.crawledAs} value={idx.crawledAs} />
              <ResultRow
                label={t.inspect.lastCrawl}
                value={idx.lastCrawlTime ? formatDisplayDate(idx.lastCrawlTime) : '—'}
              />
              <ResultRow
                label={t.inspect.robotsTxt}
                value={idx.robotsTxtState}
                highlight={idx.robotsTxtState === 'DISALLOWED'}
              />
              <ResultRow
                label={t.inspect.indexingAllowed}
                value={idx.indexingState}
                highlight={idx.indexingState === 'INDEXING_NOT_ALLOWED'}
              />
              <ResultRow label={t.inspect.canonicalGoogle} value={idx.googleCanonical} />
              <ResultRow label={t.inspect.canonicalUser} value={idx.userCanonical} />
            </div>
          </div>

          {mobile && (
            <div className="inspect-section">
              <h3 className="inspect-section-title">Mobile Usability</h3>
              <div className="inspect-card">
                <ResultRow label="Verdict" value={<StatusBadge state={mobile.verdict} />} />
                {mobile.issues?.map((issue, i) => (
                  <ResultRow key={i} label={`Issue ${i + 1}`} value={issue.issueMessage} highlight />
                ))}
              </div>
            </div>
          )}

          {rich && (
            <div className="inspect-section">
              <h3 className="inspect-section-title">{t.inspect.richResults}</h3>
              <div className="inspect-card">
                <ResultRow label="Verdict" value={<StatusBadge state={rich.verdict} />} />
                {rich.detectedItems?.map((item, i) => (
                  <ResultRow key={i} label={item.richResultType} value={`${item.items?.length || 0} items`} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
