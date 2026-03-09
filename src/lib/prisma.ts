import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) throw new Error('DATABASE_URL não definida')

  let url: string

  // Resolve relative file: paths to absolute (required on Windows with spaces in path)
  if (rawUrl.startsWith('file:./') || rawUrl.startsWith('file:../')) {
    const relativePath = rawUrl.slice('file:'.length)
    const absolutePath = path.resolve(process.cwd(), relativePath)
    url = 'file:' + absolutePath.replace(/\\/g, '/')
  } else {
    url = rawUrl.replace(/\\/g, '/')
  }

  const isRemote = url.startsWith('libsql://')
  const authToken = isRemote ? process.env.DATABASE_AUTH_TOKEN : undefined

  const adapter = new PrismaLibSql({ url, authToken })
  return new PrismaClient({ adapter } as any)
}

declare const globalThis: {
  prismaGlobal: PrismaClient
} & typeof global

const prisma: PrismaClient = globalThis.prismaGlobal ?? createPrismaClient()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
