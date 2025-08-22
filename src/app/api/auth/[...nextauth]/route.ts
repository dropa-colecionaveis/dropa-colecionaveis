import NextAuth from 'next-auth'

export const GET = async (req: Request, context: any) => {
  const { authOptions } = await import('@/lib/auth')
  const handler = NextAuth(authOptions)
  return handler(req, context)
}

export const POST = async (req: Request, context: any) => {
  const { authOptions } = await import('@/lib/auth')
  const handler = NextAuth(authOptions)
  return handler(req, context)
}