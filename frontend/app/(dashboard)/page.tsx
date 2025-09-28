'use client'
import { useEffect, useMemo, useState } from 'react'

type Cost = { id:number; service:string; day:string; amount:number }

function useQueryState() {
  const [params, setParams] = useState(
    () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  )
  function set(k: string, v: string | null) {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v); else p.delete(k)
    setParams(p)
    if (typeof window !== 'undefined') {
      const url = `${window.location.pathname}?${p.toString()}`
      window.history.replaceState(null, '', url)
    }
  }
  return { params, set }
}

export default function Dashboard(){
  const { params, set } = useQueryState()
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const serviceParam = params.get('service') ?? ''

  const [rows, setRows] = useState<Cost[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch table whenever filters change
  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams()
    if (from) q.set('from_', from)   // backend expects from_
    if (to) q.set('to', to)
    if (serviceParam) q.set('service', serviceParam)
    fetch('/api/costs' + (q.toString() ? `?${q.toString()}` : ''), { cache: 'no-store' })
      .then(r => r.json())
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [from, to, serviceParam])

  // Services available in the current result set
  const services = useMemo(() => {
    const s = new Set(rows.map(r => r.service))
    return Array.from(s).sort()
  }, [rows])

  // Selected service: use the URL param if present, else first available
  const selectedService = services.includes(serviceParam) ? serviceParam : (services[0] ?? '')

  // If URL had a service not in the data, align it
  useEffect(() => {
    if (selectedService && selectedService !== serviceParam) {
      set('service', selectedService)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService])

  const total = rows.reduce((s, x) => s + (x.amount ?? 0), 0)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Cloud Cost Copilot</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium">From</label>
          <input type="date" value={from}
                 onChange={e => set('from', e.target.value || null)}
                 className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs font-medium">To</label>
          <input type="date" value={to}
                 onChange={e => set('to', e.target.value || null)}
                 className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs font-medium">Service</label>
          <select
            value={selectedService}
            onChange={e => set('service', e.target.value || null)}
            className="border rounded px-2 py-1"
            disabled={!services.length}
          >
            {!services.length && <option>Loading…</option>}
            {services.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {(from || to || serviceParam) && (
          <button onClick={() => { set('from', null); set('to', null); set('service', null) }}
                  className="border rounded px-3 py-1">
            Reset
          </button>
        )}
      </div>

      <p>Total (current view): ${total.toFixed(2)}</p>

      {loading ? (
        <div className="p-4 border rounded">Loading…</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b"><th>Day</th><th>Service</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.id}-${row.day}-${row.service}`} className="border-b">
                <td>{row.day}</td>
                <td>{row.service}</td>
                <td>{(row.amount ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
