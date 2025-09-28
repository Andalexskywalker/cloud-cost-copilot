'use client'
import { useEffect, useMemo, useState } from 'react'

// use relative paths given your structure:
// app/(dashboard)/page.tsx  ->  ../../components/Chart
import Chart from '../../components/Chart'
import { fetchAggregate, fetchServices, type AggregateRow } from './lib/api'
import ActiveAlertBanner from '../../components/ActiveAlertBanner'



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
  const [agg, setAgg] = useState<AggregateRow[]>([])
  const [services, setServices] = useState<string[]>([])   // <-- stable options list

  // 1) Load services for the date window ONLY (no service filter)
  useEffect(() => {
    fetchServices({ from, to })
      .then((list: string[]) => {
      setServices(list)
      // ensure URL has a valid service selection
      if (list.length) {
        const current: string = serviceParam
        if (!current || !list.includes(current)) {
        set('service', list[0])
        }
      } else {
        // if nothing available, clear any existing service param
        if (serviceParam) set('service', null)
      }
      })
      .catch(() => setServices([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]) // IMPORTANT: don't depend on serviceParam here

  // 2) Load table + aggregate whenever filters (incl. service) change
  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams()
    if (from) q.set('from_', from)  // backend expects from_
    if (to) q.set('to', to)
    if (serviceParam) q.set('service', serviceParam)

    // table
    fetch('/api/costs' + (q.toString() ? `?${q.toString()}` : ''), { cache: 'no-store' })
      .then(r => r.json()).then(setRows).catch(() => setRows([]))

    // chart aggregate
    fetchAggregate({ from, to, service: serviceParam })
      .then(setAgg)
      .catch(() => setAgg([]))
      .finally(() => setLoading(false))
  }, [from, to, serviceParam])

  // 3) Chart series (for the selected service)
  const series = useMemo(() => {
    const filtered = agg
      .filter(r => !serviceParam || r.service === serviceParam)
      .sort((a, b) => a.day.localeCompare(b.day))
    const points = filtered.map((r, idx) => ({ x: idx, y: r.total }))
    const name = serviceParam || (filtered[0]?.service ?? 'All')
    return [{ name, points }]
  }, [agg, serviceParam])

  const total = rows.reduce((s, x) => s + (x.amount ?? 0), 0)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Cloud Cost Copilot</h1>
      <ActiveAlertBanner service={serviceParam || undefined} from={from || undefined} to={to || undefined} />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium">From</label>
          <input
            type="date"
            value={from}
            onChange={e => set('from', e.target.value || null)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium">To</label>
          <input
            type="date"
            value={to}
            onChange={e => set('to', e.target.value || null)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Service</label>
          <select
            value={serviceParam || (services[0] ?? '')}
            onChange={e => set('service', e.target.value || null)}
            className="border rounded px-2 py-1"
            disabled={!services.length}
          >
            {!services.length && <option>Loading…</option>}
            {services.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {(from || to || serviceParam) && (
          <button
            onClick={() => { set('from', null); set('to', null); set('service', null) }}
            className="border rounded px-3 py-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* Chart */}
      <h2 className="text-lg font-semibold mb-2">Daily total</h2>
      <Chart series={series} />
        
      {/* Table */}
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
