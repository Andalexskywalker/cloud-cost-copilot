export type AggregateRow = { day: string; service: string; total: number }

// Sempre via o proxy do Next. O rewrite envia isto para o BACKEND.
const API_ROOT = "/api";

function authHeaders(): HeadersInit {
  const h: HeadersInit = {};
  if (process.env.NEXT_PUBLIC_API_TOKEN) {
    h["authorization"] = `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`;
  }
  return h;
}

export async function fetchAggregate(params: { from?: string; to?: string; service?: string }) {
  const q = new URLSearchParams();
  if (params.from) q.set("from_", params.from);
  if (params.to) q.set("to", params.to);
  if (params.service) q.set("service", params.service);

  const url = `${API_ROOT}/costs/aggregate${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url, { cache: "no-store", headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`);
  }
  return (await res.json()) as AggregateRow[];
}

/** Serviços distintos no intervalo (sem filtrar por serviço) */
export async function fetchServices(params: { from?: string; to?: string }) {
  const q = new URLSearchParams();
  if (params.from) q.set("from_", params.from);
  if (params.to) q.set("to", params.to);

  const url = `${API_ROOT}/costs/aggregate${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url, { cache: "no-store", headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`);
  }
  const rows = (await res.json()) as AggregateRow[];
  return Array.from(new Set(rows.map(r => r.service))).sort();
}
