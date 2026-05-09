import { z } from 'zod'

export const createReimbursementSchema = z.object({
  description: z.string().trim().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  expenseDate: z.coerce.date({
    error: 'Expense date is required',
  }),
  categoryId: z.string().uuid('Invalid category id'),
})

export const updateReimbursementSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').optional(),
  amount: z.number().positive('Amount must be greater than zero').optional(),
  expenseDate: z.coerce.date().optional(),
  categoryId: z.string().uuid('Invalid category id').optional(),
})

export const rejectReimbursementSchema = z.object({
  rejectionReason: z.string().trim().min(1, 'Rejection reason is required'),
})
