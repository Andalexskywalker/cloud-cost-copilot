// frontend/app/(dashboard)/lib/api.ts
export type AggregateRow = { day: string; service: string; total: number }

//
// Sempre via o proxy do Next. O rewrite envia isto para o BACKEND.
// (next.config.mjs já aponta API_BASE -> http://backend:8000 dentro do Docker)
//
const API_ROOT = "/api"

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
  // usar 'from'/'to' — o backend tem alias "from"
  if (params.from) q.set("from", params.from)
  if (params.to) q.set("to", params.to)
  if (params.service) q.set("service", params.service)

  const url = `${API_ROOT}/costs/aggregate${q.toString() ? `?${q}` : ""}`
  const res = await fetch(url, {
    cache: "no-store",
    headers: authHeaders(),
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
  if (params.from) q.set("from", params.from)
  if (params.to) q.set("to", params.to)
  if (params.service) q.set("service", params.service)

  // barra final para evitar 307 redirect do FastAPI
  const url = `${API_ROOT}/costs/${q.toString() ? `?${q}` : ""}`
  const res = await fetch(url, {
    cache: "no-store",
    headers: authHeaders(),
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
  if (params.from) q.set("from", params.from)
  if (params.to) q.set("to", params.to)

  // Reusa /aggregate e deduplica serviços
  const url = `${API_ROOT}/costs/aggregate${q.toString() ? `?${q}` : ""}`
  const res = await fetch(url, {
    cache: "no-store",
    headers: authHeaders(),
    signal: params.signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`${res.status} ${text}`)
  }
  const rows = (await res.json()) as AggregateRow[]
  return Array.from(new Set(rows.map((r) => r.service))).sort()
}
