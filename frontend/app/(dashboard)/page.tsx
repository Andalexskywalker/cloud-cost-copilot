'use client'
import { useEffect, useMemo, useState } from 'react'

// imports relativos (sem alias @)
import Chart from '../../components/Chart'
import ActiveAlertBanner from '../../components/ActiveAlertBanner'
import StatCard from '../../components/StatCard'
import LoadingBlock from '../../components/LoadingBlock'
import EmptyState from '../../components/EmptyState'
import { fetchAggregate, fetchServices, type AggregateRow } from './lib/api'

type Cost = { id:number; service:string; day:string; amount:number }

// usar API_BASE diretamente (sem rewrites)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://backend:8000'

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
  const [services, setServices] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // 1) Carregar serviços disponíveis apenas pelo intervalo (sem filtrar por serviço)
  useEffect(() => {
    fetchServices({ from, to })
      .then((list) => {
        setServices(list)
        const current = serviceParam
        if (list.length && (!current || !list.includes(current))) {
          set('service', list[0])
        } else if (!list.length && current) {
          set('service', null)
        }
      })
      .catch(() => setServices([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]) // não depender de serviceParam aqui!

  // 2) Tabela + aggregate sempre que filtros mudam (inclui serviço)
  useEffect(() => {
    setLoading(true)
    setError(null)

    const q = new URLSearchParams()
    if (from) q.set('from_', from)   // backend espera from_
    if (to) q.set('to', to)
    if (serviceParam) q.set('service', serviceParam)

    const headers: HeadersInit = {}
    if (process.env.NEXT_PUBLIC_API_TOKEN) {
      headers['authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
    }

    // TABELA — chamada direta ao backend (NOTA: /costs/ com barra final!)
    fetch(`${API_BASE}/costs/${q.toString() ? `?${q.toString()}` : ''}`, { cache: 'no-store', headers })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then(setRows)
      .catch(e => { setRows([]); setError(`Failed to load table (${e.message})`) })

    // AGGREGATE para o gráfico (usa helpers que já chamam o backend direto)
    fetchAggregate({ from, to, service: serviceParam })
      .then(setAgg)
      .catch(e => { setAgg([]); setError(prev => prev ?? `Failed to load chart (${e.message})`) })
      .finally(() => setLoading(false))
  }, [from, to, serviceParam])

  // 3) Série do gráfico
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
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Cloud Cost Copilot</h1>
        <p className="text-sm opacity-70">Anomalias de custo em tempo quase-real, com alertas e sugestões.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna esquerda: filtros + métricas */}
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="sticky top-4 space-y-4">
            <div className="p-4 panel">
              <h2 className="text-sm font-semibold mb-3">Filters</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium">From</label>
                  <input
                    type="date"
                    value={from}
                    onChange={e => set('from', e.target.value || null)}
                    className="w-full input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">To</label>
                  <input
                    type="date"
                    value={to}
                    onChange={e => set('to', e.target.value || null)}
                    className="w-full input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Service</label>
                  <select
                    value={serviceParam || (services[0] ?? '')}
                    onChange={e => set('service', e.target.value || null)}
                    className="w-full input"
                    disabled={!services.length}
                  >
                    {!services.length && <option>Loading…</option>}
                    {services.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {(from || to || serviceParam) && (
                  <button
                    onClick={() => { set('from', null); set('to', null); set('service', null) }}
                    className="w-full input"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total" value={`$${total.toFixed(2)}`} />
              <StatCard label="Service" value={serviceParam || '—'} />
              <StatCard label="From" value={from || '—'} />
              <StatCard label="To" value={to || '—'} />
            </div>
          </div>
        </aside>

        {/* Coluna direita: alertas + gráfico + tabela */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-4">
          <ActiveAlertBanner
            service={serviceParam || undefined}
            from={from || undefined}
            to={to || undefined}
          />

          <section className="p-4 panel">
            <h2 className="text-sm font-semibold mb-2">Cost over time</h2>
            {loading
              ? <LoadingBlock height={260}/>
              : (series[0].points.length
                  ? <Chart series={series} h={260}/>
                  : <EmptyState title="No data" subtitle="Try a different date range or service." />
                )
            }
          </section>

          <section className="p-4 panel">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Details</h2>
              <span className="text-xs opacity-70">{rows.length} rows</span>
            </div>
            {loading ? (
              <LoadingBlock height={160}/>
            ) : rows.length ? (
              <div className="overflow-auto">
                <table className="table min-w-full text-sm">
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
              </div>
            ) : (
              <EmptyState title="No rows" subtitle="No costs for this selection." />
            )}
          </section>

          {error && (
            <div className="p-3 border border-red-300 bg-red-50 text-sm rounded">
              {error}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
