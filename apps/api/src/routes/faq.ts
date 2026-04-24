import { Hono } from 'hono'
import { authMiddleware, type AuthVariables } from '../middleware/auth.js'
import { ok, err } from '../lib/response.js'
import { db } from '../db.js'

const faq = new Hono<{ Variables: AuthVariables }>()

/**
 * GET /faq
 * Public: returns all published FAQs (admin sees all)
 */
faq.get('/', async (c) => {
  try {
    const items = await db.faq.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return ok(c, items)
  } catch {
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat FAQ', 500)
  }
})

/**
 * POST /faq
 * Admin only: create a new FAQ entry
 */
faq.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  if (!['admin', 'super_admin'].includes(user.role)) {
    return err(c, 'FORBIDDEN', 'Akses ditolak', 403)
  }
  try {
    const body = await c.req.json()
    const { question, answer, category, isPublished = false } = body
    if (!question || !answer || !category) {
      return err(c, 'INVALID_INPUT', 'Pertanyaan, jawaban, dan kategori wajib diisi', 400)
    }
    const count = await db.faq.count()
    const item = await db.faq.create({
      data: { question, answer, category, isPublished, authorId: user.sub },
    })
    return ok(c, item)
  } catch {
    return err(c, 'INTERNAL_ERROR', 'Gagal membuat FAQ', 500)
  }
})

/**
 * PATCH /faq/:id
 * Admin only: update FAQ fields
 */
faq.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  if (!['admin', 'super_admin'].includes(user.role)) {
    return err(c, 'FORBIDDEN', 'Akses ditolak', 403)
  }
  try {
    const { id } = c.req.param()
    const body = await c.req.json()
    const { question, answer, category, isPublished } = body
    const item = await db.faq.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(category !== undefined && { category }),
        ...(isPublished !== undefined && { isPublished }),
      },
    })
    return ok(c, item)
  } catch {
    return err(c, 'INTERNAL_ERROR', 'Gagal memperbarui FAQ', 500)
  }
})

/**
 * DELETE /faq/:id
 * Admin only: delete a FAQ entry
 */
faq.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  if (!['admin', 'super_admin'].includes(user.role)) {
    return err(c, 'FORBIDDEN', 'Akses ditolak', 403)
  }
  try {
    const { id } = c.req.param()
    await db.faq.delete({ where: { id } })
    return ok(c, { id })
  } catch {
    return err(c, 'INTERNAL_ERROR', 'Gagal menghapus FAQ', 500)
  }
})

export default faq
