import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// In-memory session store
const exchanges = new Map()
const JWT_SECRET = process.env.JWT_SECRET || 'RANDOM_SECRET_KEY'
const EXPIRY_MINUTES = 5

// CORS headers - Apply to ALL responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  })
}

// Helper function to add CORS headers to any response
function addCorsHeaders(response: NextResponse) {
  // Add CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

// GET route handler (start, check-auth)
export async function GET(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const { action } = params

  let response: NextResponse

  try {
    if (action === 'start') {
      response = await handleStart()
    } else if (action === 'check-auth') {
      const url = new URL(request.url)
      const sessionId = url.searchParams.get('sessionId')

      if (!sessionId) {
        response = NextResponse.json(
          { error: 'Missing sessionId parameter' },
          { status: 400 }
        )
      } else {
        response = await handleCheckAuth(sessionId)
      }
    } else {
      response = NextResponse.json({ error: 'Invalid action' }, { status: 404 })
    }
  } catch (error) {
    console.error('API error:', error)
    response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  // Ensure CORS headers are added to ALL responses
  return addCorsHeaders(response)
}

// POST route handler (confirm)
export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const { action } = params

  let response: NextResponse

  try {
    if (action === 'confirm') {
      try {
        const body = await request.json()
        console.log('🚀 ~ body:', body)
        const { sessionId, token, resumeData } = body

        if (!sessionId) {
          response = NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
        } else {
          response = await handleConfirm(sessionId, token, resumeData)
        }
      } catch (error) {
        response = NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
      }
    } else {
      response = NextResponse.json({ error: 'Invalid action' }, { status: 404 })
    }
  } catch (error) {
    console.error('API error:', error)
    response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  // Ensure CORS headers are added to ALL responses
  return addCorsHeaders(response)
}

async function handleStart() {
  const sessionId = generateSessionId()

  const payload = {
    resumeId: '12345',
    userName: 'John Doe',
    sessionId,
    timestamp: new Date().toISOString(),
    appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN || 'http://localhost:3000'
  }

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${EXPIRY_MINUTES}m` })

  exchanges.set(sessionId, {
    token,
    status: 'pending',
    created: Date.now(),
    expires: Date.now() + EXPIRY_MINUTES * 60 * 1000
  })

  cleanupExpiredSessions()

  return NextResponse.json({ ...payload, token })
}

async function handleConfirm(sessionId: string, token: string, resumeData: any) {
  if (!exchanges.has(sessionId)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const session = exchanges.get(sessionId)
  console.log('Found the sesion', session)

  if (token && session.token !== token) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  session.status = 'confirmed'
  session.confirmedAt = Date.now()
  session.resumeData = resumeData || {}
  exchanges.set(sessionId, session)
  console.log('🚀 ~ handleConfirm ~ session:', exchanges.get(sessionId))

  return NextResponse.json({ status: 'confirmed' })
}

async function handleCheckAuth(sessionId: string) {
  if (!exchanges.has(sessionId)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const session = exchanges.get(sessionId)

  if (Date.now() > session.expires) {
    exchanges.delete(sessionId)
    return NextResponse.json({ error: 'Session expired' }, { status: 410 })
  }

  return NextResponse.json({
    status: session.status,
    confirmedAt: session.confirmedAt || null,
    resumeData: session.resumeData || null
  })
}

// Helper functions
function generateSessionId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

function cleanupExpiredSessions() {
  const now = Date.now()
  for (const [sessionId, session] of exchanges.entries()) {
    if (session.expires <= now) {
      exchanges.delete(sessionId)
    }
  }
}
