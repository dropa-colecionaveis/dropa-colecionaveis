import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface AdminInfo {
  isAdmin: boolean
  isSuperAdmin: boolean
  isLoading: boolean
  role: string | null
}

export const useAdmin = () => {
  const { data: session, status } = useSession()
  const [adminInfo, setAdminInfo] = useState({
    isAdmin: false,
    isSuperAdmin: false,
    loading: true,
    role: null as string | null
  })

  useEffect(() => {
    const fetchUserRole = async () => {
      if (status === 'loading') {
        setAdminInfo(prev => ({ ...prev, loading: true }))
        return
      }

      if (!session?.user?.id) {
        setAdminInfo({
          isAdmin: false,
          isSuperAdmin: false,
          loading: false,
          role: null
        })
        return
      }

      // First check if it's the legacy admin email (for backward compatibility)
      if (session.user.email === 'admin@admin.com') {
        setAdminInfo({
          isAdmin: true,
          isSuperAdmin: false,
          loading: false,
          role: 'ADMIN'
        })
        return
      }

      // Check for super admin email (for backward compatibility)
      if (session.user.email === 'superadmin@admin.com') {
        setAdminInfo({
          isAdmin: true,
          isSuperAdmin: true,
          loading: false,
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
            loading: false,
            role: userRole
          })
        } else {
          // Fallback to session data if API fails
          setAdminInfo({
            isAdmin: false,
            isSuperAdmin: false,
            loading: false,
            role: 'USER'
          })
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        setAdminInfo({
          isAdmin: false,
          isSuperAdmin: false,
          loading: false,
          role: 'USER'
        })
      }
    }

    fetchUserRole()
  }, [session, status])

  return adminInfo
}