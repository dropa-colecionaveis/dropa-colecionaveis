import NextAuth from 'next-auth'

const handler = async (req: Request, context: any) => {
  const { authOptions } = await import('@/lib/auth')
  return NextAuth(authOptions)(req, context)
}

export { handler as GET, handler as POST }