// ── ecosystem.config.cjs ──
// PM2 Process Manager Configuration for Laporin
// Usage: pm2 start ecosystem.config.cjs
//        pm2 reload ecosystem.config.cjs
//        pm2 stop ecosystem.config.cjs

module.exports = {
  apps: [
    // ── Frontend (Next.js) ──────────────────────────────
    {
      name: 'laporin-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://api.laporin.site',
      },

      // Process management
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: '512M',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/laporin/logs/web-error.log',
      out_file: '/var/www/laporin/logs/web-out.log',
      merge_logs: true,
      log_type: 'json',
    },

    // ── Backend (Hono API) ──────────────────────────────
    {
      name: 'laporin-api',
      cwd: './apps/api',
      script: 'dist/src/index.js',
      interpreter: 'node',
      interpreter_args: '--enable-source-maps',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },

      // Process management
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: '512M',

      // Graceful shutdown
      kill_timeout: 10000,
      wait_ready: false,
      listen_timeout: 10000,

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/laporin/logs/api-error.log',
      out_file: '/var/www/laporin/logs/api-out.log',
      merge_logs: true,
      log_type: 'json',
    },
  ],
}
