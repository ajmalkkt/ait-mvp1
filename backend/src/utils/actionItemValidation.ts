// backend/src/utils/actionItemValidation.ts
// Action item field validation

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export function validateActionItemCreation(data: any): ValidationResult {
  const errors: ValidationError[] = []

  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push({ field: 'title', message: 'Title is required' })
  } else if (data.title.length < 3 || data.title.length > 255) {
    errors.push({ field: 'title', message: 'Title must be between 3 and 255 characters' })
  }

  // Owner validation
  if (!data.owner_id || typeof data.owner_id !== 'string') {
    errors.push({ field: 'owner_id', message: 'Owner is required' })
  }

  // Project validation
  if (!data.project_id || typeof data.project_id !== 'string') {
    errors.push({ field: 'project_id', message: 'Project is required' })
  }

  // Due date validation
  if (!data.due_date || typeof data.due_date !== 'string') {
    errors.push({ field: 'due_date', message: 'Due date is required' })
  } else {
    const dueDate = new Date(data.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (isNaN(dueDate.getTime())) {
      errors.push({ field: 'due_date', message: 'Invalid date format (use YYYY-MM-DD)' })
    } else if (dueDate < today) {
      errors.push({ field: 'due_date', message: 'Due date must be in the future' })
    }
  }

  // Priority validation
  if (data.priority && !['high', 'medium', 'low'].includes(data.priority)) {
    errors.push({ field: 'priority', message: 'Priority must be high, medium, or low' })
  }

  // Description validation (optional)
  if (data.description && typeof data.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' })
  } else if (data.description && data.description.length > 5000) {
    errors.push({ field: 'description', message: 'Description must be less than 5000 characters' })
  }

  // Team validation (optional)
  if (data.team_id && typeof data.team_id !== 'string') {
    errors.push({ field: 'team_id', message: 'Team ID must be a string' })
  }

  // Meeting validation (optional)
  if (data.meeting_id && typeof data.meeting_id !== 'string') {
    errors.push({ field: 'meeting_id', message: 'Meeting ID must be a string' })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateStatusChange(currentStatus: string, newStatus: string): ValidationResult {
  const errors: ValidationError[] = []
  const validStatuses = ['open', 'in_progress', 'completed', 'closed', 'on_hold']

  if (!validStatuses.includes(newStatus)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${validStatuses.join(', ')}`
    })
  }

  // Cannot manually set overdue status
  if (newStatus === 'overdue') {
    errors.push({
      field: 'status',
      message: 'Overdue status is set automatically by the system'
    })
  }

  // Validate workflow transitions
  const validTransitions: Record<string, string[]> = {
    'open': ['in_progress', 'on_hold'],
    'in_progress': ['completed', 'on_hold', 'open'],
    'on_hold': ['open', 'in_progress'],
    'completed': ['closed'],
    'closed': [],
    'overdue': ['in_progress', 'on_hold', 'closed']
  }

  if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(newStatus)) {
    errors.push({
      field: 'status',
      message: `Cannot transition from ${currentStatus} to ${newStatus}`
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateActionItemUpdate(data: any): ValidationResult {
  const errors: ValidationError[] = []

  // Title validation (if provided)
  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      errors.push({ field: 'title', message: 'Title must be a string' })
    } else if (data.title.length < 3 || data.title.length > 255) {
      errors.push({ field: 'title', message: 'Title must be between 3 and 255 characters' })
    }
  }

  // Owner validation (if provided)
  if (data.owner_id !== undefined && typeof data.owner_id !== 'string') {
    errors.push({ field: 'owner_id', message: 'Owner ID must be a string' })
  }

  // Priority validation (if provided)
  if (data.priority !== undefined && !['high', 'medium', 'low'].includes(data.priority)) {
    errors.push({ field: 'priority', message: 'Priority must be high, medium, or low' })
  }

  // Due date validation (if provided)
  if (data.due_date !== undefined) {
    if (typeof data.due_date !== 'string') {
      errors.push({ field: 'due_date', message: 'Due date must be a string' })
    } else {
      const dueDate = new Date(data.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (isNaN(dueDate.getTime())) {
        errors.push({ field: 'due_date', message: 'Invalid date format (use YYYY-MM-DD)' })
      } else if (dueDate < today) {
        errors.push({ field: 'due_date', message: 'Due date must be in the future' })
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
