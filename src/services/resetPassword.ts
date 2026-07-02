import { Pool } from 'pg'

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })
  }
  return _pool
}

export async function requestPasswordReset(email: string): Promise<void> {
  const result = await getPool().query(
    `SELECT id FROM public.users WHERE email = $1 AND deleted_at IS NULL`,
    [email],
  )

  if (result.rows.length === 0) {
    throw new Error('email not found')
  }
}
