# Deep in GSC

**The Google Search Console analytics dashboard you always wanted — but Google never built.**

Deep in GSC gives SEO professionals, developers, and site owners a fast, focused analytics experience on top of Google Search Console data. No bloat, no data sampling, no 90-day limits imposed by the standard UI. Just your data, your way.

> Built by [Melih Andıç](https://www.linkedin.com/in/melihandic/) · melih@pluginfactory.online

---

## Why Deep in GSC?

The native GSC interface is limited: no pagination on large datasets, no period comparison, no query-to-page mapping, and no way to filter by position range. Deep in GSC solves all of this in a clean, bilingual (EN/TR) interface that runs entirely in your browser — your data never leaves your machine.

---

## Features

### Core Analytics
| Feature | Description |
|---|---|
| **Search Performance** | Clicks, impressions, CTR, avg. position with time-series chart |
| **Coverage Report** | Index status breakdown with donut chart — drill down to URL Inspect |
| **Sitemap Health** | Submitted vs. indexed counts, error detection per sitemap |
| **URL Inspection** | Per-URL coverage state, mobile usability, rich results detail |

### Power Features
| Feature | Description |
|---|---|
| **Period Comparison** | Compare any two custom date ranges — winners/losers table, bar chart, CSV export |
| **Query → Page Map** | See which queries trigger which pages in a single matched table |
| **Prompt Insights** | Identifies long-tail queries and questions that users may also ask AI assistants |
| **Position Filters** | Filter pages/queries by Position 1, Top 3, Page 1, Page 2, Page 3+ |
| **Low CTR Alerts** | Inline badge on rows where impressions are high but CTR is low |
| **Custom Date Picker** | Any date range beyond the preset Last 7/28/90 days |
| **Pagination** | 50 rows per page — handles 10,000+ URL datasets without freezing |
| **CSV Export** | UTF-8 BOM encoding on every report (Excel-compatible) |

### UX & Auth
| Feature | Description |
|---|---|
| **Google OAuth Sign-in** | One-click sign in — no manual token copying |
| **Auto Token Renewal** | Optional refresh token support — stay signed in indefinitely |
| **Bilingual UI** | Full English and Turkish interface, auto-detected from browser |
| **Dark Mode** | Automatic, follows system preference |

---

## Quick Start

```bash
git clone https://github.com/melihandic/deep-in-gsc
cd deep-in-gsc
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Google OAuth Setup (One-time)

1. Go to [Google Cloud Console](https://console.cloud.google.com) → create a project
2. Enable the **Search Console API**
3. Go to **APIs & Services → Credentials** → Create **OAuth 2.0 Client ID** (Web Application)
4. Add `http://localhost:5173` to **Authorized Redirect URIs**
5. Copy your **Client ID**
6. Paste it into the app login screen → click **Continue with Google**

> For production deployments, also add your production URL (e.g. `https://deep-in-gsc.vercel.app`) to the redirect URIs.

---

## Deploy to Vercel

```bash
npm run build
npx vercel --prod
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) for automatic deploys on every push.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Charts | Recharts |
| Styling | Pure CSS — no UI library |
| API | Google Search Console API v3 |
| Auth | Google OAuth 2.0 (implicit flow) |

---

## Project Structure

```
src/
├── components/
│   ├── Auth/             # Google OAuth + manual token fallback
│   ├── Dashboard/        # Search performance, filters, pagination
│   ├── Coverage/         # Index status + donut chart
│   ├── Sitemap/          # Sitemap health
│   ├── URLInspect/       # Per-URL inspection
│   ├── Comparison/       # Period A vs B comparison
│   ├── QueryPage/        # Query → Page mapping
│   ├── PromptInsights/   # Long-tail & question query analysis
│   └── Layout/           # Sidebar, shared UI components, pagination
├── hooks/
│   └── useGSC.js         # All Google API calls + token refresh
├── utils/
│   ├── csvExport.js      # UTF-8 BOM CSV download
│   ├── dateUtils.js      # Date formatting helpers
│   ├── pagination.js     # 50-row pagination logic
│   └── queryPatterns.js  # TR/EN pattern matching for Prompt Insights
├── i18n/
│   └── translations.js   # Full EN + TR string map
├── App.jsx
├── main.jsx
└── index.css
```

---

## Prompt Insights — How It Works

The Prompt Insights module scans your GSC queries for patterns that resemble questions or long-tail searches users might also type into AI assistants (ChatGPT, Gemini, Perplexity, etc.).

**Detected patterns include:**
- Question words: `what, how, why, where, who, which` / `ne, nasıl, neden, nerede, niçin, kim`
- Intent signals: `best, cheapest, safest, compare, vs, guide, learn, find` / `en iyi, en ucuz, en güvenli, karşılaştır, bul, öğren`
- Long-tail: any query with 4 or more words

This is **pure pattern matching** — no AI API required. The analysis runs instantly on your existing GSC data.

---

## Roadmap

- [ ] Google OAuth PKCE flow (removes Client ID requirement)
- [ ] Core Web Vitals module
- [ ] Keyword cannibalization detection
- [ ] Click-through rate benchmarking by position

---

## License

MIT © [Melih Andıç](https://www.linkedin.com/in/melihandic/)

---

## GitHub Repository Description

> Open-source Google Search Console dashboard with period comparison, query-to-page mapping, position filters, pagination, and AI prompt pattern detection. Bilingual EN/TR. Built with React + Vite.

**Topics:** `seo` `google-search-console` `analytics` `react` `vite` `dashboard` `seo-tools` `search-analytics` `open-source`
