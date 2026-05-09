import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppError } from '../errors/app-error'
import { prisma } from '../lib/prisma'
import { loginSchema } from '../schemas/auth.schema'

export const authRoutes = Router()

authRoutes.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body)

  if (!result.success) {
    throw new AppError(
      'Validation failed',
      400,
      'Bad Request',
      result.error.issues,
    )
  }

  const { email, password } = result.data

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'Unauthorized')
  }

  const passwordMatches = await bcrypt.compare(password, user.password)

  if (!passwordMatches) {
    throw new AppError('Invalid credentials', 401, 'Unauthorized')
  }

  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    throw new AppError(
      'JWT secret is not configured',
      500,
      'Internal Server Error',
    )
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: '1d' },
  )

  const { password: _, ...userWithoutPassword } = user

  return res.json({
    token,
    user: userWithoutPassword,
  })
})
