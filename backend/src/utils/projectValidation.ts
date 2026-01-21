// backend/src/utils/projectValidation.ts
// Project field validation

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export function validateProjectCreation(data: any): ValidationResult {
  const errors: ValidationError[] = []

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'Project name is required' })
  } else if (data.name.length < 3 || data.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be between 3 and 100 characters' })
  }

  // PM validation
  if (!data.pm_id || typeof data.pm_id !== 'string') {
    errors.push({ field: 'pm_id', message: 'Project manager is required' })
  }

  // Start date validation
  if (!data.start_date || typeof data.start_date !== 'string') {
    errors.push({ field: 'start_date', message: 'Start date is required' })
  } else {
    const startDate = new Date(data.start_date)
    if (isNaN(startDate.getTime())) {
      errors.push({ field: 'start_date', message: 'Invalid date format (use YYYY-MM-DD)' })
    }
  }

  // End date validation
  if (!data.end_date || typeof data.end_date !== 'string') {
    errors.push({ field: 'end_date', message: 'End date is required' })
  } else {
    const endDate = new Date(data.end_date)
    if (isNaN(endDate.getTime())) {
      errors.push({ field: 'end_date', message: 'Invalid date format (use YYYY-MM-DD)' })
    }
  }

  // End date must be after start date
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate < startDate) {
      errors.push({ field: 'end_date', message: 'End date must be after start date' })
    }
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

export function validateProjectUpdate(data: any): ValidationResult {
  const errors: ValidationError[] = []

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push({ field: 'name', message: 'Name must be a string' })
    } else if (data.name.length < 3 || data.name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be between 3 and 100 characters' })
    }
  }

  // PM validation (if provided)
  if (data.pm_id !== undefined && typeof data.pm_id !== 'string') {
    errors.push({ field: 'pm_id', message: 'Project manager ID must be a string' })
  }

  // Start date validation (if provided)
  if (data.start_date !== undefined) {
    if (typeof data.start_date !== 'string') {
      errors.push({ field: 'start_date', message: 'Start date must be a string' })
    } else {
      const startDate = new Date(data.start_date)
      if (isNaN(startDate.getTime())) {
        errors.push({ field: 'start_date', message: 'Invalid date format (use YYYY-MM-DD)' })
      }
    }
  }

  // End date validation (if provided)
  if (data.end_date !== undefined) {
    if (typeof data.end_date !== 'string') {
      errors.push({ field: 'end_date', message: 'End date must be a string' })
    } else {
      const endDate = new Date(data.end_date)
      if (isNaN(endDate.getTime())) {
        errors.push({ field: 'end_date', message: 'Invalid date format (use YYYY-MM-DD)' })
      }
    }
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
