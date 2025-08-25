import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface AdminInfo {
  isAdmin: boolean
  isSuperAdmin: boolean
  isLoading: boolean
  role: string | null
}

export const useAdmin = (): AdminInfo => {
  const { data: session, status } = useSession()
  const [adminInfo, setAdminInfo] = useState<AdminInfo>({
    isAdmin: false,
    isSuperAdmin: false,
    isLoading: true,
    role: null
  })

  useEffect(() => {
    const fetchUserRole = async () => {
      if (status === 'loading') {
        setAdminInfo(prev => ({ ...prev, isLoading: true }))
        return
      }

      if (!session?.user?.id) {
        setAdminInfo({
          isAdmin: false,
          isSuperAdmin: false,
          isLoading: false,
          role: null
        })
        return
      }

      // First check if it's the legacy admin email (for backward compatibility)
      if (session.user.email === 'admin@admin.com') {
        setAdminInfo({
          isAdmin: true,
          isSuperAdmin: false,
          isLoading: false,
          role: 'ADMIN'
        })
        return
      }

      // Check for super admin email (for backward compatibility)
      if (session.user.email === 'superadmin@admin.com') {
        setAdminInfo({
          isAdmin: true,
          isSuperAdmin: true,
          isLoading: false,
          role: 'SUPER_ADMIN'
        })
        return
      }

      try {
        // Fetch user role from API
        const response = await fetch(`/api/user/${session.user.id}`)
        if (response.ok) {
          const userData = await response.json()
          const userRole = userData.role || 'USER'
          
          const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole)
          const isSuperAdmin = userRole === 'SUPER_ADMIN'

          setAdminInfo({
            isAdmin,
            isSuperAdmin,
            isLoading: false,
            role: userRole
          })
        } else {
          // Fallback to session data if API fails
          setAdminInfo({
            isAdmin: false,
            isSuperAdmin: false,
            isLoading: false,
            role: 'USER'
          })
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        setAdminInfo({
          isAdmin: false,
          isSuperAdmin: false,
          isLoading: false,
          role: 'USER'
        })
      }
    }

    fetchUserRole()
  }, [session, status])

  return adminInfo
}