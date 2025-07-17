'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        router.push('/signup?error=auth_failed')
        return
      }

      if (data.session) {
        // Check if user has a school
        const { data: userData } = await supabase
          .from('users')
          .select('school_id, schools(slug)')
          .eq('id', data.session.user.id)
          .single()

        if (userData?.school_id) {
          // User has a school, redirect to dashboard
          router.push(`/${userData.schools[0]?.slug}/dashboard`)
        } else {
          // New user, redirect to create school
          router.push('/create-school')
        }
      } else {
        router.push('/signup')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}