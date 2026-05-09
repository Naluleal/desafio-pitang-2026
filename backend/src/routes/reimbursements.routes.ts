import {
  HistoryAction,
  ReimbursementStatus,
  Role,
  type Prisma,
  type Reimbursement,
} from '@prisma/client'
import { Request, Router } from 'express'
import { AppError } from '../errors/app-error'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/require.role'
import { createAttachmentSchema } from '../schemas/attachment.schema'
import {
  createReimbursementSchema,
  rejectReimbursementSchema,
  updateReimbursementSchema,
} from '../schemas/reimbursement.schema'

export const reimbursementsRoutes = Router()

const managerVisibleStatuses: ReimbursementStatus[] = [
  ReimbursementStatus.SUBMITTED,
  ReimbursementStatus.APPROVED,
  ReimbursementStatus.REJECTED,
]

const financialVisibleStatuses: ReimbursementStatus[] = [
  ReimbursementStatus.APPROVED,
  ReimbursementStatus.PAID,
]

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
}

function getParamId(req: Request) {
  const { id } = req.params

  if (typeof id !== 'string') {
    throw new AppError('Invalid reimbursement id')
  }

  return id
}

function getAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new AppError(
      'Authenticated user is required',
      401,
      'Unauthorized',
    )
  }

  return req.user
}

function canViewReimbursement(
  user: Express.Request['user'],
  reimbursement: Pick<Reimbursement, 'status' | 'userId'>,
) {
  if (!user) {
    return false
  }

  if (user.role === Role.ADMIN) {
    return true
  }

  if (user.role === Role.EMPLOYEE) {
    return reimbursement.userId === user.id
  }

  if (user.role === Role.MANAGER) {
    return managerVisibleStatuses.includes(reimbursement.status)
  }

  if (user.role === Role.FINANCIAL) {
    return financialVisibleStatuses.includes(reimbursement.status)
  }

  return false
}

async function findReimbursementOrThrow(id: string) {
  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id },
  })

  if (!reimbursement) {
    throw new AppError('Reimbursement not found', 404, 'Not Found')
  }

  return reimbursement
}

async function ensureActiveCategory(categoryId: string) {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isActive: true,
    },
  })

  if (!category) {
    throw new AppError('Category not found or inactive')
  }

  return category
}

function ensureCanView(
  user: Express.Request['user'],
  reimbursement: Pick<Reimbursement, 'status' | 'userId'>,
) {
  if (!canViewReimbursement(user, reimbursement)) {
    throw new AppError('You do not have permission', 403, 'Forbidden')
  }
}

function ensureEmployeeOwnsReimbursement(
  user: Express.Request['user'],
  reimbursement: Pick<Reimbursement, 'userId'>,
) {
  if (!user || reimbursement.userId !== user.id) {
    throw new AppError('You do not have permission', 403, 'Forbidden')
  }
}

function ensureStatus(
  reimbursement: Pick<Reimbursement, 'status'>,
  expectedStatus: ReimbursementStatus,
  message: string,
) {
  if (reimbursement.status !== expectedStatus) {
    throw new AppError(message)
  }
}

reimbursementsRoutes.get('/', authenticate, async (req, res) => {
  const user = getAuthenticatedUser(req)

  const where: Prisma.ReimbursementWhereInput =
    user.role === Role.EMPLOYEE
      ? { userId: user.id }
      : user.role === Role.MANAGER
        ? { status: { in: managerVisibleStatuses } }
        : user.role === Role.FINANCIAL
          ? { status: { in: financialVisibleStatuses } }
          : {}

  const reimbursements = await prisma.reimbursement.findMany({
    where,
    include: {
      category: true,
      user: { select: userSelect },
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.json(reimbursements)
})

reimbursementsRoutes.post(
  '/',
  authenticate,
  requireRole(Role.EMPLOYEE),
  async (req, res) => {
    const result = createReimbursementSchema.safeParse(req.body)

    if (!result.success) {
      throw new AppError(
        'Validation failed',
        400,
        'Bad Request',
        result.error.issues,
      )
    }

    const user = getAuthenticatedUser(req)

    await ensureActiveCategory(result.data.categoryId)

    const reimbursement = await prisma.reimbursement.create({
      data: {
        description: result.data.description,
        amount: result.data.amount,
        expenseDate: result.data.expenseDate,
        userId: user.id,
        categoryId: result.data.categoryId,
        histories: {
          create: {
            action: HistoryAction.CREATED,
            note: 'Reimbursement created as draft',
            userId: user.id,
          },
        },
      },
      include: {
        category: true,
        histories: true,
      },
    })

    return res.status(201).json(reimbursement)
  },
)

reimbursementsRoutes.get('/:id', authenticate, async (req, res) => {
  const id = getParamId(req)

  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id },
    include: {
      attachments: true,
      category: true,
      histories: {
        include: {
          user: { select: userSelect },
        },
        orderBy: { createdAt: 'asc' },
      },
      user: { select: userSelect },
    },
  })

  if (!reimbursement) {
    throw new AppError('Reimbursement not found', 404, 'Not Found')
  }

  ensureCanView(req.user, reimbursement)

  return res.json(reimbursement)
})

reimbursementsRoutes.put(
  '/:id',
  authenticate,
  requireRole(Role.EMPLOYEE),
  async (req, res) => {
    const id = getParamId(req)

    const result = updateReimbursementSchema.safeParse(req.body)

    if (!result.success) {
      throw new AppError(
        'Validation failed',
        400,
        'Bad Request',
        result.error.issues,
      )
    }

    const user = getAuthenticatedUser(req)
    const reimbursement = await findReimbursementOrThrow(id)

    ensureEmployeeOwnsReimbursement(user, reimbursement)
    ensureStatus(
      reimbursement,
      ReimbursementStatus.DRAFT,
      'Only draft reimbursements can be edited',
    )

    if (result.data.categoryId) {
      await ensureActiveCategory(result.data.categoryId)
    }

    const updatedReimbursement = await prisma.reimbursement.update({
      where: { id },
      data: {
        ...result.data,
        histories: {
          create: {
            action: HistoryAction.UPDATED,
            note: 'Draft reimbursement updated',
            userId: user.id,
          },
        },
      },
      include: {
        category: true,
        histories: true,
      },
    })

    return res.json(updatedReimbursement)
  },
)

reimbursementsRoutes.post(
  '/:id/submit',
  authenticate,
  requireRole(Role.EMPLOYEE),
  async (req, res) => {
    const id = getParamId(req)
    const user = getAuthenticatedUser(req)
    const reimbursement = await findReimbursementOrThrow(id)

    ensureEmployeeOwnsReimbursement(user, reimbursement)
    ensureStatus(
      reimbursement,
      ReimbursementStatus.DRAFT,
      'Only draft reimbursements can be submitted',
    )

    const updatedReimbursement = await prisma.reimbursement.update({
      where: { id },
      data: {
        status: ReimbursementStatus.SUBMITTED,
        histories: {
          create: {
            action: HistoryAction.SUBMITTED,
            note: 'Reimbursement submitted for review',
            userId: user.id,
          },
        },
      },
      include: {
        category: true,
        histories: true,
      },
    })

    return res.json(updatedReimbursement)
  },
)

reimbursementsRoutes.post(
  '/:id/approve',
  authenticate,
  requireRole(Role.MANAGER),
  async (req, res) => {
    const id = getParamId(req)
    const user = getAuthenticatedUser(req)
    const reimbursement = await findReimbursementOrThrow(id)

    ensureStatus(
      reimbursement,
      ReimbursementStatus.SUBMITTED,
      'Only submitted reimbursements can be approved',
    )

    const updatedReimbursement = await prisma.reimbursement.update({
      where: { id },
      data: {
        status: ReimbursementStatus.APPROVED,
        histories: {
          create: {
            action: HistoryAction.APPROVED,
            note: 'Reimbursement approved by manager',
            userId: user.id,
          },
        },
      },
      include: {
        category: true,
        histories: true,
      },
    })

    return res.json(updatedReimbursement)
  },
)

reimbursementsRoutes.post(
  '/:id/reject',
  authenticate,
  requireRole(Role.MANAGER),
  async (req, res) => {
    const id = getParamId(req)

    const result = rejectReimbursementSchema.safeParse(req.body)

    if (!result.success) {
      throw new AppError(
        'Validation failed',
        400,
        'Bad Request',
        result.error.issues,
      )
    }

    const user = getAuthenticatedUser(req)
    const reimbursement = await findReimbursementOrThrow(id)

    ensureStatus(
      reimbursement,
      ReimbursementStatus.SUBMITTED,
      'Only submitted reimbursements can be rejected',
    )

    const updatedReimbursement = await prisma.reimbursement.update({
      where: { id },
      data: {
        status: ReimbursementStatus.REJECTED,
        rejectionReason: result.data.rejectionReason,
        histories: {
          create: {
            action: HistoryAction.REJECTED,
            note: result.data.rejectionReason,
            userId: user.id,
          },
        },
      },
      include: {
        category: true,
        histories: true,
      },
    })

    return res.json(updatedReimbursement)
  },
)

reimbursementsRoutes.post(
  '/:id/pay',
  authenticate,
  requireRole(Role.FINANCIAL),
  async (req, res) => {
    const id = getParamId(req)
    const user = getAuthenticatedUser(req)
    const reimbursement = await findReimbursementOrThrow(id)

    ensureStatus(
      reimbursement,
      ReimbursementStatus.APPROVED,
      'Only approved reimbursements can be paid',
    )

    const updatedReimbursement = await prisma.reimbursement.update({
      where: { id },
      data: {
        status: ReimbursementStatus.PAID,
        histories: {
          create: {
            action: HistoryAction.PAID,
            note: 'Reimbursement marked as paid by financial',
            userId: user.id,
          },
        },
      },
      include: {
        category: true,
        histories: true,
      },
    })

    return res.json(updatedReimbursement)
  },
)

reimbursementsRoutes.post(
  '/:id/cancel',
  authenticate,
  requireRole(Role.EMPLOYEE),
  async (req, res) => {
    const id = getParamId(req)
    const user = getAuthenticatedUser(req)
    const reimbursement = await findReimbursementOrThrow(id)

    ensureEmployeeOwnsReimbursement(user, reimbursement)
    ensureStatus(
      reimbursement,
      ReimbursementStatus.DRAFT,
      'Only draft reimbursements can be canceled',
    )

    const updatedReimbursement = await prisma.reimbursement.update({
      where: { id },
      data: {
        status: ReimbursementStatus.CANCELED,
        histories: {
          create: {
            action: HistoryAction.CANCELED,
            note: 'Reimbursement canceled by employee',
            userId: user.id,
          },
        },
      },
      include: {
        category: true,
        histories: true,
      },
    })

    return res.json(updatedReimbursement)
  },
)

reimbursementsRoutes.delete(
  '/:id',
  authenticate,
  requireRole(Role.EMPLOYEE),
  async (req, res) => {
    const id = getParamId(req)
    const user = getAuthenticatedUser(req)
    const reimbursement = await findReimbursementOrThrow(id)

    ensureEmployeeOwnsReimbursement(user, reimbursement)
    ensureStatus(
      reimbursement,
      ReimbursementStatus.DRAFT,
      'Only draft reimbursements can be deleted',
    )

    const deletedReimbursement = await prisma.reimbursement.update({
      where: { id },
      data: {
        status: ReimbursementStatus.CANCELED,
        histories: {
          create: {
            action: HistoryAction.CANCELED,
            note: 'Draft reimbursement deleted by employee',
            userId: user.id,
          },
        },
      },
      include: {
        category: true,
        histories: true,
      },
    })

    return res.json(deletedReimbursement)
  },
)

reimbursementsRoutes.post(
  '/:id/attachments',
  authenticate,
  requireRole(Role.EMPLOYEE),
  async (req, res) => {
    const id = getParamId(req)

    const result = createAttachmentSchema.safeParse(req.body)

    if (!result.success) {
      throw new AppError(
        'Validation failed',
        400,
        'Bad Request',
        result.error.issues,
      )
    }

    const user = getAuthenticatedUser(req)
    const reimbursement = await findReimbursementOrThrow(id)

    ensureEmployeeOwnsReimbursement(user, reimbursement)
    ensureStatus(
      reimbursement,
      ReimbursementStatus.DRAFT,
      'Only draft reimbursements can receive attachments',
    )

    const [attachment] = await prisma.$transaction([
      prisma.attachment.create({
        data: {
          fileName: result.data.fileName,
          fileUrl: result.data.fileUrl,
          fileType: result.data.fileType,
          reimbursementId: id,
        },
      }),
      prisma.reimbursementHistory.create({
        data: {
          reimbursementId: id,
          userId: user.id,
          action: HistoryAction.ATTACHMENT_ADDED,
          note: `Attachment added: ${result.data.fileName}`,
        },
      }),
    ])

    return res.status(201).json(attachment)
  },
)

reimbursementsRoutes.get('/:id/attachments', authenticate, async (req, res) => {
  const id = getParamId(req)
  const reimbursement = await findReimbursementOrThrow(id)

  ensureCanView(req.user, reimbursement)

  const attachments = await prisma.attachment.findMany({
    where: { reimbursementId: id },
    orderBy: { createdAt: 'desc' },
  })

  return res.json(attachments)
})

reimbursementsRoutes.get('/:id/history', authenticate, async (req, res) => {
  const id = getParamId(req)
  const reimbursement = await findReimbursementOrThrow(id)

  ensureCanView(req.user, reimbursement)

  const history = await prisma.reimbursementHistory.findMany({
    where: { reimbursementId: id },
    include: {
      user: { select: userSelect },
    },
    orderBy: { createdAt: 'asc' },
  })

  return res.json(history)
})
