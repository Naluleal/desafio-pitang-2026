import { Role } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/app-error'

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError(
          'Authenticated user is required',
          401,
          'Unauthorized',
        ),
      )
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission', 403, 'Forbidden'))
    }

    return next()
  }
}
