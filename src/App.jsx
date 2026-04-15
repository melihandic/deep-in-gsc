import { useState, useEffect, useRef } from 'react'
import { useTranslation } from './i18n/translations.js'
import { refreshAccessToken } from './hooks/useGSC.js'
import Sidebar from './components/Layout/Sidebar.jsx'
import AuthScreen from './components/Auth/AuthScreen.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import Coverage from './components/Coverage/Coverage.jsx'
import Sitemap from './components/Sitemap/Sitemap.jsx'
import URLInspect from './components/URLInspect/URLInspect.jsx'
import Comparison from './components/Comparison/Comparison.jsx'
import QueryPage from './components/QueryPage/QueryPage.jsx'
import PromptInsights from './components/PromptInsights/PromptInsights.jsx'

export default function App() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('gsc-lang')
    if (saved) return saved
    return navigator.language?.startsWith('tr') ? 'tr' : 'en'
  })
  const [token, setToken] = useState(() => sessionStorage.getItem('gsc-token') || '')
  const [property, setProperty] = useState(() => sessionStorage.getItem('gsc-property') || '')
  const [refreshCreds, setRefreshCreds] = useState(() => {
    const s = sessionStorage.getItem('gsc-refresh-creds')
    return s ? JSON.parse(s) : null
  })
  const [view, setView] = useState('dashboard')
  const [inspectUrl, setInspectUrl] = useState('')
  const refreshTimer = useRef(null)

  const t = useTranslation(lang)

  const scheduleRefresh = (creds) => {
    if (refreshTimer.current) clearInterval(refreshTimer.current)
    if (!creds) return
    refreshTimer.current = setInterval(async () => {
      try {
        const newToken = await refreshAccessToken(creds.clientId, creds.clientSecret, creds.refreshToken)
        setToken(newToken)
        sessionStorage.setItem('gsc-token', newToken)
      } catch (e) { console.warn('Token refresh failed:', e) }
    }, 55 * 60 * 1000)
  }

  useEffect(() => {
    if (refreshCreds) scheduleRefresh(refreshCreds)
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current) }
  }, [])

  const handleLangChange = (l) => { setLang(l); localStorage.setItem('gsc-lang', l) }

  const handleConnect = (tok, prop, creds) => {
    setToken(tok)
    setProperty(prop)
    sessionStorage.setItem('gsc-token', tok)
    sessionStorage.setItem('gsc-property', prop)
    if (creds) {
      setRefreshCreds(creds)
      sessionStorage.setItem('gsc-refresh-creds', JSON.stringify(creds))
      scheduleRefresh(creds)
    }
    setView('dashboard')
  }

  const handleDisconnect = () => {
    setToken(''); setProperty(''); setRefreshCreds(null)
    if (refreshTimer.current) clearInterval(refreshTimer.current)
    sessionStorage.clear()
    setView('dashboard')
  }

  const handleInspectUrl = (url) => { setInspectUrl(url); setView('inspect') }

  if (!token || !property) {
    return (
      <div className="app-auth">
        <div className="lang-float">
          <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => handleLangChange('en')}>EN</button>
          <button className={`lang-btn${lang === 'tr' ? ' active' : ''}`} onClick={() => handleLangChange('tr')}>TR</button>
        </div>
        <AuthScreen onConnect={handleConnect} lang={lang} t={t} />
      </div>
    )
  }

  const vp = { token, siteUrl: property, t, lang }

  return (
    <div className="app-layout">
      <Sidebar activeView={view} onNavigate={setView} lang={lang} onLangChange={handleLangChange}
        property={property} onDisconnect={handleDisconnect} hasAutoRenewal={!!refreshCreds} t={t} />
      <main className="main-content">
        {view === 'dashboard'      && <Dashboard {...vp} />}
        {view === 'coverage'       && <Coverage {...vp} onInspectUrl={handleInspectUrl} />}
        {view === 'sitemap'        && <Sitemap {...vp} />}
        {view === 'inspect'        && <URLInspect {...vp} initialUrl={inspectUrl} />}
        {view === 'comparison'     && <Comparison {...vp} />}
        {view === 'queryPage'      && <QueryPage {...vp} />}
        {view === 'promptInsights' && <PromptInsights {...vp} />}
      </main>
    </div>
  )
}
