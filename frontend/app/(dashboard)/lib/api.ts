export type AggregateRow = { day: string; service: string; total: number }

export async function fetchAggregate(params: { from?: string; to?: string; service?: string }) {
  const q = new URLSearchParams()
  if (params.from) q.set("from_", params.from)
  if (params.to) q.set("to", params.to)
  if (params.service) q.set("service", params.service)
  const headers: HeadersInit = {}
  if (process.env.NEXT_PUBLIC_API_TOKEN)
    headers["authorization"] = `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
    const res = await fetch("/api/costs/aggregate" + (q.toString() ? `?${q}` : ""), { cache: "no-store", headers })
  if (!res.ok) throw new Error("aggregate fetch failed")
  return (await res.json()) as AggregateRow[]
}

/** Get distinct services for the current date window (no service filter). */
export async function fetchServices(params: { from?: string; to?: string }) {
  const q = new URLSearchParams()
  if (params.from) q.set("from_", params.from)
  if (params.to) q.set("to", params.to)
  // NOTE: no `service` here on purpose
  const res = await fetch("/api/costs/aggregate" + (q.toString() ? `?${q}` : ""), { cache: "no-store" })
  if (!res.ok) throw new Error("services fetch failed")
  const rows = (await res.json()) as AggregateRow[]
  return Array.from(new Set(rows.map(r => r.service))).sort()
}
