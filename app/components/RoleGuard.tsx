'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getCurrentProfile,
  type UserRole,
} from '../../lib/authRole'

export default function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: UserRole[]
}) {
  const router = useRouter()

  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkRole()
  }, [])

  async function checkRole() {
    const profile = await getCurrentProfile()

    if (!profile) {
      router.replace('/login')
      return
    }

    if (!profile.is_active) {
      router.replace('/profile')
      return
    }

    if (!allowedRoles.includes(profile.role)) {
      router.replace('/')
      return
    }

    setChecking(false)
  }

  if (checking) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f4f6fa',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Checking permission...
      </main>
    )
  }

  return <>{children}</>
}