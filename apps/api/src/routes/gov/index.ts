// ── apps/api/src/routes/gov/index.ts ──
// Government routes index - mounts all gov sub-routers

import { Hono } from 'hono'
import govReports from './reports.js'
import govDashboard from './dashboard.js'
import govAnalytics from './analytics.js'
import govOfficers from './officers.js'
import govExport from './export.js'

const gov = new Hono()

// Mount all government sub-routers
gov.route('/reports', govReports)
gov.route('/dashboard', govDashboard)
gov.route('/analytics', govAnalytics)
gov.route('/officers', govOfficers)
gov.route('/export', govExport)

export default gov
