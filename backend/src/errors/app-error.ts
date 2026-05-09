export class AppError extends Error {
  public readonly statusCode: number
  public readonly error: string
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode = 400,
    error = 'Bad Request',
    details?: unknown,
  ) {
    super(message)

    this.statusCode = statusCode
    this.error = error
    this.details = details
  }
}
