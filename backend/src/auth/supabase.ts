// backend/src/auth/supabase.ts
// Supabase JWT verification and client initialization

import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const jwtSecret = process.env.JWT_SECRET || ''

// Initialize Supabase client for database operations
export const supabase = createClient(supabaseUrl, supabaseKey)

// Verify JWT token and extract claims
export function verifyJWT(token: string): Record<string, any> | null {
  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] })
    return decoded as Record<string, any>
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Extract token from Authorization header
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }
  return parts[1]
}

// Decode JWT without verification (for debugging)
export function decodeJWT(token: string): Record<string, any> | null {
  try {
    return jwt.decode(token) as Record<string, any>
  } catch (error) {
    return null
  }
}
