'use client'

import { SessionProvider } from 'next-auth/react'
import React from 'react'

interface SessionWrapperProps {
  children: React.ReactNode
}

export default function SessionWrapper({ children }: SessionWrapperProps) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  )
} 