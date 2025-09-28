'use client'
import { useEffect, useState } from 'react'

type Cost = { id:number; service:string; day:string; amount:number }

export default function Dashboard(){
  const [data, setData] = useState<Cost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/costs')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if(loading) return <div className="p-8">Loading…</div>

  const total = data.reduce((s: number, x: Cost) => s + (x.amount || 0), 0)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Cloud Cost Copilot</h1>
      <p>Total (demo): ${total.toFixed(2)}</p>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b"><th>Day</th><th>Service</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {data.slice(-50).map((row: Cost) => (
            <tr key={row.id} className="border-b">
              <td>{row.day}</td>
              <td>{row.service}</td>
              <td>{(row.amount ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
