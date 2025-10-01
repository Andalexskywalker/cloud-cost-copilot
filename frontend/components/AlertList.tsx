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

export default function AlertList(){
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    const headers: HeadersInit = {}
    if (process.env.NEXT_PUBLIC_API_TOKEN) {
      headers['authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
    }
    fetch(`${API_BASE}/alerts`, { cache: 'no-store', headers })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then(setAlerts)
      .catch(() => setAlerts([]))
  }, [])

  if (!alerts.length) return <div className="text-sm opacity-70">No alerts.</div>

  return (
    <ul className="space-y-2">
      {alerts.map(a => (
        <li key={a.id} className="panel p-3">
          <div className="text-xs opacity-70">{new Date(a.created_at).toLocaleString()}</div>
          <div className="text-sm font-semibold">{a.rule_id} — {a.severity}</div>
          <div className="text-sm">{a.message}</div>
        </li>
      ))}
    </ul>
  )
}
