'use client'
import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Divider,
  Link,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import { SVGBadge, CheckMarkSVG } from '../../Assets/SVGs'

interface GenericCredentialViewerProps {
  credential: any
  qrCodeDataUrl?: string
  fileID?: string
}

const GenericCredentialViewer: React.FC<GenericCredentialViewerProps> = ({
  credential,
  qrCodeDataUrl,
  fileID
}) => {
  // Helper to safely get nested values
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj)
  }

  // Extract issuer information
  const getIssuerInfo = () => {
    if (typeof credential.issuer === 'string') {
      return { name: credential.issuer }
    }
    return credential.issuer || {}
  }

  // Extract subject information for OpenBadge credentials
  const getSubjectInfo = () => {
    const subject = credential.credentialSubject || {}
    
    // For OpenBadge credentials
    if (subject.achievement && !Array.isArray(subject.achievement)) {
      return {
        name: subject.id || 'Unknown Subject',
        achievement: subject.achievement,
        type: subject.type
      }
    }
    
    // For our native format
    if (subject.achievement && Array.isArray(subject.achievement)) {
      return {
        name: subject.name,
        achievement: subject.achievement[0],
        type: subject.type
      }
    }
    
    return subject
  }

  const issuer = getIssuerInfo()
  const subject = getSubjectInfo()
  const credentialTypes = Array.isArray(credential.type) ? credential.type : [credential.type]

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid #003FE0',
        borderRadius: '10px',
        position: 'relative'
      }}
    >
      {/* QR Code and View Source */}
      {fileID && qrCodeDataUrl && (
        <Box
          sx={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <Link
            href={`/api/credential-raw/${fileID}`}
            target='_blank'
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#003FE0',
              textDecoration: 'underline'
            }}
          >
            View Source
          </Link>
          <img
            src={qrCodeDataUrl}
            alt='QR Code for credential source'
            style={{ width: '120px', height: '120px' }}
          />
        </Box>
      )}

      {/* Credential Types */}
      <Box sx={{ mb: 2 }}>
        {credentialTypes.map((type: string, index: number) => (
          <Chip
            key={index}
            label={type}
            size="small"
            sx={{ mr: 1, mb: 1 }}
            color={type === 'VerifiableCredential' ? 'primary' : 'default'}
          />
        ))}
      </Box>

      {/* Main Credential Info */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center', mb: 2 }}>
          <SVGBadge />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {credential.name || subject.achievement?.name || 'Unnamed Credential'}
          </Typography>
        </Box>

        {credential.description && (
          <Typography sx={{ mb: 2 }}>
            {credential.description}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Issuer Information */}
      {issuer.name && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Issued By
          </Typography>
          <Typography>{issuer.name}</Typography>
          {issuer.url && (
            <Link href={issuer.url} target="_blank" sx={{ fontSize: '14px' }}>
              {issuer.url}
            </Link>
          )}
          {issuer.email && (
            <Typography sx={{ fontSize: '14px', color: 'text.secondary' }}>
              {issuer.email}
            </Typography>
          )}
        </Box>
      )}

      {/* Subject/Achievement Information */}
      {subject.achievement && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Achievement Details
          </Typography>
          
          {subject.achievement.name && (
            <Typography sx={{ fontWeight: 500, mb: 1 }}>
              {subject.achievement.name}
            </Typography>
          )}
          
          {subject.achievement.description && (
            <Typography sx={{ mb: 1 }}>
              {subject.achievement.description}
            </Typography>
          )}
          
          {subject.achievement.criteria && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontWeight: 500 }}>Criteria:</Typography>
              {typeof subject.achievement.criteria === 'string' ? (
                <Typography>{subject.achievement.criteria}</Typography>
              ) : (
                subject.achievement.criteria.narrative && (
                  <Typography>{subject.achievement.criteria.narrative}</Typography>
                )
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Dates */}
      <Box sx={{ mb: 3 }}>
        {credential.issuanceDate && (
          <Typography sx={{ fontSize: '14px', color: 'text.secondary' }}>
            Issued: {new Date(credential.issuanceDate).toLocaleDateString()}
          </Typography>
        )}
        {credential.expirationDate && (
          <Typography sx={{ fontSize: '14px', color: 'text.secondary' }}>
            Expires: {new Date(credential.expirationDate).toLocaleDateString()}
          </Typography>
        )}
      </Box>

      {/* Credential Status */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 3 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#000E40' }}>
          Credential Status
        </Typography>
        
        <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <Box sx={{ borderRadius: '4px', bgcolor: '#C2F1BE', p: '4px' }}>
            <CheckMarkSVG />
          </Box>
          <Typography>Has a valid digital signature</Typography>
        </Box>
        
        {credential.credentialStatus && (
          <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <Box sx={{ borderRadius: '4px', bgcolor: '#C2F1BE', p: '4px' }}>
              <CheckMarkSVG />
            </Box>
            <Typography>Has credential status information</Typography>
          </Box>
        )}
      </Box>

      {/* Raw JSON Preview (collapsed by default) */}
      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
          View Raw JSON
        </summary>
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: '#f5f5f5',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px'
          }}
        >
          <pre style={{ margin: 0, fontSize: '12px' }}>
            {JSON.stringify(credential, null, 2)}
          </pre>
        </Box>
      </details>
    </Paper>
  )
}

export default GenericCredentialViewer
