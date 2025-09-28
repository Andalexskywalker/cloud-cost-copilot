// frontend/app/api/[...path]/route.ts
import { NextRequest } from "next/server"

const BACKEND_BASE = process.env.BACKEND_BASE || "http://backend:8000"

async function proxy(req: NextRequest, params: { path: string[] }, method: string) {
  const url = new URL(req.url)
  const target = `${BACKEND_BASE}/${params.path.join("/")}${url.search}`
  const init: RequestInit = { method, headers: req.headers as any }
  if (method !== "GET" && method !== "HEAD") init.body = req.body as any
  const res = await fetch(target, init)
  return new Response(await res.text(), { status: res.status, headers: res.headers })
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] }}) {
  return proxy(req, params, "GET")
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] }}) {
  return proxy(req, params, "POST")
}
export const PUT = POST
export const PATCH = POST
export const DELETE = POST
