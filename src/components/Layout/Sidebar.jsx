const NAV_ITEMS = [
  { key: 'dashboard',      icon: '◈', group: 'main' },
  { key: 'coverage',       icon: '◉', group: 'main' },
  { key: 'sitemap',        icon: '◧', group: 'main' },
  { key: 'inspect',        icon: '◎', group: 'main' },
  { key: 'comparison',     icon: '⇔', group: 'main' },
  { key: 'queryPage',      icon: '↗', group: 'insights' },
  { key: 'promptInsights', icon: '✦', group: 'insights' },
]

export default function Sidebar({ activeView, onNavigate, lang, onLangChange, property, onDisconnect, hasAutoRenewal, t }) {
  const mainItems = NAV_ITEMS.filter((i) => i.group === 'main')
  const insightItems = NAV_ITEMS.filter((i) => i.group === 'insights')

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.svg" alt="Deep in GSC" className="brand-logo" />
        <div>
          <span className="brand-name">{t.appName}</span>
          <span className="brand-tagline">{t.tagline}</span>
        </div>
      </div>

      {property && (
        <div className="sidebar-property">
          <span className="property-label">Property</span>
          <span className="property-url">{property.replace(/^https?:\/\//, '')}</span>
          {hasAutoRenewal && (
            <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, background: 'rgba(45,210,120,0.15)', color: '#2dd478', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
              AUTO-RENEW
            </span>
          )}
        </div>
      )}

      <nav className="sidebar-nav">
        {mainItems.map((item) => (
          <button key={item.key} className={`nav-item${activeView === item.key ? ' active' : ''}`}
            onClick={() => onNavigate(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{t.nav[item.key]}</span>
          </button>
        ))}

        <div className="nav-group-label">Insights</div>

        {insightItems.map((item) => (
          <button key={item.key} className={`nav-item${activeView === item.key ? ' active' : ''}`}
            onClick={() => onNavigate(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{t.nav[item.key]}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="lang-toggle">
          <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => onLangChange('en')}>EN</button>
          <button className={`lang-btn${lang === 'tr' ? ' active' : ''}`} onClick={() => onLangChange('tr')}>TR</button>
        </div>
        <div className="developer-info">
          <a href="https://www.linkedin.com/in/melihandic/" target="_blank" rel="noopener noreferrer" className="dev-link">Melih Andıç</a>
          <a href="https://github.com/melihandic/deep-in-gsc" target="_blank" rel="noopener noreferrer" className="dev-link">GitHub</a>
        </div>
        {property && (
          <button className="disconnect-btn" onClick={onDisconnect}>{t.common.disconnect}</button>
        )}
      </div>
    </aside>
  )
}
