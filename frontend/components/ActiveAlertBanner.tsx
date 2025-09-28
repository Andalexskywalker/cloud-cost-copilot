'use client'
import { useEffect, useState } from 'react'

type Alert = { id:number; created_at:string|null; rule_id:string; severity:string; message:string }

export default function ActiveAlertBanner({ service, from, to }:{
  service?: string, from?: string, to?: string
}){
  const [alerts, setAlerts] = useState<Alert[]>([])
  useEffect(() => {
    fetch('/api/alerts', { cache: 'no-store' })
      .then(r => r.json())
      .then((rows: Alert[]) => {
        // naive match: show the most recent alert mentioning the selected service
        const match = rows.find(a => service ? a.message.startsWith(`${service}:`) : true)
        setAlerts(match ? [match] : [])
      })
      .catch(() => setAlerts([]))
  }, [service, from, to])
  if (!alerts.length) return null
  const a = alerts[0]
  const color = a.severity === 'critical' ? 'bg-red-100 border-red-300'
              : a.severity === 'warning' ? 'bg-yellow-100 border-yellow-300'
              : 'bg-blue-100 border-blue-300'
  return (
    <div className={`border ${color} p-3 rounded`}>
      <div className="font-semibold">{a.severity.toUpperCase()} — {a.rule_id}</div>
      <div>{a.message}</div>
      <div className="text-xs opacity-70">{a.created_at?.replace('T',' ').replace('Z','')}</div>
    </div>
  )
}
