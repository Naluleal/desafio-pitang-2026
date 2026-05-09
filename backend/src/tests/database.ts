import Database from 'better-sqlite3'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'

const testDatabasePath = path.join(process.cwd(), 'test.db')
const migrationPath = path.join(
  process.cwd(),
  'prisma',
  'migrations',
  '20260501141620_init',
  'migration.sql',
)

export function resetTestDatabase() {
  if (existsSync(testDatabasePath)) {
    rmSync(testDatabasePath)
  }

  const db = new Database(testDatabasePath)
  const migration = readFileSync(migrationPath, 'utf8')

  db.exec(migration)
  db.close()
}

export function removeTestDatabase() {
  if (existsSync(testDatabasePath)) {
    rmSync(testDatabasePath)
  }
}
