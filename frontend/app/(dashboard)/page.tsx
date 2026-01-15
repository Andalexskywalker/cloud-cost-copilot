// frontend/app/(dashboard)/page.tsx
'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// componentes (caminhos relativos)
import Chart from '../../components/Chart'
import ActiveAlertBanner from '../../components/ActiveAlertBanner'
import StatCard from '../../components/StatCard'
import LoadingBlock from '../../components/LoadingBlock'
import EmptyState from '../../components/EmptyState'

// API helpers
import { fetchAggregate, fetchCosts, fetchServices, type AggregateRow } from './lib/api'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const dynamicParams = true

type Cost = { id: number; service: string; day: string; amount: number }

/** Shell com Suspense p/ permitir useSearchParams dentro do conteúdo */
export default function Page() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <h1 className="text-2xl font-bold">Cloud Cost Copilot</h1>
        <div className="mt-6 p-4 panel">Loading…</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

function useQuery() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const get = (k: string) => searchParams?.get(k) ?? ''
  function set(k: string, v: string | null) {
    const p = new URLSearchParams(searchParams?.toString() || '')
    if (v) p.set(k, v); else p.delete(k)
    const qs = p.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }
  return { get, set }
}

function DashboardContent() {
  const query = useQuery()

  const from = query.get('from')
  const to = query.get('to')
  const serviceParam = query.get('service')

  const [rows, setRows] = useState<Cost[]>([])
  const [loading, setLoading] = useState(true)
  const [agg, setAgg] = useState<AggregateRow[]>([])
  const [services, setServices] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // -------- services loading state + race guard ----------
  const [svcLoading, setSvcLoading] = useState(false)
  const [svcError, setSvcError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const ac = new AbortController()
      ; (async () => {
        setSvcLoading(true)
        setSvcError(null)
        try {
          const list = await fetchServices({ from, to, signal: ac.signal })
          if (!alive) return
          setServices(list)

          // apenas corrige o parâmetro quando tens lista válida
          const current = serviceParam
          if (list.length && (!current || !list.includes(current))) {
            query.set('service', list[0])
          }
        } catch (e: any) {
          if (!alive) return
          setServices([])
          setSvcError(e?.message || 'Failed to load services')
        } finally {
          if (alive) setSvcLoading(false)
        }
      })()
    return () => { alive = false; ac.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]) // não depender de serviceParam

  // -------- table + aggregate when filters change --------
  useEffect(() => {
    let alive = true
    const ac1 = new AbortController()
    const ac2 = new AbortController()
    setLoading(true)
    setError(null)

    const tableP = fetchCosts({ from, to, service: serviceParam, signal: ac1.signal })
      .then((data) => { if (alive) setRows(data) })
      .catch((e: any) => { if (alive) { setRows([]); setError(prev => prev ?? `Failed to load table (${e.message})`) } })

    const aggP = fetchAggregate({ from, to, service: serviceParam, signal: ac2.signal })
      .then((data) => { if (alive) setAgg(data) })
      .catch((e: any) => { if (alive) { setAgg([]); setError(prev => prev ?? `Failed to load chart (${e.message})`) } })

    Promise.allSettled([tableP, aggP]).finally(() => { if (alive) setLoading(false) })

    return () => { alive = false; ac1.abort(); ac2.abort() }
  }, [from, to, serviceParam])

  // -------- chart series --------
  const series = useMemo(() => {
    const filtered = agg
      .filter(r => !serviceParam || r.service === serviceParam)
      .sort((a, b) => a.day.localeCompare(b.day))
    const points = filtered.map((r, idx) => ({ x: idx, y: r.total }))
    const name = serviceParam || (filtered[0]?.service ?? 'All')
    return [{ name, points }]
  }, [agg, serviceParam])

  const total = useMemo(() => rows.reduce((s, x) => s + (x.amount ?? 0), 0), [rows])

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Cloud Cost Copilot</h1>
        <p className="text-sm opacity-70">Real-time cloud cost anomalies with alerts and suggestions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* coluna esquerda: filtros + métricas */}
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
                    onChange={e => query.set('from', e.target.value || null)}
                    className="w-full input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">To</label>
                  <input
                    type="date"
                    value={to}
                    onChange={e => query.set('to', e.target.value || null)}
                    className="w-full input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Service</label>
                  <select
                    value={serviceParam || (services[0] ?? '')}
                    onChange={e => query.set('service', e.target.value || null)}
                    className="w-full input"
                    disabled={svcLoading}
                  >
                    {svcLoading && <option value="">{'Loading…'}</option>}
                    {!svcLoading && services.length === 0 && (
                      <option value="">{'No services for this range'}</option>
                    )}
                    {!svcLoading && services.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {svcError && <p className="text-xs text-red-300 mt-1">{svcError}</p>}
                </div>

                {(from || to || serviceParam) && (
                  <button
                    onClick={() => { query.set('from', null); query.set('to', null); query.set('service', null) }}
                    className="w-full input"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* métricas rápidas */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total" value={`$${total.toFixed(2)}`} />
              <StatCard label="Service" value={serviceParam || '—'} />
              <StatCard label="From" value={from || '—'} />
              <StatCard label="To" value={to || '—'} />
            </div>
          </div>
        </aside>

        {/* coluna direita: alertas + gráfico + tabela */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-4">
          <ActiveAlertBanner
            service={serviceParam || undefined}
            from={from || undefined}
            to={to || undefined}
          />

          <section className="p-4 panel">
            <h2 className="text-sm font-semibold mb-2">Cost over time</h2>
            {loading
              ? <LoadingBlock height={260} />
              : (series[0].points.length
                ? <Chart series={series} h={260} />
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
              <LoadingBlock height={160} />
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
            <div className="p-3 border border-red-500/40 bg-red-900/30 text-red-200 text-sm rounded">
              {error}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
