import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Password must have at least 6 characters'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'FINANCIAL', 'ADMIN']),
})
