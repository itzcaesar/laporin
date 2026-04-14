// ── apps/api/src/routes/gov/export.ts ──
// Export endpoints for PDF and Excel reports

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../../db.js'
import { authMiddleware, type AuthVariables } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'
import { exportQuerySchema } from '../../validators/gov.validator.js'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'

const govExport = new Hono<{ Variables: AuthVariables }>()

// All routes require officer role
govExport.use('*', authMiddleware, requireRole('officer'))

/**
 * GET /gov/export/pdf
 * Export reports to PDF
 */
govExport.get('/pdf', zValidator('query', exportQuerySchema), async (c) => {
  const user = c.get('user')
  const { reportIds, status, startDate, endDate, agencyId } = c.req.valid('query')

  try {
    // Build where clause
    const where: any = {}

    if (user.role !== 'super_admin' && user.agencyId) {
      where.agencyId = user.agencyId
    }

    if (reportIds) {
      where.id = { in: reportIds.split(',') }
    }

    if (status) where.status = status
    if (agencyId) where.agencyId = agencyId

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Get reports
    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to prevent huge PDFs
      include: {
        category: {
          select: {
            name: true,
            emoji: true,
          },
        },
        reporter: {
          select: {
            name: true,
          },
        },
        assignedOfficer: {
          select: {
            name: true,
            nip: true,
          },
        },
        agency: {
          select: {
            name: true,
          },
        },
      },
    })

    // Create PDF
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))

    // PDF Header
    doc
      .fontSize(20)
      .text('Laporan Laporin', { align: 'center' })
      .moveDown()
      .fontSize(12)
      .text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, { align: 'center' })
      .text(`Total Laporan: ${reports.length}`, { align: 'center' })
      .moveDown(2)

    // Reports
    reports.forEach((report: any, index: number) => {
      if (index > 0) {
        doc.addPage()
      }

      doc
        .fontSize(14)
        .text(`${report.trackingCode}`, { underline: true })
        .moveDown(0.5)

      doc
        .fontSize(10)
        .text(`Judul: ${report.title}`)
        .text(`Kategori: ${report.category.emoji} ${report.category.name}`)
        .text(`Status: ${report.status}`)
        .text(`Prioritas: ${report.priority}`)
        .text(`Pelapor: ${report.reporter?.name || 'Anonim'}`)
        .moveDown(0.5)

      doc
        .text(`Deskripsi:`)
        .fontSize(9)
        .text(report.description, { width: 500 })
        .moveDown(0.5)

      doc
        .fontSize(10)
        .text(`Lokasi: ${report.address}`)
        .text(`Koordinat: ${report.latitude}, ${report.longitude}`)
        .moveDown(0.5)

      if (report.assignedOfficer) {
        doc.text(`Petugas: ${report.assignedOfficer.name} (${report.assignedOfficer.nip})`)
      }

      if (report.agency) {
        doc.text(`Instansi: ${report.agency.name}`)
      }

      doc
        .text(`Dibuat: ${report.createdAt.toLocaleDateString('id-ID')}`)
        .text(`Upvotes: ${report.upvoteCount}`)
        .moveDown()
    })

    doc.end()

    // Wait for PDF to finish
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve())
    })

    const pdfBuffer = Buffer.concat(chunks)

    // Set headers
    c.header('Content-Type', 'application/pdf')
    c.header(
      'Content-Disposition',
      `attachment; filename="laporan-${Date.now()}.pdf"`
    )

    return c.body(pdfBuffer)
  } catch (error) {
    console.error('Export PDF error:', error)
    return c.json({ error: 'Failed to export PDF' }, 500)
  }
})

/**
 * GET /gov/export/excel
 * Export reports to Excel
 */
govExport.get('/excel', zValidator('query', exportQuerySchema), async (c) => {
  const user = c.get('user')
  const { reportIds, status, startDate, endDate, agencyId } = c.req.valid('query')

  try {
    // Build where clause
    const where: any = {}

    if (user.role !== 'super_admin' && user.agencyId) {
      where.agencyId = user.agencyId
    }

    if (reportIds) {
      where.id = { in: reportIds.split(',') }
    }

    if (status) where.status = status
    if (agencyId) where.agencyId = agencyId

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Get reports
    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000, // Excel can handle more rows
      include: {
        category: {
          select: {
            name: true,
            emoji: true,
          },
        },
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
        assignedOfficer: {
          select: {
            name: true,
            nip: true,
          },
        },
        agency: {
          select: {
            name: true,
          },
        },
      },
    })

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Laporan')

    // Define columns
    worksheet.columns = [
      { header: 'Kode Tracking', key: 'trackingCode', width: 20 },
      { header: 'Judul', key: 'title', width: 30 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Prioritas', key: 'priority', width: 12 },
      { header: 'Pelapor', key: 'reporter', width: 20 },
      { header: 'Email Pelapor', key: 'reporterEmail', width: 25 },
      { header: 'Deskripsi', key: 'description', width: 40 },
      { header: 'Alamat', key: 'address', width: 30 },
      { header: 'Latitude', key: 'latitude', width: 12 },
      { header: 'Longitude', key: 'longitude', width: 12 },
      { header: 'Petugas', key: 'officer', width: 20 },
      { header: 'NIP Petugas', key: 'officerNip', width: 20 },
      { header: 'Instansi', key: 'agency', width: 25 },
      { header: 'Upvotes', key: 'upvotes', width: 10 },
      { header: 'Tanggal Dibuat', key: 'createdAt', width: 18 },
      { header: 'Tanggal Selesai', key: 'completedAt', width: 18 },
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A3C6E' },
    }
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Add data
    reports.forEach((report: any) => {
      worksheet.addRow({
        trackingCode: report.trackingCode,
        title: report.title,
        category: `${report.category.emoji} ${report.category.name}`,
        status: report.status,
        priority: report.priority,
        reporter: report.reporter?.name || 'Anonim',
        reporterEmail: report.reporter?.email || '-',
        description: report.description,
        address: report.address,
        latitude: report.latitude,
        longitude: report.longitude,
        officer: report.assignedOfficer?.name || '-',
        officerNip: report.assignedOfficer?.nip || '-',
        agency: report.agency?.name || '-',
        upvotes: report.upvoteCount,
        createdAt: report.createdAt.toLocaleDateString('id-ID'),
        completedAt: report.completedAt
          ? report.completedAt.toLocaleDateString('id-ID')
          : '-',
      })
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Set headers
    c.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    c.header(
      'Content-Disposition',
      `attachment; filename="laporan-${Date.now()}.xlsx"`
    )

    return c.body(buffer)
  } catch (error) {
    console.error('Export Excel error:', error)
    return c.json({ error: 'Failed to export Excel' }, 500)
  }
})

/**
 * GET /gov/export/summary
 * Export summary statistics to PDF
 */
govExport.get('/summary', requireRole('admin'), async (c) => {
  const user = c.get('user')
  const { period = '30d' } = c.req.query()

  try {
    // Calculate date range
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
    const days = daysMap[period] || 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where: any = {
      createdAt: { gte: startDate },
    }

    if (user.role !== 'super_admin' && user.agencyId) {
      where.agencyId = user.agencyId
    }

    // Get statistics
    const totalReports = await db.report.count({ where })

    const statusCounts = await db.report.groupBy({
      by: ['status'],
      where,
      _count: true,
    })

    const categoryCounts = await db.report.groupBy({
      by: ['categoryId'],
      where,
      _count: true,
      orderBy: { _count: { categoryId: 'desc' } },
      take: 10,
    })

    const categories = await db.category.findMany({
      where: { id: { in: categoryCounts.map((c) => c.categoryId) } },
    })

    // Create PDF
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))

    // PDF Header
    doc
      .fontSize(20)
      .text('Ringkasan Statistik Laporin', { align: 'center' })
      .moveDown()
      .fontSize(12)
      .text(`Periode: ${period}`, { align: 'center' })
      .text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, { align: 'center' })
      .moveDown(2)

    // Total Reports
    doc.fontSize(14).text('Total Laporan', { underline: true }).moveDown(0.5)
    doc.fontSize(24).text(totalReports.toString(), { align: 'center' }).moveDown(2)

    // Status Breakdown
    doc.fontSize(14).text('Breakdown Status', { underline: true }).moveDown(0.5)
    statusCounts.forEach((item: any) => {
      doc.fontSize(10).text(`${item.status}: ${item._count}`)
    })
    doc.moveDown(2)

    // Top Categories
    doc.fontSize(14).text('Top 10 Kategori', { underline: true }).moveDown(0.5)
    categoryCounts.forEach((item: any) => {
      const category = categories.find((c: any) => c.id === item.categoryId)
      if (category) {
        doc.fontSize(10).text(`${category.emoji} ${category.name}: ${item._count}`)
      }
    })

    doc.end()

    // Wait for PDF to finish
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve())
    })

    const pdfBuffer = Buffer.concat(chunks)

    // Set headers
    c.header('Content-Type', 'application/pdf')
    c.header(
      'Content-Disposition',
      `attachment; filename="ringkasan-${Date.now()}.pdf"`
    )

    return c.body(pdfBuffer)
  } catch (error) {
    console.error('Export summary error:', error)
    return c.json({ error: 'Failed to export summary' }, 500)
  }
})

export default govExport
