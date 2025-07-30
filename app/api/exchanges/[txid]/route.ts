import { NextRequest, NextResponse } from 'next/server'
import { exchanges } from '../../../lib/exchanges'
import { APP_BASE_URL } from '../../../../app.config'

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
  const { txId } = params;
  console.log('[POST] Incoming txId:', txId);

  try {
    // Try to parse body — gracefully handle empty body
    const body = await request.json().catch(() => ({}));
    console.log('[POST] Parsed body:', body);

    const appInstanceDid = body.appInstanceDid;
    const existing = exchanges.get(txId);

    if (appInstanceDid) {
      // Initial POST from the web app
      console.log('[POST] Received appInstanceDid from resume-author:', appInstanceDid);
      exchanges.set(txId, JSON.stringify({ appInstanceDid }));
      return NextResponse.json(
        { status: '✅ App DID received, waiting for wallet to connect' },
        { headers: corsHeaders }
      );
    }

    if (existing) {
      // LCW second POST with empty body — retrieve session and return VPR
      const { appInstanceDid } = JSON.parse(existing);
      console.log('[POST] LCW connected, found stored appInstanceDid:', appInstanceDid);

      const query = vprQuery({ txId, appInstanceDid });
      return NextResponse.json(query, { headers: corsHeaders });
    }

    // Neither new DID nor existing session
    console.warn('[POST] ❌ Missing appInstanceDid and no cached session found for txId.');
    return NextResponse.json(
      { error: 'Missing appInstanceDid and no session initialized' },
      { status: 400, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('[POST] ❌ Error handling request:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: corsHeaders });
  }
}


/**
 * Returns the Verifiable Presentation Request Query
 */
function vprQuery({ txId, appInstanceDid }: { txId: string; appInstanceDid: string }) {
  const pollingExchangeEndpoint = `${APP_BASE_URL}/api/exchanges/${txId}`

  return {
    verifiablePresentationRequest: {
      interact: {
        type: 'UnmediatedHttpPresentationService2021',
        serviceEndpoint: pollingExchangeEndpoint
      },
      query: [
        {
          type: 'ZcapQuery',
          capabilityQuery: {
            reason:
              'Linked Creds Author is requesting the permission to read and write to the Verifiable Credentials and VC Evidence collections.',
            allowedAction: ['GET', 'PUT', 'POST'],
            controller: appInstanceDid,
            invocationTarget: {
              type: 'urn:was:collection',
              contentType: 'application/vc',
              name: 'VerifiableCredential collection'
            }
          }
        }
      ]
    }
  }
}
