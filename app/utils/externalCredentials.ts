/**
 * Utility functions for handling external credentials
 */

/**
 * Extract the credential name from various possible locations
 * This matches the logic used in GenericCredentialViewer
 */
export function getCredentialName(credential: any): string {
  if (!credential) return 'Unnamed Credential'
  
  // Check root level name
  if (credential.name && typeof credential.name === 'string') {
    return credential.name
  }
  
  // Check credentialSubject.achievement (array format - native)
  const subject = credential.credentialSubject || {}
  if (Array.isArray(subject.achievement) && subject.achievement[0]?.name) {
    return subject.achievement[0].name
  }
  
  // Check credentialSubject.achievement (object format - OpenBadges)
  if (subject.achievement && !Array.isArray(subject.achievement) && subject.achievement.name) {
    return subject.achievement.name
  }
  
  // Check OpenBadges badge field
  if (credential.badge?.name) {
    return credential.badge.name
  }
  
  // Check credentialSubject.credentialName (some formats use this)
  if (subject.credentialName) {
    return subject.credentialName
  }
  
  // Check for degree/certificate specific fields
  if (subject.degree?.name) {
    return subject.degree.name
  }
  
  // Use credential type as last resort before unnamed
  const types = Array.isArray(credential.type) ? credential.type : [credential.type]
  const meaningfulType = types.find((t: string) => t !== 'VerifiableCredential' && t !== 'VerifiablePresentation')
  if (meaningfulType) {
    // Convert CamelCase to Title Case
    return meaningfulType.replace(/([A-Z])/g, ' $1').trim()
  }
  
  return 'Unnamed Credential'
}

export interface ExternalCredentialInfo {
  isExternal: boolean
  provider?: string
  format?: string
  canConvert?: boolean
}

/**
 * Check if the viewer can display this credential natively
 * This should match the logic in ComprehensiveClaimDetails.tsx
 */
export function canDisplayNatively(credentialData: any): boolean {
  if (!credentialData) return false
  
  const subject = credentialData.credentialSubject || {}
  
  // Check if it has our native fields that our viewer expects
  // Our native schema should have:
  // - credentialSubject.name (person's name)
  // - credentialSubject.credentialType (skill/volunteer/employment/etc)
  // - credentialSubject.achievement as an array
  
  const hasNativeName = typeof subject.name === 'string'
  const hasCredentialType = typeof subject.credentialType === 'string'
  const hasArrayAchievement = Array.isArray(subject.achievement)
  
  // If it has all our expected fields, we can display it natively
  return hasNativeName && hasCredentialType && hasArrayAchievement
}

/**
 * Analyze a credential to determine if it's external and get metadata
 */
export function analyzeCredential(credentialData: any): ExternalCredentialInfo {
  // If it's a VerifiablePresentation, extract the credential inside
  let credToCheck = credentialData
  if (credentialData.type?.includes('VerifiablePresentation') && credentialData.verifiableCredential?.[0]) {
    credToCheck = credentialData.verifiableCredential[0]
  }
  
  // Check if we can display it natively
  const canDisplay = canDisplayNatively(credToCheck)
  
  if (canDisplay) {
    return {
      isExternal: false,
      format: 'LinkedCreds Native'
    }
  }
  
  // Try to identify the provider based on common patterns
  let provider = 'Unknown'
  let format = 'Generic VC'
  let canConvert = false
  
  // Check for common credential formats
  if (credToCheck['@context']?.includes('https://www.w3.org/2018/credentials/v1')) {
    format = 'W3C Verifiable Credential'
  }
  
  // Check for OpenBadges
  if (credToCheck.type?.includes('OpenBadgeCredential') || 
      credToCheck['@context']?.includes('openbadges')) {
    provider = 'OpenBadges'
    format = 'OpenBadges v3'
    canConvert = true // We could potentially map OpenBadges to our format
  }
  
  // Check for BlockCerts
  if (credToCheck.type?.includes('BlockcertsCredential') ||
      credToCheck['@context']?.includes('blockcerts')) {
    provider = 'BlockCerts'
    format = 'BlockCerts'
    canConvert = true
  }
  
  // Check for other known providers by issuer patterns
  const issuer = credToCheck.issuer
  if (typeof issuer === 'string') {
    if (issuer.includes('credly')) provider = 'Credly'
    else if (issuer.includes('accredible')) provider = 'Accredible'
    else if (issuer.includes('badgr')) provider = 'Badgr'
  } else if (issuer?.id) {
    if (issuer.id.includes('credly')) provider = 'Credly'
    else if (issuer.id.includes('accredible')) provider = 'Accredible'
    else if (issuer.id.includes('badgr')) provider = 'Badgr'
  }
  
  return {
    isExternal: true,
    provider,
    format,
    canConvert
  }
}

/**
 * Convert external credential formats to our native format when possible
 * This allows external credentials to be displayed in our native viewer
 * instead of the generic credential viewer
 */
export function convertToNativeFormat(credentialData: any): any | null {
  const analysis = analyzeCredential(credentialData)
  
  if (!analysis.canConvert) {
    return null
  }
  
  // Extract the actual credential if it's wrapped in a presentation
  let credential = credentialData
  if (credentialData.type?.includes('VerifiablePresentation') && credentialData.verifiableCredential?.[0]) {
    credential = credentialData.verifiableCredential[0]
  }
  
  const credentialSubject = credential.credentialSubject || {}
  
  // Base conversion - ensure we have all required fields for native display
  const converted: any = {
    ...credential,
    credentialSubject: {
      ...credentialSubject,
      name: '', // Will be filled below
      credentialType: 'skill', // Default to skill
      achievement: [] // Must be an array for native viewer
    }
  }
  
  // Handle OpenBadges format
  if (analysis.format === 'OpenBadges v3') {
    // OpenBadges typically has achievement info at the credential level
    const achievement = credential.achievement || credential.badge || {}
    converted.credentialSubject.achievement = [{
      name: achievement.name || credentialSubject.achievement?.name || 'Imported Credential',
      description: achievement.description || credentialSubject.achievement?.description || '',
      criteria: {
        narrative: achievement.criteria?.narrative || achievement.description || ''
      }
    }]
    
    // Try to extract recipient name
    if (credentialSubject.name) {
      converted.credentialSubject.name = credentialSubject.name
    } else if (credentialSubject.recipient?.name) {
      converted.credentialSubject.name = credentialSubject.recipient.name
    } else if (credentialSubject.email) {
      // Use email as fallback
      converted.credentialSubject.name = credentialSubject.email
    }
  }
  
  // Handle BlockCerts format
  if (analysis.format === 'BlockCerts') {
    // BlockCerts structure is similar but may have different field names
    converted.credentialSubject.achievement = [{
      name: credentialSubject.achievement?.name || credential.name || 'Imported BlockCert',
      description: credentialSubject.achievement?.description || credential.description || '',
      criteria: {
        narrative: credentialSubject.achievement?.criteria || ''
      }
    }]
    
    // BlockCerts usually has recipient info
    if (credentialSubject.recipientProfile?.name) {
      converted.credentialSubject.name = credentialSubject.recipientProfile.name
    }
  }
  
  // Ensure we have a name field
  if (!converted.credentialSubject.name) {
    converted.credentialSubject.name = 'Unknown Recipient'
  }
  
  return converted
}

/**
 * Determine if a URL might have CORS issues
 */
export function mightHaveCORSIssues(url: string): boolean {
  try {
    const urlObj = new URL(url)
    
    // Same origin - no CORS
    if (typeof window !== 'undefined' && urlObj.origin === window.location.origin) {
      return false
    }
    
    // Known CORS-friendly domains
    const corsFriendlyDomains = [
      'raw.githubusercontent.com',
      'gist.githubusercontent.com',
      'jsonplaceholder.typicode.com',
      'api.github.com'
    ]
    
    if (corsFriendlyDomains.some(domain => urlObj.hostname.includes(domain))) {
      return false
    }
    
    // Google Drive direct download links usually work
    if (urlObj.hostname === 'drive.google.com' && urlObj.pathname.includes('/uc?export=download')) {
      return false
    }
    
    // Most other external URLs will have CORS issues
    return true
  } catch {
    return true
  }
}

/**
 * Get the best fetch strategy for a URL
 */
export function getFetchStrategy(url: string): 'direct' | 'proxy' | 'cors-proxy' {
  if (!mightHaveCORSIssues(url)) {
    return 'direct'
  }
  
  // For our own domains or localhost, use our proxy
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname.includes('linkedcreds'))) {
    return 'proxy'
  }
  
  // For other cases, use public CORS proxy as last resort
  return 'cors-proxy'
}
