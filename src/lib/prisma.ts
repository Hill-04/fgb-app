import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

function resolveDbUrl(): string {
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // If the URL is already absolute (e.g. file:/absolute/path), use it as-is
  // If it's relative (e.g. file:./dev.db), resolve against the project root
  if (rawUrl.startsWith('file:./') || rawUrl.startsWith('file:../')) {
    const relativePath = rawUrl.slice('file:'.length)
    const projectRoot = process.cwd()
    const absolutePath = path.resolve(projectRoot, relativePath)
    // libsql requires forward slashes on Windows
    return 'file:' + absolutePath.replace(/\\/g, '/')
  }

  // Already absolute or a remote URL — return as-is
  return rawUrl.replace(/\\/g, '/')
}

function createPrismaClient(): PrismaClient {
  const url = resolveDbUrl()
  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({ adapter } as any)
}

declare const globalThis: {
  prismaGlobal: PrismaClient
} & typeof global

const prisma: PrismaClient = globalThis.prismaGlobal ?? createPrismaClient()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
