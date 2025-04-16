// File: app/api/qr-code/route.js
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// In-memory token store, replace with Redis?
const SESSION_TOKENS = new Map()

const JWT_SECRET = process.env.JWT_SECRET || 'RANDOE_SECRET_KEY'

export async function GET(request) {
  // Generate a unique session ID
  const sessionId = generateSessionId()

  // Create payload for the QR code
  const payload = {
    resumeId: '12345',
    userName: 'John Doe',
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
    appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://resume-author.example.com'
  }

  // Create a JWT token with the payload
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' }) // Token expires in 15 minutes

  // Store token in memory with pending status
  SESSION_TOKENS.set(sessionId, {
    token,
    status: 'pending',
    created: Date.now(),
    expires: Date.now() + 15 * 60 * 1000 // 15 minutes in milliseconds
  })

  // Clean up expired tokens
  cleanupExpiredTokens()

  // Include the token in the response
  const responsePayload = {
    ...payload,
    token
  }

  const response = NextResponse.json(responsePayload, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  return response
}

// Helper function to generate a unique session ID
function generateSessionId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

// Clean up expired tokens from memory
function cleanupExpiredTokens() {
  const now = Date.now()
  for (const [sessionId, session] of SESSION_TOKENS.entries()) {
    if (session.expires <= now) {
      SESSION_TOKENS.delete(sessionId)
    }
  }
}
