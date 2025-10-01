'use client'
import { useEffect, useState } from 'react'

type Alert = {
  id: number
  created_at: string
  rule_id: string
  severity: 'info' | 'warning' | 'critical'
  message: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export default function ActiveAlertBanner(
  { service, from, to }: { service?: string; from?: string; to?: string }
){
  const [alerts, setAlerts] = useState<Alert[] | null>(null)

  useEffect(() => {
    const q = new URLSearchParams()
    if (from) q.set('from_', from)
    if (to) q.set('to', to)
    if (service) q.set('service', service)

    const headers: HeadersInit = {}
    if (process.env.NEXT_PUBLIC_API_TOKEN) {
      headers['authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
    }

    fetch(`${API_BASE}/alerts${q.toString() ? `?${q}` : ''}`, { cache: 'no-store', headers })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((rows: Alert[]) => setAlerts(rows))
      .catch(() => setAlerts([]))
  }, [service, from, to])

  if (alerts === null) {
    // loading state: small shimmer bar
    return <div className="panel p-3 animate-pulse text-sm">Loading alerts…</div>
  }
  if (!alerts.length) return null

  // Only show the most recent alert (can expand later)
  const a = alerts[0]
  const color =
    a.severity === 'critical' ? 'bg-red-500/20 border-red-400/40 text-red-200' :
    a.severity === 'warning'  ? 'bg-amber-500/20 border-amber-400/40 text-amber-200' :
                                'bg-blue-500/20 border-blue-400/40 text-blue-200'

  return (
    <div className={`p-3 rounded-xl border ${color}`}>
      <div className="text-sm font-semibold">Alert — {a.severity.toUpperCase()}</div>
      <div className="text-sm">{a.message}</div>
      <div className="text-xs opacity-70 mt-1">{new Date(a.created_at).toLocaleString()}</div>
    </div>
  )
}
