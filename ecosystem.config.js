// PM2 Ecosystem Configuration
// For production deployment with PM2

module.exports = {
  apps: [
    {
      name: 'colecionaveis-production',
      script: 'npm',
      args: 'start',
      cwd: '/opt/colecionaveis',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_staging: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Logging
      log_file: '/var/log/colecionaveis/combined.log',
      out_file: '/var/log/colecionaveis/out.log',
      error_file: '/var/log/colecionaveis/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      
      // Health monitoring
      health_check_http: true,
      health_check_grace_period: 3000,
      
      // Environment-specific overrides
      node_args: '--max-old-space-size=2048',
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Source map support for better error reporting
      source_map_support: true,
      
      // Graceful shutdown
      shutdown_with_message: true,
      wait_ready: true
    },
    {
      name: 'colecionaveis-staging',
      script: 'npm',
      args: 'start',
      cwd: '/opt/colecionaveis-staging',
      instances: 1,
      exec_mode: 'fork',
      env_staging: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: '/var/log/colecionaveis-staging/combined.log',
      out_file: '/var/log/colecionaveis-staging/out.log',
      error_file: '/var/log/colecionaveis-staging/error.log',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/colecionaveis-platform.git',
      path: '/opt/colecionaveis',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --only=production && npm run build && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production && pm2 save',
      'pre-setup': 'apt update && apt install git -y'
    },
    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/colecionaveis-platform.git',
      path: '/opt/colecionaveis-staging',
      'post-deploy': 'npm ci && npm run build && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env staging && pm2 save'
    }
  }
}