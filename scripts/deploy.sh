#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

print_status "Deploying to: $ENVIRONMENT"
print_status "Project directory: $PROJECT_DIR"

# Check if we're in the right directory
if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
    print_error "package.json not found. Are you in the right directory?"
    exit 1
fi

# Check if environment file exists
ENV_FILE="$PROJECT_DIR/.env.$ENVIRONMENT"
if [[ ! -f "$ENV_FILE" ]]; then
    print_error "Environment file not found: $ENV_FILE"
    print_error "Copy .env.example to .env.$ENVIRONMENT and configure it first"
    exit 1
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if required environment variables are set
source "$ENV_FILE"

required_vars=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "MERCADO_PAGO_ACCESS_TOKEN"
    "BACKUP_ENCRYPTION_KEY"
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        print_error "Required environment variable $var is not set in $ENV_FILE"
        exit 1
    fi
done

print_success "Environment variables validated"

# Install dependencies
print_status "Installing dependencies..."
cd "$PROJECT_DIR"
npm ci --only=production

# Build application
print_status "Building application..."
npm run build

# Database migrations (if using Prisma)
print_status "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Create backup before deployment
if [[ "$ENVIRONMENT" == "production" ]]; then
    print_status "Creating pre-deployment backup..."
    node scripts/backup.js
fi

# Copy environment file
print_status "Setting up environment configuration..."
cp "$ENV_FILE" "$PROJECT_DIR/.env"

# Set up directory structure
print_status "Setting up directory structure..."
mkdir -p "$PROJECT_DIR/backups"
mkdir -p "$PROJECT_DIR/logs"

# Set permissions (if running as root or with sudo)
if [[ $EUID -eq 0 ]]; then
    print_status "Setting file permissions..."
    chown -R www-data:www-data "$PROJECT_DIR"
    chmod -R 755 "$PROJECT_DIR"
    chmod -R 700 "$PROJECT_DIR/backups"
    chmod 600 "$PROJECT_DIR/.env"
fi

# Security checks
print_status "Running security checks..."

# Check for exposed secrets
if grep -r "password\|secret\|key" "$PROJECT_DIR/src" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "\.env" | grep -v "type.*:" | grep -v "interface" | grep -v "\/\/" | grep -v "import"; then
    print_warning "Potential hardcoded secrets found in source code. Please review."
fi

# Verify SSL certificate (for production)
if [[ "$ENVIRONMENT" == "production" ]]; then
    DOMAIN=$(echo "$NEXTAUTH_URL" | sed 's|https\?://||' | sed 's|/.*||')
    if command -v openssl &> /dev/null; then
        print_status "Checking SSL certificate for $DOMAIN..."
        if ! openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -dates; then
            print_warning "Could not verify SSL certificate for $DOMAIN"
        fi
    fi
fi

# Start services (example for PM2)
if command -v pm2 &> /dev/null; then
    print_status "Managing services with PM2..."
    
    # Stop existing instance
    pm2 stop "colecionaveis-$ENVIRONMENT" 2>/dev/null || true
    
    # Start new instance
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"
    
    # Save PM2 configuration
    pm2 save
else
    print_warning "PM2 not found. Please start the application manually."
fi

# Health check
print_status "Performing health check..."
sleep 10

HEALTH_URL="$NEXTAUTH_URL/api/health"
if command -v curl &> /dev/null; then
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        print_success "Health check passed"
    else
        print_error "Health check failed. Please check application logs."
        exit 1
    fi
else
    print_warning "curl not found. Please manually verify application is running."
fi

# Setup cron jobs for backups (production only)
if [[ "$ENVIRONMENT" == "production" ]]; then
    print_status "Setting up backup cron job..."
    
    CRON_JOB="0 2 * * * cd $PROJECT_DIR && node scripts/backup.js >> /var/log/colecionaveis-backup.log 2>&1"
    
    if ! crontab -l 2>/dev/null | grep -q "scripts/backup.js"; then
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        print_success "Backup cron job installed"
    else
        print_success "Backup cron job already exists"
    fi
fi

# Cleanup
print_status "Cleaning up..."
rm -rf "$PROJECT_DIR/node_modules/.cache"
rm -rf "$PROJECT_DIR/.next/cache"

# Final checks
print_status "Running final checks..."

# Check disk space
DISK_USAGE=$(df "$PROJECT_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [[ $DISK_USAGE -gt 90 ]]; then
    print_warning "Disk usage is high: ${DISK_USAGE}%. Consider cleanup."
fi

# Check memory usage
if command -v free &> /dev/null; then
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [[ $MEMORY_USAGE -gt 90 ]]; then
        print_warning "Memory usage is high: ${MEMORY_USAGE}%"
    fi
fi

print_success "Deployment to $ENVIRONMENT completed successfully!"

echo ""
echo "📋 POST-DEPLOYMENT CHECKLIST:"
echo "1. ✅ Verify application is accessible at $NEXTAUTH_URL"
echo "2. ✅ Test user registration and login"
echo "3. ✅ Test payment functionality"
echo "4. ✅ Verify email notifications are working"
echo "5. ✅ Check security logs: $NEXTAUTH_URL/api/admin/security-logs"
echo "6. ✅ Verify backup system is running"
echo "7. ✅ Monitor application logs for errors"
echo ""

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "🔒 SECURITY REMINDERS:"
    echo "- Change default admin credentials"
    echo "- Review and update security headers"
    echo "- Monitor rate limiting effectiveness"
    echo "- Schedule regular security audits"
    echo ""
fi

print_success "Deployment script completed!"