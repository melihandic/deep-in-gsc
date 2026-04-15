export function Card({ children, className = '' }) {
  return (
    <div className={`card ${className}`}>{children}</div>
  )
}

export function MetricCard({ label, value, sub, trend }) {
  const trendPositive = trend > 0
  const trendNeutral = trend === 0 || trend === undefined
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {sub && <span className="metric-sub">{sub}</span>}
      {!trendNeutral && (
        <span className={`metric-trend ${trendPositive ? 'up' : 'down'}`}>
          {trendPositive ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
        </span>
      )}
    </div>
  )
}

export function Badge({ children, variant = 'default' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export function Button({ children, onClick, variant = 'primary', disabled, small }) {
  return (
    <button
      className={`btn btn-${variant}${small ? ' btn-small' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function Spinner() {
  return <div className="spinner" />
}

export function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">◎</span>
      <p>{message}</p>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      className="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  )
}

export function Table({ columns, rows, onRowClick }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ textAlign: col.align || 'left' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'clickable-row' : ''}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DateRangePicker({ startDate, endDate, onStartChange, onEndChange, label }) {
  return (
    <div className="date-range">
      <span className="date-range-label">{label}</span>
      <input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)} className="date-input" />
      <span className="date-sep">→</span>
      <input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)} className="date-input" />
    </div>
  )
}

export function Pagination({ current, total, totalItems, onPage, t }) {
  if (total <= 1) return null
  const PAGE_SIZE = 50
  const from = (current - 1) * PAGE_SIZE + 1
  const to = Math.min(current * PAGE_SIZE, totalItems)
  return (
    <div className="pagination">
      <span className="pagination-info">
        {t.common.showing} {from}–{to} / {totalItems} {t.common.results}
      </span>
      <div className="pagination-controls">
        <button className="page-btn" onClick={() => onPage(current - 1)} disabled={current === 1}>
          {t.common.prev}
        </button>
        <span className="page-indicator">{t.common.page} {current} {t.common.of} {total}</span>
        <button className="page-btn" onClick={() => onPage(current + 1)} disabled={current === total}>
          {t.common.next}
        </button>
      </div>
    </div>
  )
}
