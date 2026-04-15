export function formatDate(date) {
  return date.toISOString().split('T')[0]
}

export function getDateRange(preset) {
  const end = new Date()
  end.setDate(end.getDate() - 3)
  const start = new Date(end)
  const days = { last7: 7, last28: 28, last90: 90 }[preset] || 28
  start.setDate(start.getDate() - days)
  return { start: formatDate(start), end: formatDate(end) }
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
