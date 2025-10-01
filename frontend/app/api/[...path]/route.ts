import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const API_BASE  = process.env.NEXT_PUBLIC_API_BASE  ?? "http://backend:8000"
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? ""

function forwardHeaders(req: NextRequest) {
  const h = new Headers()
  const accept = req.headers.get("accept"); if (accept) h.set("accept", accept)
  const ct     = req.headers.get("content-type"); if (ct) h.set("content-type", ct)
  if (API_TOKEN) h.set("authorization", `Bearer ${API_TOKEN}`)
  return h
}

async function proxy(req: NextRequest, path: string[]) {
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
  const buf = new Uint8Array(await res.arrayBuffer())
  const headers = new Headers(res.headers)
  headers.delete("set-cookie")
  headers.delete("transfer-encoding")
  headers.delete("content-encoding")
  headers.set("content-length", String(buf.byteLength))
  return new Response(buf, { status: res.status, headers })
}

export const GET    = (req: NextRequest, { params }: { params: { path: string[] } }) => proxy(req, params.path)
export const POST   = GET as any
export const PUT    = GET as any
export const PATCH  = GET as any
export const DELETE = GET as any
export const HEAD   = GET as any
