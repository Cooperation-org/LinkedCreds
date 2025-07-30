'use client'
import { useEffect } from 'react'
import { getOrCreateAppInstanceDid } from '@cooperation/vc-storage'

export default function AppDidInitializer() {
  useEffect(() => {
    ;(async () => {
      const did = await getOrCreateAppInstanceDid()
      console.log('App DID ready', did)
    })()
  }, [])

  return null
}
