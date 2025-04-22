import { NextRequest, NextResponse } from 'next/server'

// In-memory store for VCs
const exchanges = new Map<string, any>()

// Expiry config
const EXPIRY_MINUTES = 5

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }))
}

// GET: Check if a resume VC was received for this txId
export async function GET(
  request: NextRequest,
  { params }: { params: { txId: string } }
) {
  const { txId } = params

  const session = exchanges.get(txId)

  if (!session) {
    return withCors(NextResponse.json({ error: 'Not found' }, { status: 404 }))
  }

  if (Date.now() > session.expires) {
    exchanges.delete(txId)
    return withCors(NextResponse.json({ error: 'Session expired' }, { status: 410 }))
  }

  return withCors(NextResponse.json(session.data))
}

// POST: Either request resume VC (by posting empty object) or submit VC from wallet
export async function POST(
  request: NextRequest,
  { params }: { params: { txId: string } }
) {
  const { txId } = params
  const body = await request.json()

  // If wallet is initiating the session (empty POST), return VC request object
  if (Object.keys(body).length === 0) {
    const vprQuery = {
      verifiablePresentationRequest: {
        query: [
          {
            type: 'QueryByExample',
            credentialQuery: {
              reason: 'Please accept your resume as a Verifiable Credential.',
              example: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential']
              }
            }
          }
        ]
      }
    }

    return withCors(NextResponse.json(vprQuery))
  }

  // Else store the incoming VC in memory
  exchanges.set(txId, {
    data: body,
    created: Date.now(),
    expires: Date.now() + EXPIRY_MINUTES * 60 * 1000
  })

  return withCors(NextResponse.json({ status: 'received' }))
}
