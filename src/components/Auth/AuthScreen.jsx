import { useState, useEffect } from 'react'
import { fetchProperties } from '../../hooks/useGSC.js'
import { Button, Spinner } from '../Layout/UI.jsx'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

function buildOAuthUrl(clientId) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: window.location.origin + window.location.pathname,
    response_type: 'token',
    scope: SCOPE,
    include_granted_scopes: 'true',
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

function parseHashToken() {
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  return params.get('access_token') || null
}

const STEPS_EN = [
  { num: 1, text: 'Go to Google Cloud Console and create a project', link: 'https://console.cloud.google.com' },
  { num: 2, text: 'Enable the Search Console API', link: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com' },
  { num: 3, text: 'Create OAuth 2.0 credentials → Web Application type', link: 'https://console.cloud.google.com/apis/credentials' },
  { num: 4, text: `Add ${window.location.origin} as an Authorized Redirect URI`, link: null },
  { num: 5, text: 'Paste your Client ID below and click "Continue with Google"', link: null },
]

const STEPS_TR = [
  { num: 1, text: "Google Cloud Console'a gidin ve yeni bir proje oluşturun", link: 'https://console.cloud.google.com' },
  { num: 2, text: "Search Console API'yi etkinleştirin", link: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com' },
  { num: 3, text: 'OAuth 2.0 kimlik bilgisi oluşturun → Web Uygulaması türü', link: 'https://console.cloud.google.com/apis/credentials' },
  { num: 4, text: `${window.location.origin} adresini Authorized Redirect URI olarak ekleyin`, link: null },
  { num: 5, text: 'Client ID\'nizi aşağıya yapıştırın ve "Google ile Devam Et" butonuna tıklayın', link: null },
]

export default function AuthScreen({ onConnect, lang, t }) {
  const [clientId, setClientId] = useState(() => localStorage.getItem('gsc-client-id') || '')
  const [manualToken, setManualToken] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [properties, setProperties] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState('')

  const steps = lang === 'tr' ? STEPS_TR : STEPS_EN

  useEffect(() => {
    const token = parseHashToken()
    if (!token) return
    window.history.replaceState(null, '', window.location.pathname)
    handleTokenReceived(token)
  }, [])

  const handleTokenReceived = async (token) => {
    setLoading(true)
    setError('')
    try {
      const props = await fetchProperties(token)
      sessionStorage.setItem('gsc-token', token)
      setProperties({ token, list: props })
    } catch {
      setError(t.auth.error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    if (!clientId.trim()) {
      setError(lang === 'tr' ? 'Lütfen Client ID girin.' : 'Please enter your Client ID.')
      return
    }
    localStorage.setItem('gsc-client-id', clientId.trim())
    window.location.href = buildOAuthUrl(clientId.trim())
  }

  const handleManualConnect = async () => {
    if (!manualToken.trim()) return
    await handleTokenReceived(manualToken.trim())
  }

  const handleContinue = () => {
    if (!selectedProperty || !properties) return
    onConnect(properties.token, selectedProperty, null)
  }

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card" style={{ alignItems: 'center', gap: 20 }}>
          <img src="/logo.svg" alt="Deep in GSC" className="auth-logo-img" />
          <Spinner />
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{t.auth.connecting}</p>
        </div>
      </div>
    )
  }

  if (properties) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/logo.svg" alt="Deep in GSC" className="auth-logo-img" />
          </div>
          <h1 className="auth-title">{t.auth.selectProperty}</h1>
          <div className="form-group">
            {properties.list.length === 0 ? (
              <p className="auth-error">{t.auth.noProperties}</p>
            ) : (
              <select
                className="select property-select"
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
              >
                <option value="">{t.auth.propertyPlaceholder}</option>
                {properties.list.map((p) => (
                  <option key={p.url} value={p.url}>{p.url}</option>
                ))}
              </select>
            )}
          </div>
          <Button onClick={handleContinue} disabled={!selectedProperty}>
            {t.auth.continue}
          </Button>
          <button className="back-btn" onClick={() => setProperties(null)}>← Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.svg" alt="Deep in GSC" className="auth-logo-img" />
        </div>
        <h1 className="auth-title">{t.auth.title}</h1>
        <p className="auth-subtitle">{t.auth.subtitle}</p>

        {error && <p className="auth-error">{error}</p>}

        <div className="form-group">
          <label className="form-label">Client ID</label>
          <input
            className="token-input"
            style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 12, resize: 'none' }}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="xxxxxxxx.apps.googleusercontent.com"
          />
        </div>

        <button className="google-btn" onClick={handleGoogleSignIn} disabled={!clientId.trim()}>
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t.auth.signInGoogle}
        </button>

        <div className="auth-divider">{lang === 'tr' ? 'veya' : 'or'}</div>

        <button className="guide-toggle" onClick={() => setShowManual(!showManual)}>
          <span>{showManual ? '▾' : '▸'}</span>
          {t.auth.manualTitle}
        </button>

        {showManual && (
          <div className="form-group" style={{ marginTop: 8 }}>
            <textarea
              className="token-input"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder={t.auth.tokenPlaceholder}
              rows={3}
              spellCheck={false}
            />
            <Button onClick={handleManualConnect} disabled={!manualToken.trim()} variant="secondary">
              {t.auth.connect}
            </Button>
          </div>
        )}

        <div className="guide-section">
          <button className="guide-toggle" onClick={() => setShowGuide(!showGuide)}>
            <span>{showGuide ? '▾' : '▸'}</span>
            {t.auth.howToTitle}
          </button>
          {showGuide && (
            <ol className="guide-steps">
              {steps.map((step) => (
                <li key={step.num} className="guide-step">
                  <span className="step-num">{step.num}</span>
                  <span className="step-text">
                    {step.text}
                    {step.link && (
                      <a href={step.link} target="_blank" rel="noopener noreferrer" className="step-link">↗</a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="auth-developer">
        <span>Built by </span>
        <a href="https://www.linkedin.com/in/melihandic/" target="_blank" rel="noopener noreferrer">
          Melih Andıç
        </a>
      </div>
    </div>
  )
}
