// backend/src/db/connection.ts
// Database connection with pooling

import { Pool, PoolClient } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  min: parseInt(process.env.DB_POOL_MIN || '5', 10),
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

// Event listeners for pool errors
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err)
})

// Get a client from the pool
export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}

// Query helper
export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms):`, text.substring(0, 100))
    }
    return result
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing database pool...')
  await pool.end()
})

export default pool
