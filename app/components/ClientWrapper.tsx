// This is a client component that gets the app DID and stores it in the context
'use client'
import { ReactNode, useEffect } from 'react'
import { getOrCreateAppInstanceDid } from '@cooperation/vc-storage'

export function ClientWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    ;(async () => {
      const did = await getOrCreateAppInstanceDid()
      console.log('App DID ready', did)
    })()
  }, [])

  return <>{children}</>
}
