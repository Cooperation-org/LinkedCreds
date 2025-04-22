import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5 // 5 minutes
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { txId: string } }
) {
  const { txId } = params

  if (!cache.has(txId)) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: corsHeaders
    })
  }

  const data = cache.get(txId)
  return NextResponse.json(JSON.parse(data), { headers: corsHeaders })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { txId: string } }
) {
  const { txId } = params
  const body = await request.text()

  if (!body || body === '{}') {
    return new NextResponse('Empty body', { status: 400, headers: corsHeaders })
  }

  cache.set(txId, body)

  return NextResponse.json({ status: 'received' }, { headers: corsHeaders })
}
