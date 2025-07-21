// Helper functions for claims management

// Border colors for mobile cards
export const borderColors = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#22c55e',
  '#6366f1'
]

export const getRandomBorderColor = (): string => {
  return borderColors[Math.floor(Math.random() * borderColors.length)]
}

// Date formatting functions
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const getTimeAgo = (isoDateString: string): string => {
  const date = new Date(isoDateString)
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  return formatDate(date)
}

export const getTimeDifference = (isoDateString: string): string => {
  const date = new Date(isoDateString)
  if (isNaN(date.getTime())) {
    return '0 seconds'
  }

  const now = new Date()
  const diffInMilliseconds = now.getTime() - date.getTime()
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const months =
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())

  if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'}`
  if (diffInDays >= 30) return `${diffInDays} days`
  if (diffInDays > 0) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`
  if (diffInHours > 0) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}`
  if (diffInMinutes > 0)
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'}`
  return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'}`
}

// Credential helper functions
export const getCredentialName = (claim: any): string => {
  try {
    // Safety check for claim object
    if (!claim || typeof claim !== 'object') {
      console.warn('Invalid claim object:', claim)
      return 'Invalid Credential'
    }

    // Safety check for credentialSubject
    if (!claim.credentialSubject || typeof claim.credentialSubject !== 'object') {
      console.warn('Invalid credentialSubject:', claim.credentialSubject)
      return 'Unknown Credential'
    }

    const { credentialSubject } = claim

    // Handle new credential format (direct access)
    if (credentialSubject.employeeName) {
      return `Performance Review: ${credentialSubject.employeeJobTitle || 'Unknown Position'}`
    }
    if (credentialSubject.volunteerWork) {
      return `Volunteer: ${credentialSubject.volunteerWork}`
    }
    if (credentialSubject.role) {
      return `Employment: ${credentialSubject.role}`
    }
    if (credentialSubject.credentialName) {
      return credentialSubject.credentialName
    }

    // Handle old credential format (achievement array)
    if (
      credentialSubject.achievement &&
      Array.isArray(credentialSubject.achievement) &&
      credentialSubject.achievement.length > 0 &&
      credentialSubject.achievement[0] &&
      credentialSubject.achievement[0].name
    ) {
      return credentialSubject.achievement[0].name
    }

    // Fallback
    return 'Unknown Credential'
  } catch (error) {
    console.error('Error in getCredentialName:', error, claim)
    return 'Error Loading Credential'
  }
}

export const getCredentialType = (claim: any): string => {
  try {
    if (!claim || typeof claim !== 'object') {
      return 'Unknown'
    }

    const types = Array.isArray(claim.type) ? claim.type : []
    if (types.includes('EmploymentCredential')) return 'Employment'
    if (types.includes('VolunteeringCredential')) return 'Volunteer'
    if (types.includes('PerformanceReviewCredential')) return 'Performance Review'
    return 'Skill'
  } catch (error) {
    console.error('Error in getCredentialType:', error, claim)
    return 'Unknown'
  }
}

// Helper function to validate claim object
export const isValidClaim = (claim: any): boolean => {
  try {
    return (
      claim &&
      typeof claim === 'object' &&
      claim.id &&
      claim.credentialSubject &&
      typeof claim.credentialSubject === 'object'
    )
  } catch (error) {
    console.error('Error validating claim:', error, claim)
    return false
  }
}

// Safe helper to get claim ID
export const getClaimId = (claim: any): string => {
  try {
    if (claim?.id?.id) return claim.id.id
    if (claim?.id) return claim.id
    return 'unknown-id'
  } catch (error) {
    console.error('Error getting claim ID:', error, claim)
    return 'error-id'
  }
}

// Helper function to check if a credential is a skill credential
export const isSkillCredential = (claim: any): boolean => {
  try {
    // First validate the claim is valid
    if (!isValidClaim(claim)) {
      return false
    }

    // Check if it has the achievement array structure (skill credentials)
    return (
      claim.credentialSubject?.achievement &&
      Array.isArray(claim.credentialSubject.achievement) &&
      claim.credentialSubject.achievement.length > 0
    )
  } catch (error) {
    console.error('Error in isSkillCredential:', error, claim)
    return false
  }
}

// LinkedIn URL generation
export const generateLinkedInUrl = (claim: any): string => {
  try {
    const claimId = getClaimId(claim)
    const credentialName = getCredentialName(claim)
    const issuanceDate = new Date(claim.issuanceDate || new Date())
    const expirationDate = new Date(claim.expirationDate || new Date())
    const baseLinkedInUrl = 'https://www.linkedin.com/profile/add'
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: credentialName,
      organizationName: 'LinkedTrust',
      issueYear: issuanceDate.getFullYear().toString(),
      issueMonth: (issuanceDate.getMonth() + 1).toString(),
      expirationYear: expirationDate.getFullYear().toString(),
      expirationMonth: (expirationDate.getMonth() + 1).toString(),
      certUrl: `https://linkedcreds.allskillscount.org/view/${claimId}`,
      certId: claimId
    })
    return `${baseLinkedInUrl}?${params.toString()}`
  } catch (error) {
    console.error('Error generating LinkedIn URL:', error, claim)
    return 'https://www.linkedin.com/profile/add'
  }
}
