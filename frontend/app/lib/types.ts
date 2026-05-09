export type UserRole = "EMPLOYEE" | "MANAGER" | "FINANCIAL" | "ADMIN"

export type ReimbursementStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "CANCELED"

export type FileType = "PDF" | "JPG" | "PNG"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  token?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  name: string
  role: UserRole
}

export interface Category {
  id: string
  name: string
  active: boolean
  isActive?: boolean
}

export interface Attachment {
  id: string
  fileName: string
  fileUrl: string
  fileType: FileType
}

export interface ReimbursementHistory {
  id: string
  action: string
  note?: string | null
  createdAt: string
  user?: Pick<User, "id" | "name" | "email" | "role">
}

export interface Reimbursement {
  id: string
  description: string
  amount: number
  expenseDate: string
  createdAt?: string
  updatedAt?: string
  status: ReimbursementStatus
  rejectionReason?: string | null
  userId: string
  userName: string
  categoryId: string
  category: string
  attachments: Attachment[]
  histories?: ReimbursementHistory[]
}
