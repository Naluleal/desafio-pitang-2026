import request from 'supertest'
import { app } from '../app'
import { prisma } from '../lib/prisma'
import { removeTestDatabase, resetTestDatabase } from './database'

type TestUserInput = {
  name: string
  email: string
  password: string
  role: 'EMPLOYEE' | 'MANAGER' | 'FINANCIAL' | 'ADMIN'
}

async function createUser(user: TestUserInput) {
  const response = await request(app).post('/users').send(user)

  expect(response.status).toBe(201)
  expect(response.body).not.toHaveProperty('password')

  return response.body
}

async function login(email: string, password: string) {
  const response = await request(app).post('/auth/login').send({
    email,
    password,
  })

  expect(response.status).toBe(200)
  expect(response.body.token).toEqual(expect.any(String))

  return response.body.token as string
}

async function createCategory(adminToken: string, name: string) {
  const response = await request(app)
    .post('/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name })

  expect(response.status).toBe(201)

  return response.body
}

async function createDraftReimbursement(
  employeeToken: string,
  categoryId: string,
  description: string,
) {
  const response = await request(app)
    .post('/reimbursements')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({
      description,
      amount: 50,
      expenseDate: '2026-05-07',
      categoryId,
    })

  expect(response.status).toBe(201)
  expect(response.body.status).toBe('DRAFT')

  return response.body
}

describe('reimbursements flow', () => {
  beforeAll(() => {
    console.log('[setup] Resetting test database')
    resetTestDatabase()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    removeTestDatabase()
  })

  it('creates, submits, approves and pays a reimbursement', async () => {
    const password = '123456'

    console.log('[1/9] Creating test users')
    await createUser({
      name: 'Admin User',
      email: 'admin@test.com',
      password,
      role: 'ADMIN',
    })
    await createUser({
      name: 'Employee User',
      email: 'employee@test.com',
      password,
      role: 'EMPLOYEE',
    })
    await createUser({
      name: 'Manager User',
      email: 'manager@test.com',
      password,
      role: 'MANAGER',
    })
    await createUser({
      name: 'Financial User',
      email: 'financial@test.com',
      password,
      role: 'FINANCIAL',
    })

    console.log('[2/9] Logging in users')
    const adminToken = await login('admin@test.com', password)
    const employeeToken = await login('employee@test.com', password)
    const managerToken = await login('manager@test.com', password)
    const financialToken = await login('financial@test.com', password)

    console.log('[3/9] Admin creating category')
    const category = await createCategory(adminToken, 'Meals')

    expect(category.name).toBe('Meals')

    console.log('[4/9] Employee creating reimbursement draft')
    const reimbursement = await createDraftReimbursement(
      employeeToken,
      category.id,
      'Team lunch during client visit',
    )

    const reimbursementId = reimbursement.id

    console.log('[5/9] Employee adding simulated attachment')
    const attachmentResponse = await request(app)
      .post(`/reimbursements/${reimbursementId}/attachments`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        fileName: 'receipt.pdf',
        fileUrl: 'https://example.com/receipt.pdf',
        fileType: 'PDF',
      })

    expect(attachmentResponse.status).toBe(201)
    expect(attachmentResponse.body.fileName).toBe('receipt.pdf')

    console.log('[6/9] Employee submitting reimbursement')
    const submitResponse = await request(app)
      .post(`/reimbursements/${reimbursementId}/submit`)
      .set('Authorization', `Bearer ${employeeToken}`)

    expect(submitResponse.status).toBe(200)
    expect(submitResponse.body.status).toBe('SUBMITTED')

    console.log('[7/9] Manager approving reimbursement')
    const approveResponse = await request(app)
      .post(`/reimbursements/${reimbursementId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)

    expect(approveResponse.status).toBe(200)
    expect(approveResponse.body.status).toBe('APPROVED')

    console.log('[8/9] Financial marking reimbursement as paid')
    const payResponse = await request(app)
      .post(`/reimbursements/${reimbursementId}/pay`)
      .set('Authorization', `Bearer ${financialToken}`)

    expect(payResponse.status).toBe(200)
    expect(payResponse.body.status).toBe('PAID')

    console.log('[9/9] Checking reimbursement history')
    const historyResponse = await request(app)
      .get(`/reimbursements/${reimbursementId}/history`)
      .set('Authorization', `Bearer ${employeeToken}`)

    expect(historyResponse.status).toBe(200)
    expect(historyResponse.body.map((item: { action: string }) => item.action))
      .toEqual([
        'CREATED',
        'ATTACHMENT_ADDED',
        'SUBMITTED',
        'APPROVED',
        'PAID',
      ])
  })

  it('blocks a non-admin user from creating categories', async () => {
    console.log('[permission] Checking non-admin category creation block')
    const employeeToken = await login('employee@test.com', '123456')

    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Transport' })

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({
      message: 'You do not have permission',
      statusCode: 403,
      error: 'Forbidden',
    })
  })

  it('blocks an employee from approving a reimbursement', async () => {
    console.log('[negative] Employee cannot approve reimbursements')
    const password = '123456'
    const adminToken = await login('admin@test.com', password)
    const employeeToken = await login('employee@test.com', password)
    const category = await createCategory(adminToken, 'Employee approve block')
    const reimbursement = await createDraftReimbursement(
      employeeToken,
      category.id,
      'Reimbursement that employee tries to approve',
    )

    const submitResponse = await request(app)
      .post(`/reimbursements/${reimbursement.id}/submit`)
      .set('Authorization', `Bearer ${employeeToken}`)

    expect(submitResponse.status).toBe(200)

    const approveResponse = await request(app)
      .post(`/reimbursements/${reimbursement.id}/approve`)
      .set('Authorization', `Bearer ${employeeToken}`)

    expect(approveResponse.status).toBe(403)
    expect(approveResponse.body).toMatchObject({
      message: 'You do not have permission',
      statusCode: 403,
      error: 'Forbidden',
    })
  })

  it('blocks paying a submitted reimbursement', async () => {
    console.log('[negative] Financial cannot pay submitted reimbursement')
    const password = '123456'
    const adminToken = await login('admin@test.com', password)
    const employeeToken = await login('employee@test.com', password)
    const financialToken = await login('financial@test.com', password)
    const category = await createCategory(adminToken, 'Submitted pay block')
    const reimbursement = await createDraftReimbursement(
      employeeToken,
      category.id,
      'Submitted reimbursement that cannot be paid yet',
    )

    const submitResponse = await request(app)
      .post(`/reimbursements/${reimbursement.id}/submit`)
      .set('Authorization', `Bearer ${employeeToken}`)

    expect(submitResponse.status).toBe(200)

    const payResponse = await request(app)
      .post(`/reimbursements/${reimbursement.id}/pay`)
      .set('Authorization', `Bearer ${financialToken}`)

    expect(payResponse.status).toBe(400)
    expect(payResponse.body).toMatchObject({
      message: 'Only approved reimbursements can be paid',
      statusCode: 400,
      error: 'Bad Request',
    })
  })

  it('blocks adding attachments after reimbursement is submitted', async () => {
    console.log('[negative] Employee cannot attach after submit')
    const password = '123456'
    const adminToken = await login('admin@test.com', password)
    const employeeToken = await login('employee@test.com', password)
    const category = await createCategory(adminToken, 'Attachment status block')
    const reimbursement = await createDraftReimbursement(
      employeeToken,
      category.id,
      'Submitted reimbursement that cannot receive attachments',
    )

    const submitResponse = await request(app)
      .post(`/reimbursements/${reimbursement.id}/submit`)
      .set('Authorization', `Bearer ${employeeToken}`)

    expect(submitResponse.status).toBe(200)

    const attachmentResponse = await request(app)
      .post(`/reimbursements/${reimbursement.id}/attachments`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        fileName: 'late-receipt.pdf',
        fileUrl: 'https://example.com/late-receipt.pdf',
        fileType: 'PDF',
      })

    expect(attachmentResponse.status).toBe(400)
    expect(attachmentResponse.body).toMatchObject({
      message: 'Only draft reimbursements can receive attachments',
      statusCode: 400,
      error: 'Bad Request',
    })
  })

  it('soft deletes categories by marking them inactive', async () => {
    console.log('[delete] Admin can soft delete categories')
    const password = '123456'
    const adminToken = await login('admin@test.com', password)
    const employeeToken = await login('employee@test.com', password)
    const category = await createCategory(adminToken, 'Category delete test')

    const deleteResponse = await request(app)
      .delete(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body).toMatchObject({
      id: category.id,
      isActive: false,
    })

    const reimbursementResponse = await request(app)
      .post('/reimbursements')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        description: 'Reimbursement using inactive category',
        amount: 50,
        expenseDate: '2026-05-07',
        categoryId: category.id,
      })

    expect(reimbursementResponse.status).toBe(400)
    expect(reimbursementResponse.body).toMatchObject({
      message: 'Category not found or inactive',
      statusCode: 400,
      error: 'Bad Request',
    })
  })

  it('deletes draft reimbursements by canceling them', async () => {
    console.log('[delete] Employee can delete draft reimbursement')
    const password = '123456'
    const adminToken = await login('admin@test.com', password)
    const employeeToken = await login('employee@test.com', password)
    const category = await createCategory(adminToken, 'Draft delete test')
    const reimbursement = await createDraftReimbursement(
      employeeToken,
      category.id,
      'Draft reimbursement to delete',
    )

    const deleteResponse = await request(app)
      .delete(`/reimbursements/${reimbursement.id}`)
      .set('Authorization', `Bearer ${employeeToken}`)

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body.status).toBe('CANCELED')

    const historyResponse = await request(app)
      .get(`/reimbursements/${reimbursement.id}/history`)
      .set('Authorization', `Bearer ${employeeToken}`)

    expect(historyResponse.status).toBe(200)
    expect(historyResponse.body.map((item: { action: string }) => item.action))
      .toEqual(['CREATED', 'CANCELED'])
  })

  it('blocks deleting submitted reimbursements', async () => {
    console.log('[delete] Employee cannot delete submitted reimbursement')
    const password = '123456'
    const adminToken = await login('admin@test.com', password)
    const employeeToken = await login('employee@test.com', password)
    const category = await createCategory(adminToken, 'Submitted delete block')
    const reimbursement = await createDraftReimbursement(
      employeeToken,
      category.id,
      'Submitted reimbursement that cannot be deleted',
    )

    const submitResponse = await request(app)
      .post(`/reimbursements/${reimbursement.id}/submit`)
      .set('Authorization', `Bearer ${employeeToken}`)

    expect(submitResponse.status).toBe(200)

    const deleteResponse = await request(app)
      .delete(`/reimbursements/${reimbursement.id}`)
      .set('Authorization', `Bearer ${employeeToken}`)

    expect(deleteResponse.status).toBe(400)
    expect(deleteResponse.body).toMatchObject({
      message: 'Only draft reimbursements can be deleted',
      statusCode: 400,
      error: 'Bad Request',
    })
  })
})
