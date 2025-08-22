#!/bin/bash

echo "🔄 Starting Vercel build with database migration..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migration/push
echo "📤 Pushing schema to database..."
npx prisma db push --accept-data-loss

# Build the Next.js application
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"