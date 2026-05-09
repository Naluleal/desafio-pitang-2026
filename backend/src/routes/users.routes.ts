import { Role } from '@prisma/client'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { AppError } from '../errors/app-error'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/require.role'
import { createUserSchema } from '../schemas/user.schema'

export const usersRoutes = Router()

usersRoutes.post('/', async (req, res) => {
  const result = createUserSchema.safeParse(req.body)

  if (!result.success) {
    throw new AppError(
      'Validation failed',
      400,
      'Bad Request',
      result.error.issues,
    )
  }

  const { name, email, password, role } = result.data

  const userWithSameEmail = await prisma.user.findUnique({
    where: { email },
  })

  if (userWithSameEmail) {
    throw new AppError('Email already in use', 409, 'Conflict')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  })

  const { password: _, ...userWithoutPassword } = user

  return res.status(201).json(userWithoutPassword)
})

usersRoutes.get('/', authenticate, requireRole(Role.ADMIN), async (req, res) => {
  const users = await prisma.user.findMany()

  const usersWithoutPassword = users.map(({ password, ...rest }) => rest)

  return res.json(usersWithoutPassword)
})
