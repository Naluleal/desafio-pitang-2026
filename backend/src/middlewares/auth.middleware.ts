import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../errors/app-error'
import { prisma } from '../lib/prisma'

type TokenPayload = {
  sub: string
  role: string
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization

  if (!authorization) {
    return next(
      new AppError(
        'Authentication token is required',
        401,
        'Unauthorized',
      ),
    )
  }

  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return next(
      new AppError('Invalid authorization format', 401, 'Unauthorized'),
    )
  }

  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    return next(
      new AppError(
        'JWT secret is not configured',
        500,
        'Internal Server Error',
      ),
    )
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)

    if (typeof decoded === 'string' || !decoded.sub) {
      return next(new AppError('Invalid token', 401, 'Unauthorized'))
    }

    const payload = decoded as TokenPayload

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      return next(new AppError('Invalid token', 401, 'Unauthorized'))
    }

    req.user = user

    return next()
  } catch (error) {
    return next(
      new AppError('Invalid or expired token', 401, 'Unauthorized'),
    )
  }
}
