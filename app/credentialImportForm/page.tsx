'use client'
import React, { useState } from 'react'
import {
  Box,
  Link,
  TextField,
  FormLabel,
  Typography,
  CircularProgress,
  Button
} from '@mui/material'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import VisibilityIcon from '@mui/icons-material/Visibility'

const formLabelStyles = {
  fontFamily: 'Lato',
  fontSize: '16px',
  fontWeight: 400,
  color: '#000000',
  marginBottom: '8px'
}

const TextFieldStyles = {
  width: '343px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px'
  }
}

const textFieldInputProps = {
  style: {
    padding: '16px',
    fontSize: '16px'
  }
}

interface FetchResult {
  success: boolean
  error?: string
  data?: any
}

// Function to extract form data from credential JSON
const extractFormDataFromCredential = (credentialData: any) => {
  const credentialSubject = credentialData.credentialSubject || {}
  const credentialType = credentialSubject.credentialType || 'skill'

  // Base form data
  const formData: any = {
    storageOption: 'Google Drive',
    fullName: credentialSubject.name || '',
    portfolio: credentialSubject.portfolio || [],
    evidenceLink: credentialSubject.evidenceLink || '',
    evidenceDescription: credentialSubject.evidenceDescription || '',
    description: credentialSubject.evidenceDescription || ''
  }

  // Extract achievement data if present
  const achievement = credentialSubject.achievement?.[0]
  if (achievement) {
    formData.credentialName = achievement.name || ''
    formData.credentialDescription = achievement.description || ''
    formData.persons = achievement.criteria?.narrative || ''
  }

  // Add duration if present
  if (credentialSubject.duration) {
    formData.credentialDuration = credentialSubject.duration
    formData.duration = credentialSubject.duration
  }

  // Map credential type to form route
  const typeToRoute: Record<string, string> = {
    skill: '/skill',
    volunteer: '/volunteer',
    employment: '/role',
    'performance-review': '/performance-review',
    'identity-verification': '/identity-verification'
  }

  return {
    formData,
    route: typeToRoute[credentialType] || '/skill',
    credentialType
  }
}

// Separate status message component for cleaner organization
function StatusMessage({ fetchResult }: { fetchResult: FetchResult | null }) {
  if (!fetchResult) return null

  if (!fetchResult.success) {
    return (
      <Typography
        sx={{
          color: 'error.main',
          mt: 2,
          textAlign: 'center'
        }}
      >
        {fetchResult.error || 'Unknown error'}
      </Typography>
    )
  }

  return (
    <Typography
      sx={{
        color: 'success.main',
        mt: 2,
        textAlign: 'center'
      }}
    >
      Success! Redirecting to form with pre-filled data...
    </Typography>
  )
}

function SimpleCredentialForm() {
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [url, setUrl] = useState('')
  const { data: session } = useSession()
  const router = useRouter()
  const accessToken = session?.accessToken

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = event.target.value
    setUrl(inputUrl)
  }

  const handleViewRawData = () => {
    // Extract Google Drive file ID if it's a Google Drive URL
    const extractGoogleDriveId = (url: string): string | null => {
      const regex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/
      const match = url.match(regex)
      return match && match[1] ? match[1] : null
    }

    const fileId = extractGoogleDriveId(url)
    if (!fileId) {
      // Show error or alert that no valid file ID was found
      return
    }
    setPopupOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setFetchResult({
        success: false,
        error: 'Please enter a valid URL'
      })
      return
    }

    setIsLoading(true)
    setFetchResult(null)

    try {
      let vcData

      // Try direct fetch first
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        vcData = await response.json()
      } catch (corsError) {
        console.log('Direct fetch failed, likely due to CORS. Trying backend proxy...')

        // Use the backend server as a proxy
        try {
          const backendUrl =
            process.env.REACT_APP_SERVER_URL || 'https://linkedcreds.allskillscount.org'
          const proxyUrl = `${backendUrl}/api/proxy-credential?url=${encodeURIComponent(url)}`

          const proxyResponse = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          })

          if (!proxyResponse.ok) {
            throw new Error(`Backend proxy error! status: ${proxyResponse.status}`)
          }

          vcData = await proxyResponse.json()
        } catch (backendError) {
          console.log('Backend proxy failed. Trying public CORS proxy...')

          // Fallback to public CORS proxy
          try {
            const publicProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
            const publicProxyResponse = await fetch(publicProxyUrl)

            if (!publicProxyResponse.ok) {
              throw new Error(`Public proxy error! status: ${publicProxyResponse.status}`)
            }

            const publicProxyData = await publicProxyResponse.json()
            vcData = JSON.parse(publicProxyData.contents)
          } catch (publicProxyError) {
            // If all attempts fail, provide user-friendly error message
            throw new Error(
              "Unable to fetch data due to CORS restrictions. This usually happens when the credential server doesn't allow cross-origin requests. Please contact the credential provider or try a different URL."
            )
          }
        }
      }

      // Console log the fetched data
      console.log('Fetched credential data:', vcData)

      // Extract form data and determine route
      const { formData } = extractFormDataFromCredential(vcData)

      // Store the form data in localStorage to pre-fill the form
      localStorage.setItem('importedFormData', JSON.stringify(formData))

      setFetchResult({
        success: true,
        data: vcData
      })

      // Navigate to the credentialForm route after a short delay to show success message
      setTimeout(() => {
        router.push('/credentialForm')
      }, 1500)
    } catch (err) {
      console.error('Error fetching credential data:', err)
      let errorMessage = 'Failed to fetch credential data from URL'

      if (err instanceof Error) {
        errorMessage = err.message
      }

      setFetchResult({
        success: false,
        error: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        mt: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px'
      }}
    >
      <Typography sx={{ fontFamily: 'Lato', fontSize: '24px', fontWeight: 400 }}>
        Credential Import
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <FormLabel sx={{ ...formLabelStyles, mb: 2 }} id='credential-url-label'>
            Enter your credential URL:
          </FormLabel>
          <TextField
            name='credentialUrl'
            value={url}
            onChange={handleUrlChange}
            placeholder='https://example.com/credential.json'
            variant='outlined'
            sx={TextFieldStyles}
            aria-labelledby='credential-url-label'
            inputProps={textFieldInputProps}
            disabled={isLoading}
          />
          <Button
            type='submit'
            variant='contained'
            disabled={isLoading || !url.trim()}
            sx={{
              mt: 2,
              borderRadius: '8px',
              textTransform: 'none',
              fontFamily: 'Lato',
              backgroundColor: '#003FE0',
              '&:hover': { backgroundColor: '#0056b3' }
            }}
          >
            {isLoading ? 'Fetching...' : 'Import Credential Data'}
          </Button>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!isLoading && <StatusMessage fetchResult={fetchResult} />}
        </Box>
      </form>

      {/* Raw Credential Viewer Button - Only for Google Drive links */}
      {url.includes('drive.google.com') && (
        <Box
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
        >
          <Typography variant='body2' color='text.secondary'>
            Or view raw credential data from the Google Drive link
          </Typography>
          <Button
            variant='outlined'
            startIcon={<VisibilityIcon />}
            onClick={handleViewRawData}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontFamily: 'Lato'
            }}
          >
            View Raw Credential Data
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default function Page() {
  return (
    <Box
      sx={{
        minHeight: {
          xs: 'calc(100vh - 182px)',
          md: 'calc(100vh - 255px)'
        },
        display: 'block',
        flexDirection: 'column',
        overflow: 'auto'
      }}
    >
      <SimpleCredentialForm />
    </Box>
  )
}
