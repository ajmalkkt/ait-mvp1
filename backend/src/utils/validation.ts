// backend/src/utils/validation.ts
// Validation utilities

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function validateDate(date: string): boolean {
  const parsed = new Date(date)
  return !isNaN(parsed.getTime())
}

export function validateFutureDate(date: string): boolean {
  const parsed = new Date(date)
  return !isNaN(parsed.getTime()) && parsed > new Date()
}

export function validateString(value: any, minLength: number = 1, maxLength: number = 255): boolean {
  return typeof value === 'string' && value.length >= minLength && value.length <= maxLength
}

export function validateRequired(value: any): boolean {
  return value !== null && value !== undefined && value !== ''
}

export function validateEnum(value: string, allowedValues: string[]): boolean {
  return allowedValues.includes(value)
}
