export type AggregateRow = { day: string; service: string; total: number }

export async function fetchAggregate(params: { from?: string; to?: string; service?: string }) {
  const q = new URLSearchParams()
  if (params.from) q.set("from_", params.from)
  if (params.to) q.set("to", params.to)
  if (params.service) q.set("service", params.service)
  const u = "/api/costs/aggregate" + (q.toString() ? `?${q.toString()}` : "")
  const res = await fetch(u, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch aggregate")
  return (await res.json()) as AggregateRow[]
}
