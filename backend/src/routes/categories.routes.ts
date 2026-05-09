import { Role } from '@prisma/client'
import { Router } from 'express'
import { AppError } from '../errors/app-error'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/require.role'
import {
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/category.schema'

export const categoriesRoutes = Router()

categoriesRoutes.get('/', authenticate, async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })

  return res.json(categories)
})

categoriesRoutes.post(
  '/',
  authenticate,
  requireRole(Role.ADMIN),
  async (req, res) => {
    const result = createCategorySchema.safeParse(req.body)

    if (!result.success) {
      throw new AppError(
        'Validation failed',
        400,
        'Bad Request',
        result.error.issues,
      )
    }

    const category = await prisma.category.create({
      data: {
        name: result.data.name,
      },
    })

    return res.status(201).json(category)
  },
)

categoriesRoutes.put(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  async (req, res) => {
    const result = updateCategorySchema.safeParse(req.body)

    if (!result.success) {
      throw new AppError(
        'Validation failed',
        400,
        'Bad Request',
        result.error.issues,
      )
    }

    const { id } = req.params

    if (typeof id !== 'string') {
      throw new AppError('Invalid category id')
    }

    const category = await prisma.category.findUnique({
      where: { id },
    })

    if (!category) {
      throw new AppError('Category not found', 404, 'Not Found')
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: result.data,
    })

    return res.json(updatedCategory)
  },
)

categoriesRoutes.delete(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  async (req, res) => {
    const { id } = req.params

    if (typeof id !== 'string') {
      throw new AppError('Invalid category id')
    }

    const category = await prisma.category.findUnique({
      where: { id },
    })

    if (!category) {
      throw new AppError('Category not found', 404, 'Not Found')
    }

    const deletedCategory = await prisma.category.update({
      where: { id },
      data: {
        isActive: false,
      },
    })

    return res.json(deletedCategory)
  },
)
