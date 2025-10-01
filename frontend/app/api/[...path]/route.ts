import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const API_BASE  = process.env.NEXT_PUBLIC_API_BASE  ?? "http://backend:8000"
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? "2025-cloud-cost-copilot-demo-token"

function forwardHeaders(req: NextRequest) {
  const h = new Headers()
  const accept = req.headers.get("accept");        if (accept) h.set("accept", accept)
  const ct     = req.headers.get("content-type");  if (ct)     h.set("content-type", ct)
  if (API_TOKEN) {
    h.set("authorization", `Bearer ${API_TOKEN}`)
    h.set("x-api-token", API_TOKEN)
    h.set("x-api-key", API_TOKEN)
  }
  return h
}

async function proxy(req: NextRequest, path: string[]) {
  try {
    const url = new URL(req.url)
    const target = `${API_BASE}/${path.join("/")}${url.search}`

    const init: RequestInit = {
      method: req.method,
      headers: forwardHeaders(req),
      body: (req.method === "GET" || req.method === "HEAD") ? undefined : await req.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
    }

    const res = await fetch(target, init)
    const ab = await res.arrayBuffer()
    const buf = new Uint8Array(ab)
    const headers = new Headers()
    const ct = res.headers.get("content-type") || "application/json; charset=utf-8"
    headers.set("content-type", ct)
    headers.set("content-length", String(buf.byteLength))
    return new Response(buf, { status: res.status, headers })
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : String(e)
    return new Response(JSON.stringify({ error: "proxy_failed", message: msg }), {
      status: 502,
      headers: { "content-type": "application/json" },
    })
  }
}

export const GET    = (req: NextRequest, { params }: { params: { path: string[] } }) => proxy(req, params.path)
export const POST   = GET as any
export const PUT    = GET as any
export const PATCH  = GET as any
export const DELETE = GET as any
export const HEAD   = GET as any
