import { z } from 'zod'

export const createAttachmentSchema = z.object({
  fileName: z.string().trim().min(1, 'File name is required'),
  fileUrl: z.url('Invalid file URL'),
  fileType: z.enum(['PDF', 'JPG', 'PNG']),
})
