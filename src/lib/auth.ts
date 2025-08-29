import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const { prisma } = await import('./prisma')
          
          if (!credentials?.email || !credentials?.password) {
            console.log('Credentials missing email or password')
            return null
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.log('User not found for email:', credentials.email)
            return null
          }

          if (!user.password) {
            console.log('User has no password (OAuth user):', credentials.email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email)
            return null
          }

          console.log('Successful authentication for:', credentials.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback:', { user, account, profile })
      
      if (account?.provider === 'google') {
        try {
          const { prisma } = await import('./prisma')
          
          if (!user.email) {
            console.error('No email provided by Google')
            return false
          }

          // Check if user exists in our database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!existingUser) {
            console.log('Creating new Google user:', user.email)
            // Create new user for Google OAuth
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email,
                // password: null for OAuth users (field is now optional)
                credits: 0, // Starting credits for new users
                providerAccountId: account.providerAccountId,
                provider: account.provider
              }
            })
            console.log('Google user created successfully')

            // Initialize user stats and track registration achievement for OAuth users
            try {
              const { userStatsService } = await import('./user-stats')
              await userStatsService.trackUserRegistration(newUser.id)
              console.log('Google user stats initialized and welcome achievement tracked')
            } catch (statsError) {
              console.error('Error initializing Google user stats:', statsError)
            }
          } else {
            console.log('Existing Google user found:', user.email)
          }

          return true
        } catch (error) {
          console.error('Error in Google signIn:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const { prisma } = await import('./prisma')
        
        // Get user from database to ensure we have the correct ID
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        
        if (dbUser) {
          token.id = dbUser.id
          token.email = dbUser.email
          token.name = dbUser.name || dbUser.email || 'User'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = (token.name as string) || ''
        
        // Update user activity on each session creation/refresh
        try {
          const { userStatsService } = await import('./user-stats')
          await userStatsService.updateUserActivity(session.user.id)
        } catch (error) {
          console.error('Error updating user activity on session:', error)
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin' // Redirect errors back to signin page
  },
  debug: process.env.NODE_ENV === 'development'
}

export default NextAuth(authOptions)