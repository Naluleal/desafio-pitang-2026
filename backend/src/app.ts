import express from 'express'
import { authRoutes } from './routes/auth.routes'
import { categoriesRoutes } from './routes/categories.routes'
import { errorHandler } from './middlewares/error-handler'
import { reimbursementsRoutes } from './routes/reimbursements.routes'
import { usersRoutes } from './routes/users.routes'

export const app = express()

app.use(express.json())

app.use('/auth', authRoutes)
app.use('/categories', categoriesRoutes)
app.use('/reimbursements', reimbursementsRoutes)
app.use('/users', usersRoutes)

app.use(errorHandler)
