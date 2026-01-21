// frontend/src/components/Audit/ChangeTimeline.tsx
// Component for displaying change history timeline

import React, { useMemo } from 'react'
import { format } from 'date-fns'
import { useChangeHistory } from '../../hooks/useAudit'
import './ChangeTimeline.css'

interface TimelineProps {
  resourceId: string
  resourceType?: string
}

export function ChangeTimeline({ resourceId, resourceType }: TimelineProps) {
  const { data: changes, isLoading, error } = useChangeHistory(resourceId, resourceType)

  const timelineEvents = useMemo(() => {
    if (!changes) return []

    return changes.map((change) => ({
      ...change,
      timestamp: new Date(change.changed_at),
    }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [changes])

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return '+'
      case 'update':
        return '~'
      case 'delete':
        return '−'
      default:
        return '•'
    }
  }

  const getChangeTypeLabel = (changeType: string) => {
    return changeType.charAt(0).toUpperCase() + changeType.slice(1)
  }

  const renderFieldChanges = (fieldsChanged?: string[]) => {
    if (!fieldsChanged || fieldsChanged.length === 0) return null

    return (
      <div className="fields-changed">
        <strong>Fields Changed:</strong>
        <ul>
          {fieldsChanged.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </div>
    )
  }

  const renderValueDiff = (previous?: Record<string, any>, current?: Record<string, any>) => {
    if (!previous && !current) return null

    const changes: { field: string; before: any; after: any }[] = []

    if (previous) {
      Object.entries(previous).forEach(([key, value]) => {
        const before = value
        const after = current?.[key]
        if (before !== after) {
          changes.push({ field: key, before, after })
        }
      })
    }

    return (
      <div className="value-diff">
        {changes.map((change) => (
          <div key={change.field} className="diff-row">
            <span className="field-name">{change.field}:</span>
            <span className="before">{JSON.stringify(change.before)}</span>
            <span className="arrow">→</span>
            <span className="after">{JSON.stringify(change.after)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="timeline-error">
        <p>Error loading change history: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }

  return (
    <div className="change-timeline">
      <div className="timeline-header">
        <h3>Change History</h3>
        {timelineEvents.length > 0 && (
          <span className="event-count">{timelineEvents.length} changes</span>
        )}
      </div>

      {isLoading ? (
        <div className="timeline-loading">Loading change history...</div>
      ) : timelineEvents.length > 0 ? (
        <div className="timeline-container">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className={`timeline-event event-${event.change_type}`}>
              <div className="timeline-marker">
                <span className="marker-icon">{getChangeTypeIcon(event.change_type)}</span>
              </div>

              <div className="timeline-content">
                <div className="event-header">
                  <span className={`change-type-badge type-${event.change_type}`}>
                    {getChangeTypeLabel(event.change_type)}
                  </span>
                  <span className="timestamp">
                    {format(event.timestamp, 'PPpp')}
                  </span>
                  <span className="changed-by">by {event.changed_by}</span>
                </div>

                {event.description && (
                  <div className="event-description">{event.description}</div>
                )}

                {renderFieldChanges(event.fields_changed)}

                {renderValueDiff(event.previous_values, event.current_values)}

                {index < timelineEvents.length - 1 && (
                  <div className="timeline-connector" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="timeline-empty">No change history found</div>
      )}
    </div>
  )
}

export default ChangeTimeline
