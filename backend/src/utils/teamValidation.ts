// backend/src/utils/teamValidation.ts
// Team field validation

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export function validateTeamCreation(data: any): ValidationResult {
  const errors: ValidationError[] = []

  // Project validation
  if (!data.project_id || typeof data.project_id !== 'string') {
    errors.push({ field: 'project_id', message: 'Project is required' })
  }

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'Team name is required' })
  } else if (data.name.length < 3 || data.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be between 3 and 100 characters' })
  }

  // Lead validation
  if (!data.lead_id || typeof data.lead_id !== 'string') {
    errors.push({ field: 'lead_id', message: 'Team lead is required' })
  }

  // Description validation (optional)
  if (data.description && typeof data.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' })
  } else if (data.description && data.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must be less than 1000 characters' })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateTeamUpdate(data: any): ValidationResult {
  const errors: ValidationError[] = []

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push({ field: 'name', message: 'Name must be a string' })
    } else if (data.name.length < 3 || data.name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be between 3 and 100 characters' })
    }
  }

  // Lead validation (if provided)
  if (data.lead_id !== undefined && typeof data.lead_id !== 'string') {
    errors.push({ field: 'lead_id', message: 'Team lead ID must be a string' })
  }

  // Description validation (if provided)
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateTeamMemberAdd(userId: any): ValidationResult {
  const errors: ValidationError[] = []

  if (!userId || typeof userId !== 'string') {
    errors.push({ field: 'user_id', message: 'User ID is required' })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
