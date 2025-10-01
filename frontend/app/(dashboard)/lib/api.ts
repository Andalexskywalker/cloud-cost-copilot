// frontend/app/(dashboard)/lib/api.ts
export type AggregateRow = { day: string; service: string; total: number }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

function authHeaders(): HeadersInit {
  const h: HeadersInit = {}
  const tok = process.env.NEXT_PUBLIC_API_TOKEN
  if (tok) {
    h["authorization"] = `Bearer ${tok}`
    h["x-api-token"] = tok
    h["x-api-key"] = tok
  }
  return h
}

/** Série diária (para o gráfico) */
export async function fetchAggregate(params: {
  from?: string
  to?: string
  service?: string
  signal?: AbortSignal
}) {
  const q = new URLSearchParams()
  if (params.from) q.set("from_", params.from)
  if (params.to) q.set("to", params.to)
  if (params.service) q.set("service", params.service)

  const url = `${API_BASE}/costs/aggregate${q.toString() ? `?${q}` : ""}`
  const res = await fetch(url, {
    cache: "no-store",
    headers: authHeaders(),
    mode: "cors",
    signal: params.signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`${res.status} ${text}`)
  }
  return (await res.json()) as AggregateRow[]
}

/** Tabela de custos (linhas) */
export async function fetchCosts(params: {
  from?: string
  to?: string
  service?: string
  signal?: AbortSignal
}) {
  const q = new URLSearchParams()
  if (params.from) q.set("from_", params.from)
  if (params.to) q.set("to", params.to)
  if (params.service) q.set("service", params.service)

  const url = `${API_BASE}/costs${q.toString() ? `?${q}` : ""}`
  const res = await fetch(url, {
    cache: "no-store",
    headers: authHeaders(),
    mode: "cors",
    signal: params.signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`${res.status} ${text}`)
  }
  return await res.json()
}

/** Lista de serviços distintos no intervalo (sem filtrar por serviço) */
export async function fetchServices(params: {
  from?: string
  to?: string
  signal?: AbortSignal
}) {
  const q = new URLSearchParams()
  if (params.from) q.set("from_", params.from)
  if (params.to) q.set("to", params.to)

  const url = `${API_BASE}/costs/aggregate${q.toString() ? `?${q}` : ""}`
  const res = await fetch(url, {
    cache: "no-store",
    headers: authHeaders(),
    mode: "cors",
    signal: params.signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`${res.status} ${text}`)
  }
  const rows = (await res.json()) as AggregateRow[]
  return Array.from(new Set(rows.map((r) => r.service))).sort()
}
