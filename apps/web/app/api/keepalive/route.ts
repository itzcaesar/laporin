import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json({ ok: true, api: data })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
