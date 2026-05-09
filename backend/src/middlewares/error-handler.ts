import { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/app-error'

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof AppError) {
    const response = {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
      ...(error.details ? { details: error.details } : {}),
    }

    return res.status(error.statusCode).json(response)
  }

  console.error(error)

  return res.status(500).json({
    message: 'Internal server error',
    statusCode: 500,
    error: 'Internal Server Error',
  })
}
