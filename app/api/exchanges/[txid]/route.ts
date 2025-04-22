import { NextRequest, NextResponse } from 'next/server'
import { exchanges } from '../../../lib/exchanges' // Adjust path if needed

// Set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

// Handle CORS preflight
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  })
}

/**
 * GET /api/exchanges/[txId]
 * Used by the web app to poll for the result
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { txId: string } }
) {
  const { txId } = params
  console.log('🚀 ~ handler ~ txId:', txId)

  if (!txId) {
    return NextResponse.json(
      { error: 'Transaction id is required.' },
      { status: 400, headers: corsHeaders }
    )
  }

  console.log('Looking for tx', txId, exchanges.get(txId))

  if (exchanges.has(txId)) {
    return new NextResponse(exchanges.get(txId), {
      status: 200,
      headers: corsHeaders
    })
  } else {
    console.log('Incoming GET: tx not found.')
    return new NextResponse('Not found', {
      status: 404,
      headers: corsHeaders
    })
  }
}

/**
 * POST /api/exchanges/[txId]
 * Called by the LCW wallet to POST a verifiable credential
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { txId: string } }
) {
  const { txId } = params
  console.log('🚀 ~ txId:', txId)

  try {
    const body = await request.json()
    const payload = JSON.stringify(body)

    console.log('Incoming POST:', body)

    if (payload === '{}') {
      // Initial POST by the wallet, send the VP Request query
      const query = vprQuery()
      return NextResponse.json(query, { headers: corsHeaders })
    } else {
      // Requested credentials sent by the wallet
      // Store in the exchanges cache
      console.log('Storing txId', txId, payload)
      exchanges.set(txId, payload)
      return NextResponse.json({ status: 'received' }, { headers: corsHeaders })
    }
  } catch (error: any) {
    console.error(error)

    return NextResponse.json(
      {
        status: error.statusText || 'Invalid request',
        error: error.message
      },
      {
        status: error.statusCode || 400,
        headers: corsHeaders
      }
    )
  }
}

/**
 * Returns the Verifiable Presentation Request Query
 */
function vprQuery() {
  return {
    verifiablePresentationRequest: {
      query: [
        {
          type: 'QueryByExample',
          credentialQuery: {
            reason:
              'Please present your Verifiable Credential to complete the verification process.',
            example: {
              '@context': ['https://www.w3.org/2018/credentials/v1'],
              type: ['VerifiableCredential']
            }
          }
        }
      ]
    }
  }
}
