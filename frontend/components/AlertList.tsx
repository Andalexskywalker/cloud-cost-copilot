'use client'
import { useEffect, useState } from 'react'

type Alert = { id:number; created_at:string|null; rule_id:string; severity:string; message:string }

export default function AlertList(){
  const [alerts, setAlerts] = useState<Alert[]>([])
  useEffect(() => {
    fetch('/api/alerts').then(r => r.json()).then(setAlerts).catch(() => setAlerts([]))
  }, [])
  if (!alerts.length) return <div className="p-4 border rounded">No alerts</div>
  return (
    <div className="p-4 border rounded space-y-2">
      {alerts.map(a => (
        <div key={a.id} className="flex justify-between">
          <div>
            <div className="font-medium">{a.severity.toUpperCase()} — {a.rule_id}</div>
            <div className="text-sm">{a.message}</div>
          </div>
          <div className="text-xs opacity-70">{a.created_at?.replace('T',' ').replace('Z','')}</div>
        </div>
      ))}
    </div>
  )
}
