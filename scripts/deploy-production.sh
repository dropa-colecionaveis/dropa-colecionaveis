#!/bin/bash

# Production Deployment Script
echo "🚀 Starting Production Deployment..."

# Set production environment
export NODE_ENV=production

# Validate environment before deployment
echo "🔍 Validating production environment..."
node scripts/validate-env.js

if [ $? -ne 0 ]; then
    echo "❌ Environment validation failed. Deployment aborted."
    exit 1
fi

# Build application for production
echo "🏗️ Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Deployment aborted."
    exit 1
fi

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed. Deployment aborted."
    exit 1
fi

# Start application
echo "✅ Starting production server..."
npm start

echo "🎉 Production deployment completed successfully!"