import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')
    const res = await fetch(`${apiBaseUrl}/health`, {
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json({ ok: true, api: data })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
