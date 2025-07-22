import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      )
    }

    // Fetch the credential from the external URL
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Some APIs require a User-Agent
        'User-Agent': 'LinkedCreds/1.0'
      },
      // Important: Next.js edge runtime doesn't support 'mode'
      // but server-side requests don't have CORS restrictions
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch credential: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      // Try to parse anyway, some servers don't set correct content-type
      try {
        const data = await response.json()
        return NextResponse.json(data)
      } catch {
        return NextResponse.json(
          { error: 'Response is not valid JSON' },
          { status: 400 }
        )
      }
    }

    const data = await response.json()
    
    // Add CORS headers for client-side access
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching credential' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
