import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Container,
  styled,
  Card,
  CardContent,
  Divider
} from '@mui/material'
import { FormData } from '../../credentialForm/form/types/Types'
import { Logo } from '../../Assets/SVGs'
import Image from 'next/image'
import { commonTypographyStyles, evidenceListStyles } from '../Styles/appStyles'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'

// Set up PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

// Helper functions for file type detection
const isPDF = (fileName: string) => fileName.toLowerCase().endsWith('.pdf')
const isMP4 = (fileName: string) => fileName.toLowerCase().endsWith('.mp4')
const isGoogleDriveImageUrl = (url: string): boolean => {
  return /https:\/\/drive\.google\.com\/uc\?export=view&id=.+/.test(url)
}

// PDF thumbnail generation
const renderPDFThumbnail = async (fileUrl: string): Promise<string> => {
  try {
    const loadingTask = getDocument({ url: fileUrl })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not get 2D context')

    canvas.height = viewport.height
    canvas.width = viewport.width
    await page.render({ canvasContext: context, viewport }).promise
    return canvas.toDataURL()
  } catch (error) {
    console.error('Error rendering PDF thumbnail:', error)
    return '/fallback-pdf-thumbnail.svg'
  }
}

// Video thumbnail generation
const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.src = videoUrl
    video.addEventListener(
      'loadeddata',
      () => {
        video.currentTime = 1
      },
      { once: true }
    )
    video.addEventListener(
      'seeked',
      () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get 2D canvas context'))
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataURL = canvas.toDataURL('image/png')
        resolve(dataURL)
      },
      { once: true }
    )

    video.addEventListener('error', e => {
      reject(e)
    })
  })
}

// Styled components
const HeaderContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: '720px',
  padding: theme.breakpoints.down('sm') ? '18px' : '30px',
  borderRadius: '20px 20px 0 0',
  borderLeft: '1px solid #d1e4ff',
  borderRight: '1px solid #d1e4ff',
  borderBottom: '1px solid #d1e4ff',
  display: 'flex',
  alignItems: 'center'
}))

const MainContentContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '720px',
  padding: theme.breakpoints.down('sm') ? '24px 8px' : '45px 30px',
  backgroundColor: '#87abe4',
  borderRadius: '0 0 20px 20px',
  borderTop: '1px solid #d1e4ff',
  borderLeft: '1px solid #d1e4ff',
  borderRight: '1px solid #d1e4ff',
  margin: '0 auto'
}))

const SkillCard = styled(Card)(({ theme }) => ({
  padding: theme.breakpoints.down('sm') ? '10px 8px' : '15px 30px',
  backgroundColor: '#fff',
  borderRadius: '10px',
  border: '1px solid #003fe0',
  width: '100%'
}))

const FieldLabel = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter',
  fontSize: theme.breakpoints.down('sm') ? '14px' : '16px',
  fontWeight: 700,
  lineHeight: '24px',
  color: '#000e40',
  letterSpacing: '0.08px'
}))

const FieldValue = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter',
  fontSize: theme.breakpoints.down('sm') ? '14px' : '16px',
  fontWeight: 400,
  lineHeight: '24px',
  color: '#6b7280',
  letterSpacing: '0.08px',
  wordBreak: 'break-word',
  whiteSpace: 'pre-line',
  overflowWrap: 'anywhere'
}))

const MediaContainer = styled(Box)(({ theme }) => ({
  height: theme.breakpoints.down('sm') ? '120px' : '180px',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column'
}))

const Media = styled(Box)<{ hasImage?: boolean }>(({ hasImage, theme }) => ({
  width: theme.breakpoints.down('sm') ? '100px' : '160.506px',
  height: theme.breakpoints.down('sm') ? '90px' : '153.129px',
  position: 'relative',
  backgroundImage: hasImage ? 'none' : 'url(/images/SkillMedia.svg)',
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  overflow: 'hidden',
  margin: '0 auto'
}))

// Field component for consistent styling
interface FieldProps {
  label: string
  value?: string
  isHtml?: boolean
}

const Field: React.FC<FieldProps> = ({ label, value, isHtml }) => (
  <Box sx={{ mb: 2.5 }}>
    <FieldLabel>{label}</FieldLabel>
    {isHtml && value ? (
      <FieldValue>
        <span dangerouslySetInnerHTML={{ __html: value }} />
      </FieldValue>
    ) : (
      <FieldValue>{value || 'To be completed...'}</FieldValue>
    )}
  </Box>
)

interface CredentialTrackerProps {
  formData?: FormData
  selectedFiles?: {
    id: string
    name: string
    url: string
    isFeatured?: boolean
  }[]
}

const CredentialTracker: React.FC<CredentialTrackerProps> = ({
  formData,
  selectedFiles = []
}) => {
  const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({})
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})

  // Generate thumbnails for PDF and video files
  useEffect(() => {
    selectedFiles.forEach(async file => {
      if (isPDF(file.name) && !pdfThumbnails[file.id]) {
        const thumbnail = await renderPDFThumbnail(file.url)
        setPdfThumbnails(prev => ({ ...prev, [file.id]: thumbnail }))
      }

      if (isMP4(file.name) && !videoThumbnails[file.id]) {
        try {
          const thumbnail = await generateVideoThumbnail(file.url)
          setVideoThumbnails(prev => ({ ...prev, [file.id]: thumbnail }))
        } catch (error) {
          console.error('Error generating video thumbnail:', error)
          setVideoThumbnails(prev => ({
            ...prev,
            [file.id]: '/fallback-video.png'
          }))
        }
      }
    })
  }, [selectedFiles, pdfThumbnails, videoThumbnails])

  // Helper for Evidence section
  const shouldDisplayUrl = (url: string): boolean => {
    return !isGoogleDriveImageUrl(url)
  }
  const handleNavigate = (url: string, target: string = '_blank') => {
    window.open(url, target)
  }
  const hasValidEvidence =
    (formData?.portfolio &&
      Array.isArray(formData.portfolio) &&
      formData.portfolio.some((p: any) => p.name && p.url)) ||
    (formData?.evidenceLink && shouldDisplayUrl(formData.evidenceLink))

  // Get featured media file
  const featuredFile = selectedFiles.find(f => f.isFeatured)

  return (
    <Box sx={{ p: 0, width: '100%', maxWidth: { xs: '100%', md: '720px' } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Section */}
        <HeaderContainer elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Logo />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                variant='h5'
                sx={{
                  fontFamily: 'Lato',
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: '38px',
                  color: '#202e5b'
                }}
              >
                Here&apos;s what you&apos;re building
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Inter',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '24px',
                  color: '#202e5b',
                  letterSpacing: '0.08px'
                }}
              >
                {formData?.fullName || 'User'} - just now
              </Typography>
            </Box>
          </Box>
        </HeaderContainer>

        {/* Main Content Section */}
        <MainContentContainer>
          <Box sx={{ width: '100%', mb: 6 }}>
            <SkillCard>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Field label='Skill Name' value={formData?.credentialName} />
                  <Field
                    label='Skill Description'
                    value={formData?.credentialDescription as string}
                    isHtml={true}
                  />
                  {/* Enhanced Media Section with PDF support */}
                  <MediaContainer>
                    <Media hasImage={!!featuredFile || !!formData?.evidenceLink}>
                      {featuredFile ? (
                        // Handle different file types with proper thumbnails
                        <>
                          {isPDF(featuredFile.name) ? (
                            <Image
                              width={160}
                              height={153}
                              style={{
                                borderRadius: '10px',
                                objectFit: 'cover'
                              }}
                              src={
                                pdfThumbnails[featuredFile.id] ??
                                '/fallback-pdf-thumbnail.svg'
                              }
                              alt='PDF Preview'
                            />
                          ) : isMP4(featuredFile.name) ? (
                            <Image
                              width={160}
                              height={153}
                              style={{
                                borderRadius: '10px',
                                objectFit: 'cover'
                              }}
                              src={
                                videoThumbnails[featuredFile.id] ?? '/fallback-video.png'
                              }
                              alt='Video Thumbnail'
                            />
                          ) : (
                            <Image
                              src={featuredFile.url}
                              alt='Featured Media'
                              width={160}
                              height={153}
                              style={{
                                borderRadius: '10px',
                                objectFit: 'cover'
                              }}
                            />
                          )}
                        </>
                      ) : formData?.evidenceLink ? (
                        <Image
                          src={formData.evidenceLink}
                          alt='Featured Media'
                          width={160}
                          height={153}
                          style={{
                            borderRadius: '10px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <Image
                          src='/images/SkillMedia.svg'
                          alt='Media placeholder'
                          width={160}
                          height={153}
                          style={{
                            borderRadius: '10px',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                    </Media>
                    <Typography
                      sx={{
                        fontFamily: 'Inter',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '24px',
                        color: '#6b7280',
                        letterSpacing: '0.08px',
                        mt: 1
                      }}
                    >
                      Media (optional)
                    </Typography>
                  </MediaContainer>

                  {/* Evidence Section (matches dataPreview.tsx) */}
                  {hasValidEvidence && (
                    <Box sx={commonTypographyStyles}>
                      <FieldLabel sx={{ display: 'block' }}>
                        Supporting Documentation:
                      </FieldLabel>
                      <ul style={evidenceListStyles}>
                        {formData.evidenceLink &&
                          shouldDisplayUrl(formData.evidenceLink) && (
                            <li
                              style={{
                                cursor: 'pointer',
                                width: 'fit-content',
                                color: '#003fe0',
                                textDecoration: 'underline'
                              }}
                              key={formData.evidenceLink}
                              onClick={() =>
                                handleNavigate(formData.evidenceLink, '_blank')
                              }
                            >
                              {formData.evidenceLink}
                            </li>
                          )}
                        {Array.isArray(formData.portfolio) &&
                          formData.portfolio.map(
                            (porto: { name: string; url: string }) =>
                              porto.name &&
                              porto.url && (
                                <li
                                  style={{
                                    cursor: 'pointer',
                                    width: 'fit-content',
                                    color: '#003fe0',
                                    textDecoration: 'underline'
                                  }}
                                  key={porto.url}
                                  onClick={() => handleNavigate(porto.url, '_blank')}
                                >
                                  {porto.name || porto.url}
                                </li>
                              )
                          )}
                      </ul>
                    </Box>
                  )}

                  <Field
                    label='Earning Criteria'
                    value={formData?.description as string}
                    isHtml={true}
                  />
                  <Field label='Duration' value={formData?.credentialDuration} />
                </Box>
              </CardContent>
            </SkillCard>
          </Box>
        </MainContentContainer>
      </Box>
    </Box>
  )
}

export default CredentialTracker
