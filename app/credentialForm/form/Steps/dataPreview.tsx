/* eslint-disable @next/next/no-img-element */
'use client'

import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Typography, useMediaQuery, Theme } from '@mui/material'
import { FormData } from '../types/Types'
import {
  commonTypographyStyles,
  commonBoxStyles,
  evidenceListStyles
} from '../../../components/Styles/appStyles'
import { StepTrackShape } from '../fromTexts & stepTrack/StepTrackShape'

const cleanHTML = (htmlContent: string) => {
  return htmlContent
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p><\/p>/g, '')
    .replace(/<br>/g, '')
    .replace(/class="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
}

interface DataPreviewProps {
  formData: FormData
  selectedFiles: any[]
}

const DataPreview: React.FC<DataPreviewProps> = ({ formData, selectedFiles }) => {
  console.log(':  formData', formData)
  const theme: Theme = useTheme()
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('sm'))

  const handleNavigate = (url: string, target: string = '_self') => {
    window.open(url, target)
  }

  const hasValidEvidence = formData.portfolio?.some(
    (porto: { name: any; url: any }) => porto.name && porto.url
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <Typography
        sx={{
          fontFamily: 'Lato',
          fontSize: '24px',
          fontWeight: 400,
          textAlign: 'center'
        }}
      >
        Here’s what you’ve created!{' '}
      </Typography>
      <StepTrackShape />
      <Box
        sx={{
          width: '100%',
          bgcolor: '#FFF',
          borderRadius: '8px',
          border: '1px solid #003FE0',
          p: '10px',
          gap: '20px'
        }}
      >
        <Box sx={commonBoxStyles}>
          <Typography
            sx={{
              ...commonTypographyStyles,
              fontSize: '24px',
              fontWeight: 700
            }}
          >
            {formData.credentialName}
          </Typography>
          {formData.credentialDescription && (
            <Box sx={commonTypographyStyles}>
              <span
                dangerouslySetInnerHTML={{
                  __html: cleanHTML(formData.credentialDescription as any)
                }}
              />
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isLargeScreen ? 'row' : 'column',
            gap: isLargeScreen ? '20px' : '10px',
            mb: '10px'
          }}
        >
          {formData?.evidenceLink ? (
            <img
              style={{
                borderRadius: '20px',
                width: !isLargeScreen ? '100%' : '179px',
                height: '100%'
              }}
              src={selectedFiles.filter(f => f.isFeatured)[0]?.url}
              alt='Certification Evidence'
            />
          ) : (
            <Box sx={{ width: !isLargeScreen ? '100%' : '179px', height: '100%' }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Typography sx={commonTypographyStyles}>
            <span
              dangerouslySetInnerHTML={{
                __html: cleanHTML(formData?.description as any)
              }}
            />
          </Typography>
          {formData.credentialDuration && (
            <Typography sx={{ ...commonTypographyStyles, fontSize: '13px' }}>
              Duration:
              <br />
              <ul>
                <li style={{ marginLeft: '20px', width: 'fit-content' }}>
                  {formData.credentialDuration}
                </li>
              </ul>
            </Typography>
          )}

          {hasValidEvidence && (
            <Box sx={commonTypographyStyles}>
              <Typography sx={{ display: 'block' }}>Evidence:</Typography>
              <ul style={evidenceListStyles}>
                {formData.portfolio.map(
                  (porto: {
                    name:
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
                      | Iterable<React.ReactNode>
                      | React.ReactPortal
                      | Promise<React.AwaitedReactNode>
                      | null
                      | undefined
                    url: React.Key | null | undefined
                  }) =>
                    porto.name &&
                    porto.url && (
                      <li
                        style={{ cursor: 'pointer', width: 'fit-content' }}
                        key={porto.url}
                        onClick={() => handleNavigate(porto.url as string, '_blank')}
                      >
                        {porto.name}
                      </li>
                    )
                )}
              </ul>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default DataPreview
