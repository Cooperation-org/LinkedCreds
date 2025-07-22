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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { saveRaw } from '../utils/googleDrive'
import { 
  analyzeCredential, 
  convertToNativeFormat, 
  getFetchStrategy,
  mightHaveCORSIssues 
} from '../utils/externalCredentials'

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
      <Box sx={{ mt: 2 }}>
        <Typography
          sx={{
            color: 'error.main',
            textAlign: 'center',
            mb: 1
          }}
        >
          {fetchResult.error || 'Unknown error'}
        </Typography>
        {fetchResult.error?.includes('CORS') && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              fontSize: '0.875rem'
            }}
          >
            Tip: If the credential provider supports it, try using a direct download link or contact them for CORS-enabled access.
          </Typography>
        )}
      </Box>
    )
  }

  // Success message - check if it's in the error field (for provider info)
  const message = fetchResult.error || 'Success! Redirecting...'
  
  return (
    <Typography
      sx={{
        color: 'success.main',
        mt: 2,
        textAlign: 'center'
      }}
    >
      {message}
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
      const strategy = getFetchStrategy(url)
      
      console.log(`Fetch strategy for ${url}: ${strategy}`)

      // Try fetching based on the determined strategy
      if (strategy === 'direct' || strategy === 'proxy') {
        try {
          if (strategy === 'direct') {
            // Direct fetch
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
          } else {
            // Use our Next.js API route as a proxy
            const proxyUrl = `/api/proxy-credential?url=${encodeURIComponent(url)}`

            const proxyResponse = await fetch(proxyUrl, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              }
            })

            if (!proxyResponse.ok) {
              const errorData = await proxyResponse.json()
              throw new Error(errorData.error || `Proxy error! status: ${proxyResponse.status}`)
            }

            vcData = await proxyResponse.json()
          }
        } catch (error) {
          console.log(`${strategy} fetch failed:`, error)
          
          // If direct failed, try proxy; if proxy failed, try public CORS proxy
          if (strategy === 'direct') {
            // Retry with proxy
            try {
              const proxyUrl = `/api/proxy-credential?url=${encodeURIComponent(url)}`
              const proxyResponse = await fetch(proxyUrl)
              
              if (!proxyResponse.ok) {
                throw new Error(`Proxy failed: ${proxyResponse.status}`)
              }
              
              vcData = await proxyResponse.json()
            } catch (proxyError) {
              // Last resort: public CORS proxy
              console.log('Trying public CORS proxy as last resort...')
              const publicProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
              const publicProxyResponse = await fetch(publicProxyUrl)

              if (!publicProxyResponse.ok) {
                throw new Error(`All fetch methods failed`)
              }

              const publicProxyData = await publicProxyResponse.json()
              vcData = JSON.parse(publicProxyData.contents)
            }
          } else {
            throw error
          }
        }
      } else {
        // Direct to public CORS proxy for cors-proxy strategy
        const publicProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
        const publicProxyResponse = await fetch(publicProxyUrl)

        if (!publicProxyResponse.ok) {
          throw new Error(`Public proxy error! status: ${publicProxyResponse.status}`)
        }

        const publicProxyData = await publicProxyResponse.json()
        vcData = JSON.parse(publicProxyData.contents)
      }

      // Console log the fetched data
      console.log('Fetched credential data:', vcData)

      // Analyze the credential to see if our viewer can display it natively
      const credentialInfo = analyzeCredential(vcData)
      console.log('Credential analysis:', credentialInfo)
      console.log('Can display natively:', !credentialInfo.isExternal)
      
      if (credentialInfo.isExternal) {
        console.log(`Detected external credential from ${credentialInfo.provider} (${credentialInfo.format})`)
        console.log('This credential format cannot be displayed in our native viewer')
        
        // Check if we can convert it to native format
        if (credentialInfo.canConvert) {
          const converted = convertToNativeFormat(vcData)
          if (converted) {
            console.log('Successfully converted to native format')
            vcData = converted
            credentialInfo.isExternal = false // Can now display in native viewer
          } else {
            console.log('Conversion failed, will use generic credential viewer')
          }
        }
      }
      
      if (credentialInfo.isExternal) {
        // For credentials that can't be displayed natively, save and use generic viewer
        if (accessToken) {
          try {
            // If it's a VerifiablePresentation, extract the credential
            let credentialToSave = vcData
            if (vcData.type?.includes('VerifiablePresentation') && vcData.verifiableCredential?.[0]) {
              credentialToSave = vcData.verifiableCredential[0]
            }
            
            const savedFile = await saveRaw(accessToken, credentialToSave)
            console.log('External credential saved to Google Drive:', savedFile)
            
            setFetchResult({
              success: true,
              data: credentialToSave
            })
            
            // Show success message with provider info
            setFetchResult({
              success: true,
              data: credentialToSave,
              error: `Successfully imported ${credentialInfo.provider} credential`
            })
            
            // Navigate to view page after save
            setTimeout(() => {
              router.push(`/view/${savedFile.id}`)
            }, 2000)
          } catch (saveError) {
            console.error('Error saving to Google Drive:', saveError)
            setFetchResult({
              success: false,
              error: 'Failed to save credential to Google Drive'
            })
          }
        } else {
          setFetchResult({
            success: false,
            error: 'Please log in to save credentials'
          })
        }
      } else {
        // Native credential - use existing flow
        const { formData } = extractFormDataFromCredential(vcData)

        // Store the form data in localStorage to pre-fill the form
        localStorage.setItem('importedFormData', JSON.stringify(formData))

        setFetchResult({
          success: true,
          data: vcData
        })

        // Save the credential directly to Google Drive
        if (accessToken) {
          try {
            const savedFile = await saveRaw(accessToken, vcData)
            console.log('Credential saved to Google Drive:', savedFile)
          } catch (saveError) {
            console.error('Error saving to Google Drive:', saveError)
            // Continue with form flow even if save fails
          }
        }

        // Navigate to the credentialForm route after a short delay to show success message
        setTimeout(() => {
          router.push('/credentialForm')
        }, 1500)
      }
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
          {url && mightHaveCORSIssues(url) && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              <Typography variant="caption" color="text.secondary">
                This URL might require proxy access due to CORS restrictions
              </Typography>
            </Box>
          )}
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

      {/* Helpful examples */}
      <Box sx={{ mt: 3, maxWidth: 400, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Examples of supported URLs:
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          • GitHub raw files (raw.githubusercontent.com)<br/>
          • Direct JSON endpoints with CORS headers<br/>
          • Google Drive direct download links<br/>
          • Most credential issuers' public endpoints
        </Typography>
      </Box>

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
