'use client'

import React, { useCallback, useEffect, useState } from 'react'
import '../utils/promise-polyfill'
import {
  Typography,
  CircularProgress,
  Box,
  Button,
  IconButton,
  Collapse,
  Avatar,
  useTheme,
  useMediaQuery,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  Divider,
  Snackbar,
  Alert
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import VisibilityIcon from '@mui/icons-material/Visibility'
import RecommendIcon from '@mui/icons-material/Recommend'
import useGoogleDrive from '../hooks/useGoogleDrive'
import LoadingOverlay from '../components/Loading/LoadingOverlay'
import ComprehensiveClaimDetails from '../view/[id]/ComprehensiveClaimDetails'
import { updateClickRates } from '../firebase/firestore'

// Import utility functions
import {
  getRandomBorderColor,
  getTimeAgo,
  getTimeDifference,
  getCredentialName,
  getCredentialType,
  isValidClaim,
  getClaimId,
  generateLinkedInUrl
} from '../utils/claimsHelpers'

import {
  getRecommendationName,
  getRecommendationText,
  isValidRecommendation,
  getRecommendationId
} from '../utils/recommendationHelpers'

import {
  tearDown,
  getAllRecommendations,
  getAllClaims,
  safeDelete
} from '../utils/driveOperations'

import {
  SVGHeart,
  SVGLinkedIn,
  SVGEmail,
  SVGCopy,
  SVGTrush,
  BlueBadge,
  SVGExport
} from '../Assets/SVGs'

// Types
interface ViewClaimDialogContentProps {
  fileID: string
}

interface Claim {
  [x: string]: any
  id: string
  achievementName: string
}

interface Recommendation {
  [x: string]: any
  id: string
  credentialSubject: {
    name: string
    howKnow?: string
    recommendationText: string
    qualifications: string
    explainAnswer?: string
    portfolio?: Array<{ name: string; url: string }>
  }
  issuanceDate: string
  expirationDate?: string
}

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error'
}

const ViewClaimDialogContent: React.FC<ViewClaimDialogContentProps> = ({ fileID }) => {
  return (
    <Box sx={{ py: 2 }}>
      <ComprehensiveClaimDetails fileID={fileID} />
    </Box>
  )
}

const ClaimsPageClient: React.FC = () => {
  const [claims, setClaims] = useState<any[]>([])
  console.log(': claims', claims)
  const [recommendations, setRecommendations] = useState<any[]>([])
  console.log(': recommendations', recommendations)
  const [loading, setLoading] = useState(true)
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [initialFetchCompleted, setInitialFetchCompleted] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(
    null
  )
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<any>(null)
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showOverlappingCards, setShowOverlappingCards] = useState(false)
  const [desktopMenuAnchorEl, setDesktopMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [recommendationMenuAnchorEl, setRecommendationMenuAnchorEl] =
    useState<null | HTMLElement>(null)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [viewClaimDialogOpen, setViewClaimDialogOpen] = useState(false)
  const [viewClaimId, setViewClaimId] = useState<string | null>(null)

  const { data: session } = useSession()
  const accessToken = session?.accessToken
  const userEmail = session?.user?.email
  const { storage } = useGoogleDrive()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Event handlers
  const handleRecommendationClick = async (claimId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const url = `${window.location.origin}/askforrecommendation/${claimId}`
    await navigator.clipboard.writeText(url)
    router.push(`/askforrecommendation/${claimId}`)
    if (userEmail) {
      updateClickRates(userEmail, 'requestRecommendation')
    }
  }

  const handleViewClaimClick = (claimId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setViewClaimId(claimId)
    setViewClaimDialogOpen(true)
  }

  const handleCloseViewClaimDialog = () => {
    setViewClaimDialogOpen(false)
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const handleEmailShare = (claim: any, e?: React.MouseEvent) => {
    try {
      e?.stopPropagation()
      const claimId = getClaimId(claim)
      const mailPageUrl = `${window.location.origin}/mail/${claimId}`
      if (userEmail) {
        updateClickRates(userEmail, 'shareCredential')
      }
      window.location.href = mailPageUrl
    } catch (error) {
      console.error('Error in handleEmailShare:', error, claim)
    }
  }

  const handleDesktopMenuOpen = (event: React.MouseEvent<HTMLElement>, claim: any) => {
    event.stopPropagation()
    setDesktopMenuAnchorEl(event.currentTarget)
    setSelectedClaim(claim)
  }

  const handleLinkedInShare = (claim: any) => {
    const linkedInUrl = generateLinkedInUrl(claim)
    window.open(linkedInUrl, '_blank')
    if (userEmail) {
      updateClickRates(userEmail, 'shareCredential')
    }
  }

  const handleDesktopMenuClose = () => {
    setDesktopMenuAnchorEl(null)
  }

  const handleRecommendationMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    recommendation: any
  ) => {
    event.stopPropagation()
    setRecommendationMenuAnchorEl(event.currentTarget)
    setSelectedRecommendation(recommendation)
  }

  const handleRecommendationMenuClose = () => {
    setRecommendationMenuAnchorEl(null)
    setSelectedRecommendation(null)
  }

  const handleRecommendationCardClick = (recommendationId: string) => {
    if (isMobile) {
      setExpandedRecommendation(
        expandedRecommendation === recommendationId ? null : recommendationId
      )
    }
  }

  const handleCopyRecommendationUrl = async (
    recommendationId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation()
    const url = `${window.location.origin}/recommendations/${recommendationId}`
    await navigator.clipboard.writeText(url)
    setSnackbar({
      open: true,
      message: 'Recommendation URL copied to clipboard!',
      severity: 'success'
    })
  }

  const handleDeleteRecommendation = async () => {
    if (!selectedRecommendation || !storage) return
    try {
      setIsDeleting(true)
      setShowOverlappingCards(true)

      // Delete the recommendation file
      const fileId = getRecommendationId(selectedRecommendation)
      await safeDelete(storage, fileId)

      // Update local state
      setRecommendations(prevRecommendations =>
        prevRecommendations.filter(rec => getRecommendationId(rec) !== fileId)
      )

      setSnackbar({
        open: true,
        message: 'Recommendation deleted successfully',
        severity: 'success'
      })

      handleRecommendationMenuClose()
    } catch (error) {
      console.error('Error deleting recommendation:', error)
      setSnackbar({
        open: true,
        message: 'Failed to delete recommendation',
        severity: 'error'
      })
    } finally {
      setIsDeleting(false)
      setShowOverlappingCards(false)
    }
  }

  const handleCardClick = (claimId: string) => {
    if (isMobile) {
      setExpandedCard(expandedCard === claimId ? null : claimId)
    }
  }

  const handleCopyUrl = async (claimId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const url = `${window.location.origin}/view/${claimId}`
    await navigator.clipboard.writeText(url)
  }

  const handleConfirmDelete = async () => {
    if (!selectedClaim || !storage) return
    try {
      setIsDeleting(true)
      setShowOverlappingCards(true)
      await tearDown(storage, selectedClaim)
      setClaims(prevClaims => {
        const updated = prevClaims.filter(claim => claim?.id !== selectedClaim.id)
        localStorage.removeItem('vcs')
        return updated
      })
      setOpenDeleteDialog(false)
      setSelectedClaim(null)
      setDesktopMenuAnchorEl(null)
    } catch (error) {
      console.error('Error deleting claim:', error)
    } finally {
      setIsDeleting(false)
      setShowOverlappingCards(false)
      setExpandedCard(null)
    }
  }

  // Data fetching hooks
  const fetchClaims = useCallback(async () => {
    if (!storage) return

    try {
      setLoading(true)
      const claimsData = await getAllClaims(storage)
      setClaims(claimsData || [])
    } catch (error) {
      console.error('Error fetching claims:', error)
      setClaims([])
    } finally {
      setLoading(false)
      setInitialFetchCompleted(true)
    }
  }, [storage])

  const fetchRecommendations = useCallback(async () => {
    if (!storage) return

    try {
      setRecommendationsLoading(true)
      const recommendationsData = await getAllRecommendations(storage)
      setRecommendations(recommendationsData || [])
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      setRecommendations([])
    } finally {
      setRecommendationsLoading(false)
    }
  }, [storage])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('vcs')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        p: { xs: 2, sm: 3, md: '100px 20px 16px 50px' }
      }}
    >
      {isMobile && (
        <Box sx={{ mb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 3
            }}
          >
            <Avatar
              sx={{ border: '2px solid #003fe0' }}
              alt='Profile Picture'
              src={session?.user?.image}
            />
            <Box>
              <Typography variant='h6'>
                Hi, <span style={{ color: '#033fe0' }}>{session?.user?.name}</span>
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                What would you like to do?
              </Typography>
            </Box>
          </Box>

          <Button
            fullWidth
            variant='nextButton'
            onClick={() => router.push('/credentialForm')}
          >
            Add a new skill
          </Button>

          <Typography
            variant='subtitle1'
            sx={{ fontSize: '24px', fontFamily: 'Lato', mt: 2 }}
          >
            Work with my existing skills:
          </Typography>
        </Box>
      )}

      {!isMobile && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4
          }}
        >
          <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
            My Skills
          </Typography>
          <Button
            variant='nextButton'
            sx={{ textTransform: 'none' }}
            onClick={() => router.push('/credentialForm')}
          >
            Add a new skill
          </Button>
        </Box>
      )}

      {claims.length === 0 && !loading && !accessToken && initialFetchCompleted && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Typography variant='h6'>
            Please Sign in to be able to see your skills.
          </Typography>
        </Box>
      )}

      {claims.length === 0 && !loading && accessToken && initialFetchCompleted && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Typography variant='h6'>You don&apos;t have any skills yet.</Typography>
        </Box>
      )}

      {loading || !storage ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {claims.filter(isValidClaim).map((claim, index) => {
            // Additional safety check with error boundary
            try {
              const claimId = getClaimId(claim)
              return (
                <Paper
                  key={claimId}
                  onClick={() => handleCardClick(claimId)}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    cursor: isMobile ? 'pointer' : 'default',
                    border: '3px solid',
                    borderColor: isMobile ? getRandomBorderColor() : 'transparent',
                    bgcolor: 'background.paper',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    {isMobile ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BlueBadge />
                        <Typography
                          variant='subtitle1'
                          sx={{
                            fontWeight: 600,
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                          onClick={e => {
                            e.stopPropagation()
                            window.open(
                              `${window.location.origin}/view/${claimId}`,
                              '_blank'
                            )
                          }}
                        >
                          {getCredentialName(claim)}
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ mt: '5px' }}>
                            <BlueBadge />
                          </Box>
                          <Typography
                            sx={{
                              fontWeight: 'bold',
                              fontSize: '1.25rem',
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                            onClick={e => {
                              e.stopPropagation()
                              window.open(
                                `${window.location.origin}/view/${claimId}`,
                                '_blank'
                              )
                            }}
                          >
                            {getCredentialName(claim)}
                          </Typography>
                          <Typography
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 'bold',
                              fontSize: '1.25rem'
                            }}
                          >
                            {getTimeAgo(claim.issuanceDate || new Date().toISOString())}
                          </Typography>
                        </Box>
                        <Typography sx={{ color: 'text.secondary' }}>
                          {claim.credentialSubject?.name} - {getCredentialType(claim)} -{' '}
                          {getTimeDifference(
                            claim.issuanceDate || new Date().toISOString()
                          )}
                        </Typography>
                      </Box>
                    )}

                    {isMobile ? (
                      <IconButton
                        size='small'
                        onClick={e => {
                          e.stopPropagation()
                          handleCardClick(claimId)
                        }}
                      >
                        <KeyboardArrowDownIcon
                          sx={{
                            transform:
                              expandedCard === claimId ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.3s'
                          }}
                        />
                      </IconButton>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            border: '1px solid',
                            borderColor: 'primary.main',
                            borderRadius: '100px',
                            overflow: 'hidden',
                            bgcolor: 'primary.50'
                          }}
                        >
                          <Button
                            onClick={e => handleRecommendationClick(claimId, e)}
                            startIcon={<SVGHeart />}
                            sx={{
                              bgcolor: '#eff6ff',
                              borderColor: '#eff6ff',
                              '&:hover': { bgcolor: 'primary.100' },
                              p: '2px 20px',
                              backgroundColor: '#f0f6ff',
                              fontSize: '12px',
                              fontWeight: 'medium',
                              color: '#003fe0'
                            }}
                          >
                            Ask for a recommendation
                          </Button>
                          <Divider orientation='vertical' flexItem color='#003fe0' />
                          <Button
                            startIcon={<ContentCopyIcon />}
                            onClick={e => handleCopyUrl(claimId, e)}
                            sx={{
                              bgcolor: '#eff6ff',
                              '&:hover': { bgcolor: 'primary.100' },
                              p: '2px 20px',
                              backgroundColor: '#f0f6ff',
                              fontSize: '12px',
                              fontWeight: 'medium',
                              color: '#003fe0'
                            }}
                          >
                            Copy URL
                          </Button>
                        </Box>
                        <IconButton onClick={e => handleDesktopMenuOpen(e, claim)}>
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  {isMobile && (
                    <Collapse in={expandedCard === claimId}>
                      <Box
                        sx={{
                          mt: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        <Button
                          startIcon={<SVGHeart />}
                          endIcon={<SVGExport />}
                          onClick={e => handleRecommendationClick(claimId, e)}
                          fullWidth
                          sx={{
                            justifyContent: 'flex-start',
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.50' }
                          }}
                        >
                          Ask for a recommendation
                        </Button>
                        <Button
                          startIcon={<VisibilityIcon sx={{ color: 'primary.main' }} />}
                          endIcon={<SVGExport />}
                          onClick={e => handleViewClaimClick(claimId, e)}
                          fullWidth
                          sx={{
                            justifyContent: 'flex-start',
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.50' }
                          }}
                        >
                          View Claim
                        </Button>
                        <Button
                          startIcon={<SVGLinkedIn />}
                          endIcon={<SVGExport />}
                          fullWidth
                          sx={{
                            justifyContent: 'flex-start',
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.50' }
                          }}
                          onClick={() => handleLinkedInShare(claim)}
                        >
                          Share to LinkedIn
                        </Button>
                        <Button
                          startIcon={<SVGEmail />}
                          endIcon={<SVGExport />}
                          onClick={e => handleEmailShare(claim, e)}
                          fullWidth
                          sx={{
                            justifyContent: 'flex-start',
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.50' }
                          }}
                        >
                          Share via Email
                        </Button>
                        <Button
                          startIcon={<SVGCopy />}
                          onClick={e => handleCopyUrl(claimId, e)}
                          fullWidth
                          sx={{
                            justifyContent: 'flex-start',
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.50' }
                          }}
                        >
                          Copy URL
                        </Button>
                        <Button
                          startIcon={<DeleteIcon />}
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedClaim(claim)
                            setOpenDeleteDialog(true)
                          }}
                          fullWidth
                          sx={{
                            justifyContent: 'flex-start',
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.50' }
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Collapse>
                  )}
                </Paper>
              )
            } catch (error) {
              console.error('Error rendering claim:', error, claim)
              return (
                <Paper
                  key={`error-${index}`}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#ffebee',
                    border: '1px solid #f44336'
                  }}
                >
                  <Typography color='error'>
                    Error loading credential. Please refresh the page.
                  </Typography>
                </Paper>
              )
            }
          })}
        </Box>
      )}

      {/* Recommendations Section */}
      <Box sx={{ mt: 6 }}>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          sx={{
            fontWeight: 'bold',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <RecommendIcon sx={{ color: 'primary.main' }} />
          My Recommendations
        </Typography>

        {recommendations.length === 0 && !recommendationsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Typography variant='h6' color='text.secondary'>
              You haven&apos;t sent any recommendations yet.
            </Typography>
          </Box>
        )}

        {recommendationsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recommendations
              .filter(isValidRecommendation)
              .map((recommendation, index) => {
                try {
                  const recommendationId = getRecommendationId(recommendation)
                  return (
                    <Paper
                      key={recommendationId}
                      onClick={() => handleRecommendationCardClick(recommendationId)}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        cursor: isMobile ? 'pointer' : 'default',
                        border: '3px solid',
                        borderColor: isMobile ? getRandomBorderColor() : 'transparent',
                        bgcolor: 'background.paper',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        {isMobile ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RecommendIcon sx={{ color: '#22c55e' }} />
                            <Typography
                              variant='subtitle1'
                              sx={{
                                fontWeight: 600,
                                textDecoration: 'underline',
                                cursor: 'pointer'
                              }}
                              onClick={e => {
                                e.stopPropagation()
                                window.open(
                                  `${window.location.origin}/recommendations/${recommendationId}`,
                                  '_blank'
                                )
                              }}
                            >
                              {getRecommendationName(recommendation)}
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ mt: '5px' }}>
                                <RecommendIcon
                                  sx={{ color: '#22c55e', fontSize: '1.5rem' }}
                                />
                              </Box>
                              <Typography
                                sx={{
                                  fontWeight: 'bold',
                                  fontSize: '1.25rem',
                                  textDecoration: 'underline',
                                  cursor: 'pointer'
                                }}
                                onClick={e => {
                                  e.stopPropagation()
                                  window.open(
                                    `${window.location.origin}/recommendations/${recommendationId}`,
                                    '_blank'
                                  )
                                }}
                              >
                                {getRecommendationName(recommendation)}
                              </Typography>
                              <Typography
                                sx={{
                                  color: 'text.secondary',
                                  fontWeight: 'bold',
                                  fontSize: '1.25rem'
                                }}
                              >
                                {getTimeAgo(
                                  recommendation.issuanceDate || new Date().toISOString()
                                )}
                              </Typography>
                            </Box>
                            <Typography sx={{ color: 'text.secondary' }}>
                              Recommendation - {getRecommendationText(recommendation)} -{' '}
                              {getTimeDifference(
                                recommendation.issuanceDate || new Date().toISOString()
                              )}
                            </Typography>
                          </Box>
                        )}

                        {isMobile ? (
                          <IconButton
                            size='small'
                            onClick={e => {
                              e.stopPropagation()
                              handleRecommendationCardClick(recommendationId)
                            }}
                          >
                            <KeyboardArrowDownIcon
                              sx={{
                                transform:
                                  expandedRecommendation === recommendationId
                                    ? 'rotate(180deg)'
                                    : 'none',
                                transition: 'transform 0.3s'
                              }}
                            />
                          </IconButton>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                border: '1px solid',
                                borderColor: '#22c55e',
                                borderRadius: '100px',
                                overflow: 'hidden',
                                bgcolor: '#f0fdf4'
                              }}
                            >
                              <Button
                                onClick={e =>
                                  handleCopyRecommendationUrl(recommendationId, e)
                                }
                                startIcon={<ContentCopyIcon />}
                                sx={{
                                  bgcolor: '#dcfce7',
                                  borderColor: '#dcfce7',
                                  '&:hover': { bgcolor: '#bbf7d0' },
                                  p: '2px 20px',
                                  backgroundColor: '#dcfce7',
                                  fontSize: '12px',
                                  fontWeight: 'medium',
                                  color: '#166534'
                                }}
                              >
                                Copy URL
                              </Button>
                            </Box>
                            <IconButton
                              onClick={e =>
                                handleRecommendationMenuOpen(e, recommendation)
                              }
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                        )}
                      </Box>

                      {isMobile && (
                        <Collapse in={expandedRecommendation === recommendationId}>
                          <Box
                            sx={{
                              mt: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1
                            }}
                          >
                            <Button
                              startIcon={<ContentCopyIcon />}
                              endIcon={<SVGExport />}
                              onClick={e =>
                                handleCopyRecommendationUrl(recommendationId, e)
                              }
                              fullWidth
                              sx={{
                                justifyContent: 'flex-start',
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'primary.50' }
                              }}
                            >
                              Copy URL
                            </Button>
                            <Button
                              startIcon={<DeleteIcon />}
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedRecommendation(recommendation)
                                setOpenDeleteDialog(true)
                              }}
                              fullWidth
                              sx={{
                                justifyContent: 'flex-start',
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'primary.50' }
                              }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </Collapse>
                      )}
                    </Paper>
                  )
                } catch (error) {
                  console.error('Error rendering recommendation:', error, recommendation)
                  return (
                    <Paper
                      key={`error-recommendation-${index}`}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#ffebee',
                        border: '1px solid #f44336'
                      }}
                    >
                      <Typography color='error'>
                        Error loading recommendation. Please refresh the page.
                      </Typography>
                    </Paper>
                  )
                }
              })}
          </Box>
        )}
      </Box>

      {!isMobile && (
        <Menu
          anchorEl={desktopMenuAnchorEl}
          open={Boolean(desktopMenuAnchorEl)}
          onClose={handleDesktopMenuClose}
          PaperProps={{
            sx: {
              width: 320,
              mt: 1,
              borderRadius: 2
            }
          }}
        >
          <MenuItem
            onClick={e => {
              handleViewClaimClick(getClaimId(selectedClaim), e)
              handleDesktopMenuClose()
            }}
            sx={{ py: 1.5, gap: 2 }}
          >
            <VisibilityIcon sx={{ color: '#003fe0' }} />
            <Typography sx={{ textDecoration: 'underline', color: '#003fe0' }}>
              View Claim
            </Typography>
            <SVGExport />
          </MenuItem>
          <MenuItem
            onClick={e => {
              handleLinkedInShare(selectedClaim)
              handleDesktopMenuClose()
            }}
            sx={{ py: 1.5, gap: 2 }}
          >
            <SVGLinkedIn />
            <Typography sx={{ textDecoration: 'underline', color: '#003fe0' }}>
              Share to LinkedIn
            </Typography>
            <SVGExport />
          </MenuItem>
          <MenuItem
            onClick={e => {
              handleEmailShare(selectedClaim, e)
              handleDesktopMenuClose()
            }}
            sx={{ py: 1.5, gap: 2 }}
          >
            <SVGEmail />
            <Typography sx={{ textDecoration: 'underline', color: '#003fe0' }}>
              Share via Email
            </Typography>
            <SVGExport />
          </MenuItem>
          <MenuItem
            onClick={e => {
              handleCopyUrl(getClaimId(selectedClaim), e)
              handleDesktopMenuClose()
            }}
            sx={{ py: 1.5, gap: 2 }}
          >
            <SVGCopy />
            <Typography sx={{ textDecoration: 'underline', color: '#003fe0' }}>
              Copy URL
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setOpenDeleteDialog(true)
              handleDesktopMenuClose()
            }}
            sx={{ py: 1.5, gap: 2 }}
          >
            <SVGTrush />
            <Typography sx={{ textDecoration: 'underline', color: '#003fe0' }}>
              Delete
            </Typography>
          </MenuItem>
        </Menu>
      )}

      {/* Recommendation Menu */}
      {!isMobile && (
        <Menu
          anchorEl={recommendationMenuAnchorEl}
          open={Boolean(recommendationMenuAnchorEl)}
          onClose={handleRecommendationMenuClose}
          PaperProps={{
            sx: {
              width: 320,
              mt: 1,
              borderRadius: 2
            }
          }}
        >
          <MenuItem
            onClick={e => {
              handleCopyRecommendationUrl(getRecommendationId(selectedRecommendation), e)
              handleRecommendationMenuClose()
            }}
            sx={{ py: 1.5, gap: 2 }}
          >
            <ContentCopyIcon sx={{ color: '#22c55e' }} />
            <Typography sx={{ textDecoration: 'underline', color: '#22c55e' }}>
              Copy URL
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setOpenDeleteDialog(true)
              handleRecommendationMenuClose()
            }}
            sx={{ py: 1.5, gap: 2 }}
          >
            <DeleteIcon sx={{ color: '#dc2626' }} />
            <Typography sx={{ textDecoration: 'underline', color: '#dc2626' }}>
              Delete
            </Typography>
          </MenuItem>
        </Menu>
      )}

      <Dialog
        open={viewClaimDialogOpen}
        onClose={handleCloseViewClaimDialog}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant='h6' sx={{ fontWeight: 'bold', fontFamily: 'Lato' }}>
            Claim Details
          </Typography>
          <Button
            onClick={handleCloseViewClaimDialog}
            color='primary'
            sx={{
              color: 'primary.main',
              '&:hover': { bgcolor: 'primary.50' },
              fontWeight: 'bold',
              fontFamily: 'Lato'
            }}
          >
            Close
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {viewClaimId && <ViewClaimDialogContent fileID={viewClaimId} />}
        </DialogContent>
      </Dialog>

      {/* Modified Delete Dialog to handle both claims and recommendations */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'grey.900',
            maxWidth: '400px',
            width: '100%',
            m: 2
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Are you sure?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'grey.300' }}>
            You cannot recover deleted items and any links to this content will be broken.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            variant='outlined'
            fullWidth
            sx={{
              borderRadius: '100px',
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'primary.50'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={
              selectedRecommendation ? handleDeleteRecommendation : handleConfirmDelete
            }
            variant='contained'
            disabled={isDeleting}
            fullWidth
            sx={{
              borderRadius: '100px',
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            {isDeleting ? <CircularProgress size={24} /> : 'Yes, delete'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <LoadingOverlay text='Deleting...' open={showOverlappingCards} />
    </Box>
  )
}

export default ClaimsPageClient
