/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useEffect, useState } from 'react'
import {
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
  Button,
  Collapse,
  Container,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Link as MuiLink
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { SVGDate, SVGBadge, CheckMarkSVG, LineSVG } from '../../Assets/SVGs'
import { useSession } from 'next-auth/react'
import useGoogleDrive from '../../hooks/useGoogleDrive'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { GoogleDriveStorage } from '@cooperation/vc-storage'
import EvidencePreview from './EvidencePreview'
import { getAccessToken, getFileViaFirebase } from '../../firebase/storage'
import QRCode from 'qrcode'
import GenericCredentialViewer from './GenericCredentialViewer'
// Define types
interface Portfolio {
  name: string
  url: string
}
interface Achievement {
  name: string
  description: string
  criteria?: { narrative: string }
  image?: { id: string }
}
interface CredentialSubject {
  name?: string  // Made optional since external creds might not have it
  credentialType?: string  // Added as optional for native detection
  achievement?: Achievement[]
  duration?: string
  portfolio?: Portfolio[]
  createdTime?: string
  evidenceLink?: string
  howKnow?: string
  recommendationText?: string
  qualifications?: string
  explainAnswer?: string
}
interface ClaimDetail {
  '@context': string[]
  id: string
  type: string[]
  issuanceDate: string
  expirationDate: string
  credentialSubject: CredentialSubject
}
interface ComprehensiveClaimDetailsProps {
  onAchievementLoad?: (achievementName: string) => void
  fileID?: string
}
const cleanHTML = (htmlContent: any): string => {
  if (typeof htmlContent !== 'string') {
    return ''
  }
  return htmlContent
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p><\/p>/g, '')
    .replace(/<br>/g, '')
    .replace(/class="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
}
const ComprehensiveClaimDetails: React.FC<ComprehensiveClaimDetailsProps> = ({
  onAchievementLoad,
  fileID: propFileID
}) => {
  const params = useParams()
  const fileID = propFileID || (params?.id as string)

  const [claimDetail, setClaimDetail] = useState<ClaimDetail | null>(null)
  const [comments, setComments] = useState<ClaimDetail[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [qrCodeDataUrlMobile, setQrCodeDataUrlMobile] = useState<string>('')
  const theme = useTheme()
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('sm'))
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const accessToken = session?.accessToken
  const isAskForRecommendation = pathname?.includes('/askforrecommendation')
  const isView = pathname?.includes('/view')
  const isRecommendationsPage = pathname?.includes('/recommendations/')
  const {} = useGoogleDrive()
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (fileID) {
      const sourceUrl = `${window.location.origin}/api/credential-raw/${fileID}`
      QRCode.toDataURL(sourceUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#2563eb',
          light: '#F0F4F8'
        }
      })
        .then(url => {
          setQrCodeDataUrl(url)
        })
        .catch(err => {
          console.error('Error generating QR code:', err)
        })
      QRCode.toDataURL(sourceUrl, {
        width: 80,
        margin: 1,
        color: {
          dark: '#2563eb',
          light: '#F0F4F8'
        }
      })
        .then(url => {
          setQrCodeDataUrlMobile(url)
        })
        .catch(err => {
          console.error('Error generating mobile QR code:', err)
        })
    }
  }, [fileID])

  useEffect(() => {
    if (!fileID) {
      setErrorMessage('Invalid claim ID.')
      setLoading(false)
      return
    }
    if (status === 'loading') {
      return
    }
    if (status === 'unauthenticated') {
      setLoading(false)
      return
    }
    if (!accessToken) {
      setErrorMessage('You need to log in to view this content.')
      setLoading(false)
      return
    }
    const fetchDriveData = async () => {
      try {
        const accessToken1 = await getAccessToken(fileID)
        const uncachedStorage = new GoogleDriveStorage(accessToken1)
        let vcData = await getFileViaFirebase(fileID)
        vcData = JSON.parse(vcData.body)

        if (vcData) {
          setClaimDetail(vcData as unknown as ClaimDetail)
        }

        const shouldFetchRecommendations = isView || !!propFileID
        if (shouldFetchRecommendations) {
          const vcFolderId = await uncachedStorage.getFileParents(fileID)
          const files = await uncachedStorage.findFolderFiles(vcFolderId)
          const relationsFile = files.find((f: any) => f.name === 'RELATIONS')

          if (relationsFile) {
            const relationsContent = await uncachedStorage.retrieve(relationsFile.id)
            const relationsData = relationsContent?.data.body
              ? JSON.parse(relationsContent?.data.body)
              : relationsContent?.data

            const recommendationIds = relationsData.recommendations || []
            const recommendations = await Promise.all(
              recommendationIds.map(async (rec: string) => {
                const recFile = await getFileViaFirebase(rec)
                return JSON.parse(recFile.body)
              })
            )
            if (recommendations) {
              setComments(recommendations as any)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching claim details:', error)
        setErrorMessage('Failed to fetch claim details.')
      } finally {
        setLoading(false)
      }
    }

    fetchDriveData()
  }, [accessToken, fileID, status, isView, propFileID])

  const handleToggleComment = (commentId: string) => {
    setExpandedComments(prevState => ({
      ...prevState,
      [commentId]: !prevState[commentId]
    }))
  }
  if (status === 'loading' || loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (errorMessage) {
    return (
      <Typography variant='h6' color='error' align='center' sx={{ mt: 4 }}>
        {errorMessage}
      </Typography>
    )
  }
  setTimeout(() => {
    if (!claimDetail) {
      return (
        <Typography variant='h6' align='center' sx={{ mt: 4 }}>
          No claim details available.
        </Typography>
      )
    }
  }, 2000)
  const credentialSubject = claimDetail?.credentialSubject
  const achievement = credentialSubject?.achievement && credentialSubject.achievement[0]
  const validPortfolio = Array.isArray(credentialSubject?.portfolio)
    ? credentialSubject.portfolio.filter(item => item && item.name && item.url)
    : []
  const hasValidEvidence = validPortfolio.length > 0
  
  // Check if this is an external credential
  const isExternalCredential = () => {
    if (!claimDetail) return false
    
    const subject = claimDetail.credentialSubject || {}
    
    // Check if it has our native fields that our viewer expects
    // Our native schema should have:
    // - credentialSubject.name (person's name)
    // - credentialSubject.credentialType (skill/volunteer/employment/etc)
    // - credentialSubject.achievement as an array
    
    const hasNativeName = typeof subject.name === 'string'
    const hasCredentialType = typeof subject.credentialType === 'string'
    const hasArrayAchievement = Array.isArray(subject.achievement)
    
    // ALL THREE must be present for it to be native
    // If any are missing, it's external
    if (hasNativeName && hasCredentialType && hasArrayAchievement) {
      return false
    }
    
    // Otherwise, it's external
    return true
  }
  
  // If it's an external credential, use the generic viewer
  if (isExternalCredential()) {
    return (
      <Container sx={{ maxWidth: '800px' }}>
        <GenericCredentialViewer 
          credential={claimDetail}
          qrCodeDataUrl={qrCodeDataUrl}
          fileID={fileID}
        />
      </Container>
    )
  }
  
  return (
    <Container sx={{ maxWidth: '800px' }}>
      {claimDetail && (
        <Box
          sx={{
            p: isAskForRecommendation ? '5px' : '20px',
            gap: '20px',
            margin: '20px auto 0',
            border: '1px solid #003FE0',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: isAskForRecommendation ? 'center' : 'flex-start',
            position: 'relative'
          }}
        >
          {fileID && !isMobile && (
            <Box
              sx={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '12px',
                zIndex: 1
              }}
            >
              <Link
                href={`/api/credential-raw/${fileID}`}
                target='_blank'
                style={{ textDecoration: 'none' }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'Lato',
                    color: '#003FE0',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'none'
                    }
                  }}
                >
                  View Source
                </Typography>
              </Link>
              {qrCodeDataUrl && (
                <img
                  src={qrCodeDataUrl}
                  alt='QR Code for credential source'
                  style={{ width: '120px', height: '120px' }}
                />
              )}
            </Box>
          )}
          {isAskForRecommendation && (
            <Box
              sx={{
                width: credentialSubject?.evidenceLink ? '30%' : '0',
                marginRight: credentialSubject?.evidenceLink ? '20px' : '15px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}
            >
              {credentialSubject?.evidenceLink ? (
                <EvidencePreview
                  url={credentialSubject.evidenceLink}
                  width={180}
                  height={150}
                />
              ) : (
                <Box
                  sx={{ width: '15px', height: '100px', backgroundColor: 'transparent' }}
                />
              )}
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                justifyContent: 'center'
              }}
            >
              <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <SVGBadge />
                <Typography
                  sx={{ color: 't3BodyText', fontSize: '24px', fontWeight: 700 }}
                >
                  {credentialSubject?.name} has claimed:
                </Typography>
              </Box>
              <Typography
                sx={{ color: 't3BodyText', fontSize: '24px', fontWeight: 700, mt: 2 }}
              >
                {achievement?.name ?? 'Unnamed Achievement'}
              </Typography>
            </Box>
            {credentialSubject?.duration && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '2px 5px',
                  borderRadius: '5px',
                  width: 'fit-content',
                  mb: '10px',
                  bgcolor: '#d5e1fb',
                  mt: 2
                }}
              >
                <Box sx={{ mt: '2px' }}>
                  <SVGDate />
                </Box>
                <Typography sx={{ color: 't3BodyText', fontSize: '13px' }}>
                  {credentialSubject?.duration}
                </Typography>
              </Box>
            )}
            {!isAskForRecommendation && (
              <>
                {credentialSubject?.evidenceLink && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      my: '10px',
                      width: '100%'
                    }}
                  >
                    <EvidencePreview
                      url={credentialSubject.evidenceLink}
                      width={180}
                      height={150}
                    />
                  </Box>
                )}
                {achievement?.description && (
                  <Link href={credentialSubject?.evidenceLink ?? ''} target='_blank'>
                    <Typography
                      sx={{
                        cursor: 'pointer',
                        fontFamily: 'Lato',
                        fontSize: '17px',
                        letterSpacing: '0.075px',
                        lineHeight: '24px',
                        mt: 2,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-line',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: cleanHTML(achievement.description)
                        }}
                      />
                    </Typography>
                  </Link>
                )}
                {achievement?.criteria?.narrative && (
                  <Box sx={{ mt: 2 }}>
                    <Typography>What does that entail?:</Typography>
                    <ul style={{ marginLeft: '25px' }}>
                      <li
                        style={{
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-line',
                          overflowWrap: 'anywhere'
                        }}
                      >
                        <span
                          dangerouslySetInnerHTML={{
                            __html: cleanHTML(achievement?.criteria?.narrative)
                          }}
                        />
                      </li>
                    </ul>
                  </Box>
                )}
                {hasValidEvidence && (
                  <Box sx={{ mt: 3 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      Supporting Evidence / Portfolio:
                    </Typography>
                    <ul
                      style={{
                        marginLeft: '25px',
                        textDecorationLine: 'underline',
                        color: 'blue'
                      }}
                    >
                      {validPortfolio.map((portfolioItem, idx) => (
                        <li
                          key={`main-portfolio-${idx}`}
                          style={{
                            cursor: 'pointer',
                            width: 'fit-content',
                            marginBottom: '10px'
                          }}
                        >
                          <Link
                            href={portfolioItem.url}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            {portfolioItem.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}
              </>
            )}
            {/* {pathname?.includes('/claims') && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Link href={`/view/${fileID}`}>
                  <Button
                    variant='contained'
                    sx={{
                      backgroundColor: '#003FE0',
                      textTransform: 'none',
                      borderRadius: '100px'
                    }}
                  >
                    View Credential
                  </Button>
                </Link>
                <Link href={`/askforrecommendation/${fileID}`}>
                  <Button
                    variant='contained'
                    sx={{
                      backgroundColor: '#003FE0',
                      textTransform: 'none',
                      borderRadius: '100px'
                    }}
                  >
                    Ask for Recommendation
                  </Button>
                </Link>
              </Box>
            )} */}
            {(pathname?.includes('/view') || !!propFileID) &&
              claimDetail &&
              !isRecommendationsPage && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    mt: '20px'
                  }}
                >
                  <Typography
                    sx={{ fontSize: '13px', fontWeight: 700, color: '#000E40' }}
                  >
                    Credential Details
                  </Typography>
                  <Box
                    sx={{ display: 'flex', gap: '5px', mt: '10px', alignItems: 'center' }}
                  >
                    <Box sx={{ borderRadius: '4px', bgcolor: '#C2F1BE', p: '4px' }}>
                      <CheckMarkSVG />
                    </Box>
                    <Typography>Has a valid digital signature</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <Box sx={{ borderRadius: '4px', bgcolor: '#C2F1BE', p: '4px' }}>
                      <CheckMarkSVG />
                    </Box>
                    <Typography>Has not expired</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <Box sx={{ borderRadius: '4px', bgcolor: '#C2F1BE', p: '4px' }}>
                      <CheckMarkSVG />
                    </Box>
                    <Typography>Has not been revoked by issuer</Typography>
                  </Box>
                </Box>
              )}
          </Box>
        </Box>
      )}

      {fileID && isMobile && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            mt: '16px',
            p: '16px',
            border: '1px solid #E0E7FF',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC'
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'Lato',
              color: '#64748B',
              textAlign: 'center'
            }}
          >
            Scan QR code or click to view credential source
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {qrCodeDataUrlMobile && (
              <img
                src={qrCodeDataUrlMobile}
                alt='QR Code for credential source'
                style={{ width: '80px', height: '80px' }}
              />
            )}
            <Link
              href={`/api/credential-raw/${fileID}`}
              target='_blank'
              style={{ textDecoration: 'none' }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'Lato',
                  color: '#003FE0',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'none'
                  }
                }}
              >
                View Source
              </Typography>
            </Link>
          </Box>
        </Box>
      )}

      {/* Comments Section */}
      {(isView || !!propFileID) && claimDetail && !isRecommendationsPage && (
        <Box>
          {loading ? (
            <Box display='flex' justifyContent='center' my={2}>
              <CircularProgress size={24} />
            </Box>
          ) : comments && comments.length > 0 ? (
            <List sx={{ p: 0, mb: 2 }}>
              {comments.map((comment: ClaimDetail, index: number) => (
                <React.Fragment key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      pr: '30px'
                    }}
                  >
                    <LineSVG />
                  </Box>
                  <ListItem
                    sx={{ borderRadius: '10px', border: '1px solid #003FE0' }}
                    alignItems='flex-start'
                    secondaryAction={
                      <IconButton
                        edge='end'
                        onClick={() =>
                          handleToggleComment(comment.id || index.toString())
                        }
                        aria-label='expand'
                      >
                        {expandedComments[comment.id || index.toString()] ? (
                          <ExpandLess />
                        ) : (
                          <ExpandMore />
                        )}
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <SVGBadge />
                          <Box>
                            <Typography variant='h6' component='div'>
                              {comment.credentialSubject?.name}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Vouched for {credentialSubject?.name}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Collapse
                    in={expandedComments[comment.id || index.toString()]}
                    timeout='auto'
                    unmountOnExit
                  >
                    <Box sx={{ pl: 7, pr: 2, pb: 2 }}>
                      {/* How They Know Each Other */}
                      {comment.credentialSubject?.howKnow && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            How They Know Each Other:
                          </Typography>
                          <Typography variant='body2'>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: cleanHTML(comment.credentialSubject.howKnow)
                              }}
                            />
                          </Typography>
                        </Box>
                      )}
                      {/* Recommendation Text */}
                      {comment.credentialSubject?.recommendationText && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Recommendation:
                          </Typography>
                          <Typography variant='body2'>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: cleanHTML(
                                  comment.credentialSubject.recommendationText
                                )
                              }}
                            />
                          </Typography>
                        </Box>
                      )}
                      {/* Your Qualifications */}
                      {comment.credentialSubject?.qualifications && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Your Qualifications:
                          </Typography>
                          <Typography variant='body2'>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: cleanHTML(
                                  comment.credentialSubject.qualifications
                                )
                              }}
                            />
                          </Typography>
                        </Box>
                      )}
                      {/* Explain Your Answer */}
                      {comment.credentialSubject?.explainAnswer && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Explain Your Answer:
                          </Typography>
                          <Typography variant='body2'>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: cleanHTML(comment.credentialSubject.explainAnswer)
                              }}
                            />
                          </Typography>
                        </Box>
                      )}
                      {/* Supporting Evidence */}
                      {Array.isArray(comment.credentialSubject?.portfolio) &&
                        comment.credentialSubject.portfolio.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant='subtitle2' color='text.secondary'>
                              Supporting Evidence:
                            </Typography>
                            {comment.credentialSubject.portfolio.map((item, idx) => (
                              <Box key={`comment-portfolio-${idx}`} sx={{ mt: 1 }}>
                                {item.name && item.url ? (
                                  <MuiLink
                                    href={item.url}
                                    underline='hover'
                                    color='primary'
                                    sx={{
                                      fontSize: '15px',
                                      textDecoration: 'underline',
                                      color: '#003fe0'
                                    }}
                                    target='_blank'
                                  >
                                    {item.name}
                                  </MuiLink>
                                ) : null}
                              </Box>
                            ))}
                          </Box>
                        )}
                    </Box>
                  </Collapse>
                  {/* Add Divider between comments */}
                  {index < comments.length - 1 && <Divider component='li' />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            !isRecommendationsPage && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  mb: '20px'
                }}
              >
                <Typography variant='body2'>No recommendations available.</Typography>
                <Link href={`/askforrecommendation/${fileID}`}>
                  <Button
                    variant='contained'
                    sx={{
                      backgroundColor: '#003FE0',
                      textTransform: 'none',
                      borderRadius: '100px',
                      width: { xs: 'fit-content', sm: '300px', md: '300px' }
                    }}
                  >
                    Ask for Recommendation
                  </Button>
                </Link>
              </Box>
            )
          )}
        </Box>
      )}
    </Container>
  )
}

export default ComprehensiveClaimDetails
