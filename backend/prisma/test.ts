import 'dotenv/config'
import { PrismaClient, Role } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Luisa",
      email: `luisa${Date.now()}@email.com`,
      password: "123456",
      role: Role.EMPLOYEE
    }
  })

  console.log(user)
}

main()
