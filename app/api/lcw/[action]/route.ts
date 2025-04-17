// app/api/lcw/[action]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// In-memory session store
const exchanges = new Map()
const JWT_SECRET = process.env.JWT_SECRET || 'RANDOM_SECRET_KEY'
const EXPIRY_MINUTES = 5 // Setting to 5 minutes to match your UI timer

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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

// GET handlers
// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const { action } = params

  // Handle start action (generate QR code data)
  if (action === 'start') {
    return handleStart()
  }

  // Handle check-auth action (polling for auth status)
  if (action === 'check-auth') {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400, headers: corsHeaders }
      )
    }

    return handleCheckAuth(sessionId)
  }

  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 404, headers: corsHeaders }
  )
}

// POST handlers
export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const { action } = params

  // Handle confirm action (from mobile app)
  if (action === 'confirm') {
    try {
      const body = await request.json()
      const { sessionId, token, resumeData } = body

      if (!sessionId) {
        return NextResponse.json(
          { error: 'Missing sessionId' },
          { status: 400, headers: corsHeaders }
        )
      }

      return handleConfirm(sessionId, token, resumeData)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers: corsHeaders }
      )
    }
  }

  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 404, headers: corsHeaders }
  )
}

// Logic handlers
async function handleStart() {
  const sessionId = generateSessionId()

  const payload = {
    resumeId: '12345', // Example data
    userName: 'John Doe',
    sessionId,
    timestamp: new Date().toISOString(),
    appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN || 'http://localhost:3000'
  }

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${EXPIRY_MINUTES}m` })

  // Store in memory with expiration
  exchanges.set(sessionId, {
    token,
    status: 'pending',
    created: Date.now(),
    expires: Date.now() + EXPIRY_MINUTES * 60 * 1000
  })

  // Cleanup expired sessions
  cleanupExpiredSessions()

  return NextResponse.json({ ...payload, token }, { headers: corsHeaders })
}

async function handleConfirm(sessionId: string, token: string, resumeData: any) {
  if (!exchanges.has(sessionId)) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404, headers: corsHeaders }
    )
  }

  const session = exchanges.get(sessionId)

  // Verify token matches
  if (token && session.token !== token) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401, headers: corsHeaders }
    )
  }

  // Update session status and data
  session.status = 'confirmed'
  session.confirmedAt = Date.now()
  session.resumeData = resumeData || {}
  exchanges.set(sessionId, session)

  return NextResponse.json({ status: 'confirmed' }, { headers: corsHeaders })
}

async function handleCheckAuth(sessionId: string) {
  if (!exchanges.has(sessionId)) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404, headers: corsHeaders }
    )
  }

  const session = exchanges.get(sessionId)

  // Check if session has expired
  if (Date.now() > session.expires) {
    exchanges.delete(sessionId)
    return NextResponse.json(
      { error: 'Session expired' },
      { status: 410, headers: corsHeaders }
    )
  }

  return NextResponse.json(
    {
      status: session.status,
      confirmedAt: session.confirmedAt || null,
      resumeData: session.resumeData || null
    },
    { headers: corsHeaders }
  )
}
