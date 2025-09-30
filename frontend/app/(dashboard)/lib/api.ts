export type AggregateRow = { day: string; service: string; total: number }

function authHeaders(): HeadersInit {
  const h: HeadersInit = {}
  if (process.env.NEXT_PUBLIC_API_TOKEN) {
    h['authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
  }
  return h
}

export async function fetchAggregate(params: { from?: string; to?: string; service?: string }) {
  const q = new URLSearchParams()
  if (params.from) q.set("from_", params.from)
  if (params.to) q.set("to", params.to)
  if (params.service) q.set("service", params.service)
  const res = await fetch("/api/costs/aggregate" + (q.toString() ? `?${q}` : ""), {
    cache: "no-store",
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(String(res.status))
  return (await res.json()) as AggregateRow[]
}

/** Get distinct services for the current date window (no service filter). */
export async function fetchServices(params: { from?: string; to?: string }) {
  const q = new URLSearchParams()
  if (params.from) q.set("from_", params.from)
  if (params.to) q.set("to", params.to)
  const res = await fetch("/api/costs/aggregate" + (q.toString() ? `?${q}` : ""), {
    cache: "no-store",
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(String(res.status))
  const rows = (await res.json()) as AggregateRow[]
  return Array.from(new Set(rows.map(r => r.service))).sort()
}
