// File: app/api/qr-code/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  // For now, we'll return static data
  // In a real implementation, this would likely:
  // 1. Create a session ID in your database
  // 2. Associate it with the current user/session
  // 3. Return a payload that includes this session ID

  const payload = {
    resumeId: '12345',
    userName: 'John Doe',
    sessionId: generateSessionId(), // Generate a unique session ID
    timestamp: new Date().toISOString(),
    appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://resume-author.example.com'
  }
  const response = NextResponse.json(payload, {
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
