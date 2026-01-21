# Phase 3 Testing & Verification Guide

## 🧪 What's Ready to Test

All Phase 3 features are implemented and ready for manual testing.

---

## 📋 Testing Checklist

### Backend Services

#### Notification Service
- [ ] Create a new notification
  ```typescript
  POST /api/v1/notifications
  Body: {
    title: "Test Notification",
    message: "This is a test",
    type: "info"
  }
  ```

- [ ] List all notifications
  ```
  GET /api/v1/notifications
  GET /api/v1/notifications?page=1&pageSize=10
  GET /api/v1/notifications?isRead=false
  ```

- [ ] Get unread count
  ```
  GET /api/v1/notifications?pageSize=1
  Check response.pagination.unread
  ```

- [ ] Mark notification as read
  ```
  PATCH /api/v1/notifications/{id}/read
  Verify is_read: true
  ```

- [ ] Mark all as read
  ```
  PATCH /api/v1/notifications/read-all
  Check response.marked_as_read count
  ```

- [ ] Delete notification
  ```
  DELETE /api/v1/notifications/{id}
  Verify 200 OK response
  ```

#### Email Queue Service
- [ ] Enqueue an email
  ```typescript
  const emailId = await emailQueueService.enqueueEmail(companyId, {
    recipient_email: 'test@example.com',
    subject: 'Test Email',
    body: 'This is a test email'
  })
  ```

- [ ] Check email queue status
  ```typescript
  const stats = await emailQueueService.getEmailQueueStats(companyId)
  // { pending: 1, sent: 0, failed: 0, retrying: 0, avg_processing_time: 0 }
  ```

- [ ] Verify email worker processes it
  ```
  Check logs: "[EmailWorker] Email sent to test@example.com"
  Status should change from 'pending' to 'sent'
  ```

#### Escalation Service
- [ ] Get overdue items
  ```typescript
  const overdue = await escalationService.getOverdueActionItems(companyId)
  // Should return items with days_overdue > 0
  ```

- [ ] Get due items
  ```typescript
  const dueSoon = await escalationService.getDueActionItems(companyId, 7)
  // Should return items due in next 7 days
  ```

- [ ] Run escalations
  ```typescript
  const result = await escalationService.runDailyEscalations(companyId)
  // { overdue_escalations: X, due_escalations: Y, total: Z, timestamp }
  ```

- [ ] Verify escalation job runs daily
  ```
  Check at 9 AM UTC
  Should see in logs: "[EscalationJob] Running escalations for company"
  ```

---

### Frontend Components

#### Notification Bell
- [ ] See bell icon in header
  - Should render 🔔
  - Should have unread badge when there are unread notifications
  - Badge should show correct count
  - Badge should show "99+" for 100+ unread

- [ ] Click bell
  - Should trigger onClick callback
  - Should open notification center

- [ ] Hover over bell
  - Should have visual feedback (background change)

- [ ] Verify animation
  - Bell should have ring animation

#### Notification Item
- [ ] Verify card layout
  - Should show icon, title, time
  - Should show message
  - Should show action buttons

- [ ] Verify styling
  - Info: Blue border
  - Success: Green border
  - Warning: Orange border
  - Error: Red border

- [ ] Mark as read button
  - Should appear only for unread
  - Should call onRead callback
  - Should update styling after read

- [ ] Delete button
  - Should call onDelete callback
  - Should remove from list

- [ ] Timestamp
  - Should show relative time ("5m ago", "2h ago", "1d ago")

#### Notification Center
- [ ] List notifications
  - Should display all notifications
  - Should show loading while fetching
  - Should show empty message if no notifications

- [ ] Pagination
  - Should show current page
  - Should navigate between pages
  - Previous/Next buttons should be disabled at bounds

- [ ] Filter buttons
  - "All" should show all notifications
  - "Unread (5)" should show unread count
  - "Read" should show only read notifications
  - Active button should have different styling

- [ ] Mark all as read
  - Should appear only if there are unread
  - Should update all notifications
  - Unread count should become 0
  - Button should disappear

- [ ] Close button
  - Should call onClose callback
  - Should close notification center

#### Notifications Page
- [ ] Route `/notifications` should work
  - Should render NotificationCenter
  - Should show full page layout
  - Should be scrollable

---

### API Integration

#### Routes Working
- [ ] GET /api/v1/notifications → Returns list with pagination
- [ ] GET /api/v1/notifications/:id → Returns single notification
- [ ] PATCH /api/v1/notifications/:id/read → Marks as read
- [ ] PATCH /api/v1/notifications/read-all → Marks all as read
- [ ] DELETE /api/v1/notifications/:id → Deletes notification

#### Status Codes
- [ ] 200 OK for successful GET
- [ ] 200 OK for successful PATCH
- [ ] 200 OK for successful DELETE
- [ ] 401 Unauthorized if not authenticated
- [ ] 403 Forbidden if not own notification
- [ ] 404 Not Found if notification doesn't exist

---

### Database

#### Tables Exist
- [ ] notifications table
  - [ ] Has id, company_id, user_id, title, message, type
  - [ ] Has is_read, created_at, read_at
  - [ ] Has action_item_id, project_id, team_id
  - [ ] Has metadata JSONB

- [ ] notifications_queue table
  - [ ] Has id, company_id, recipient_email
  - [ ] Has subject, body, template, template_data
  - [ ] Has status (pending, sent, failed, retrying)
  - [ ] Has attempts, max_attempts, next_retry_at
  - [ ] Has sent_at, failed_at, error_message

#### Indexes Exist
- [ ] idx_notifications_company_id
- [ ] idx_notifications_user_id
- [ ] idx_notifications_is_read
- [ ] idx_notifications_created_at
- [ ] idx_notifications_queue_status
- [ ] idx_notifications_queue_next_retry

---

### Background Workers

#### Email Worker
- [ ] Worker starts on server startup
  - Check logs: "[EmailWorker] Started"

- [ ] Processes emails from queue
  - Enqueue email
  - Check logs: "[EmailWorker] Email sent to ..."
  - Status should change to 'sent'

- [ ] Handles retry logic
  - Mark email as failed with status='failed'
  - next_retry_at should be set (1min later)
  - Worker should retry later
  - Should increase attempts count

- [ ] Worker stops on shutdown
  - Stop server
  - Check logs: "[EmailWorker] Stopped"

#### Escalation Job
- [ ] Job starts on server startup
  - Check logs: "[EscalationJob] Started"
  - Check logs: "Schedule: 0 9 * * * (9 AM UTC)"

- [ ] Job runs at 9 AM UTC
  - Create action item due 1 day in future
  - Create action item 1 day overdue
  - Wait for 9 AM UTC or manually trigger
  - Check logs for escalation results
  - Verify notifications created

- [ ] Escalation rules work
  - Create items with different due dates
  - Run daily escalations
  - Verify correct notifications created per rule

- [ ] Job stops on shutdown
  - Stop server
  - Check logs: "[EscalationJob] Stopped"

---

### React Query Integration

#### Query Hooks
- [ ] useNotifications returns correct data
  - Should have data, isLoading, error
  - Should paginate correctly
  - Should filter correctly

- [ ] useUnreadNotificationCount returns count
  - Should update when notification marked as read
  - Should auto-refresh

- [ ] useNotification returns single notification
  - Should fetch only when enabled
  - Should cache result

- [ ] useMarkNotificationAsRead mutation works
  - Should update query cache
  - Should refresh unread count
  - Should invalidate lists

- [ ] useMarkAllNotificationsAsRead mutation works
  - Should update all notifications
  - Should refresh unread count

- [ ] useDeleteNotification mutation works
  - Should remove from lists
  - Should refresh unread count

#### Cache Behavior
- [ ] Cache invalidates correctly on mutations
- [ ] Stale time is respected (30s for list, 1min for unread)
- [ ] Manual refetch works

---

### Error Handling

#### Missing Environment Variables
- [ ] Missing MAIL_HOST → Should log warning, not send emails
- [ ] Missing MAIL_USER → Should log warning
- [ ] Missing MAIL_PASSWORD → Should log warning

#### Database Errors
- [ ] Invalid notification ID → Should return 404
- [ ] Missing required fields → Should return validation error
- [ ] Company isolation → Should not see other company's notifications

#### API Errors
- [ ] Unauthorized request → Should return 401
- [ ] Forbidden (not your notification) → Should return 403
- [ ] Server error → Should return 500 with error message

---

### Performance

#### Response Times
- [ ] List notifications: < 500ms
- [ ] Get single notification: < 200ms
- [ ] Create notification: < 300ms
- [ ] Mark as read: < 200ms
- [ ] Delete notification: < 200ms

#### Database
- [ ] Queries using indexes (check EXPLAIN ANALYZE)
- [ ] No N+1 queries
- [ ] Pagination working efficiently

#### Frontend
- [ ] Notification list scrolls smoothly
- [ ] Pagination doesn't cause flicker
- [ ] Unread badge updates instantly
- [ ] Filter changes instantly

---

### Security

#### Authentication
- [ ] Requests without JWT → 401 Unauthorized
- [ ] Requests with invalid JWT → 401 Unauthorized
- [ ] Requests with valid JWT → Works correctly

#### Company Isolation
- [ ] User A cannot see Company B's notifications
- [ ] User A cannot see other User B's notifications in Company A
- [ ] Deletion respects company_id

#### Input Validation
- [ ] Missing title → Validation error
- [ ] Invalid type → Validation error
- [ ] Null user_id → Error

---

## 🧬 Manual Test Scenarios

### Scenario 1: Complete Workflow
1. Create action item due tomorrow
2. Wait for 9 AM UTC (or manually trigger escalations)
3. Verify notification created
4. Check notification bell badge
5. Click bell to open center
6. See notification
7. Click mark as read
8. Verify styling changed
9. Filter to read notifications
10. Verify it's still there
11. Delete notification
12. Verify it's gone

### Scenario 2: Email Queue
1. Create action item
2. Escalation job creates notification
3. Email queue job enqueues email
4. Email worker sends email
5. Verify email status is 'sent'

### Scenario 3: Retry Logic
1. Enqueue email with bad recipient
2. Email worker tries to send
3. Marked as failed
4. Wait 1 minute
5. Worker retries
6. Still fails
7. Mark with error message
8. After 3 attempts, stop retrying

### Scenario 4: Bulk Notifications
1. Create 5 notifications at once via bulk API
2. Check list shows all 5
3. Mark all as read
4. Verify all are read
5. Filter shows only read

### Scenario 5: Pagination
1. Create 50 notifications
2. List with pageSize=20
3. Should show 3 pages
4. Navigate to page 2
5. Should show items 21-40
6. Navigate to page 3
7. Should show items 41-50

---

## 🔍 Debugging Tips

### Check Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Email worker logs
grep "EmailWorker" backend/logs/app.log

# Escalation job logs
grep "EscalationJob" backend/logs/app.log
```

### Database Queries
```sql
-- Check notifications
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Check email queue
SELECT id, recipient_email, status, attempts FROM notifications_queue ORDER BY created_at DESC;

-- Check indexes are being used
EXPLAIN ANALYZE SELECT * FROM notifications WHERE company_id = 'xxx' AND user_id = 'yyy';
```

### Network Requests
```javascript
// Open DevTools → Network tab
// Watch requests to /api/v1/notifications

// Check React Query cache
// In console: window.__REACT_QUERY_DEVTOOLS__
```

### React Debugging
```javascript
// Check query cache in React Query DevTools
// Install: npm install @tanstack/react-query-devtools
// Add to App.tsx: <ReactQueryDevtools />

// Check component props
// Use React DevTools extension
```

---

## ✅ Sign-Off Checklist

- [ ] All endpoints tested manually
- [ ] All hooks working correctly
- [ ] All components rendering properly
- [ ] Email queue processing emails
- [ ] Escalation job running at 9 AM UTC
- [ ] Notifications appearing in UI
- [ ] Unread badge showing correctly
- [ ] Filters working
- [ ] Pagination working
- [ ] Database tables created
- [ ] Indexes created
- [ ] Background workers starting/stopping
- [ ] Error handling working
- [ ] Security enforced
- [ ] Performance acceptable
- [ ] Documentation complete

---

## 📞 Support

If tests fail:
1. Check backend logs
2. Verify environment variables
3. Check database connection
4. Verify JWT token is valid
5. Check company_id matches
6. Review error messages
7. Check PHASE_3_COMPLETE.md for API details

---

**Ready for Phase 3 Testing!** ✅
