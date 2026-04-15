const QUESTION_PATTERNS = [
  // Turkish
  'ne ', 'nasıl', 'neden', 'nerede', 'niçin', 'niye', 'kim ', 'kimin', 'hangi',
  'kaç ', 'ne zaman', 'öğren', 'öğrenmek', 'bul ', 'bulmak', 'ara ', 'aramak',
  'karşılaştır', 'fark ', 'farkı', 'farkı nedir',
  // Turkish superlatives / intent
  'en çok', 'en iyi', 'en ucuz', 'en güvenli', 'en ekonomik', 'en güvenilir',
  'en hızlı', 'en yakın', 'en kolay', 'en popüler', 'en iyi fiyat',
  'ücretsiz', 'indir', 'indirim', 'fiyat', 'fiyatı', 'kampanya',
  'vs ', ' vs ', 'mi ', 'mı ', 'mu ', 'mü ',
  // English question words
  'what ', 'how ', 'why ', 'where ', 'who ', 'which ', 'when ', 'whose ',
  'what is', 'what are', 'how to', 'how do', 'how does', 'how much', 'how many',
  // English intent
  'best ', 'cheapest', 'safest', 'most ', 'top ', 'vs ', 'versus',
  'compare', 'difference', 'differences', 'between',
  'free ', 'download', 'learn ', 'find ', 'search ', 'near me',
  'guide', 'tutorial', 'review', 'cheap ', 'affordable', 'reliable',
  'price', 'cost ', 'worth ', 'should i', 'can i', 'is it',
]

export function classifyQuery(query) {
  const q = query.toLowerCase()

  const isQuestion = QUESTION_PATTERNS.some((p) => q.includes(p))
  const isLongTail = query.trim().split(/\s+/).length >= 4

  if (isQuestion && isLongTail) return { isQuestion: true, isLongTail: true }
  if (isQuestion) return { isQuestion: true, isLongTail: false }
  if (isLongTail) return { isQuestion: false, isLongTail: true }
  return null
}

export function filterPromptQueries(rows) {
  return rows
    .map((r) => {
      const classification = classifyQuery(r.query)
      if (!classification) return null
      return { ...r, ...classification }
    })
    .filter(Boolean)
}
