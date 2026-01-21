# Phase 3: Quick Reference

## What Was Built

### Backend (10 files)
1. **notificationService.ts** - CRUD for notifications
2. **emailQueueService.ts** - Email queue with retry (1min→5min→30min)
3. **escalationService.ts** - Escalation rules and automation
4. **escalationJob.ts** - Daily cron at 9 AM UTC
5. **notifications.ts** - 5 API endpoints
6. **emailWorker.ts** - Background email sender
7. **routes/index.ts** - Updated with notifications router
8. **server.ts** - Updated to start workers/jobs

### Frontend (9 files)
1. **useNotifications.ts** - React Query hooks
2. **NotificationBell.tsx** - Header bell component
3. **NotificationItem.tsx** - Card component
4. **NotificationCenter.tsx** - Full notification UI
5. **NotificationsPage.tsx** - Page component
6. **NotificationBell.css** - Bell styling
7. **NotificationItem.css** - Card styling
8. **NotificationCenter.css** - UI styling
9. **NotificationsPage.css** - Page styling

### Database (2 tables)
- `notifications` - In-app notifications
- `notifications_queue` - Email queue with retry

## Routes Added

### API Routes
```
GET    /api/v1/notifications         - List notifications
GET    /api/v1/notifications/:id     - Get single
PATCH  /api/v1/notifications/:id/read - Mark as read
PATCH  /api/v1/notifications/read-all - Mark all read
DELETE /api/v1/notifications/:id     - Delete
```

### Frontend Routes
```
/notifications - NotificationsPage
```

## Key Features

### Escalation Rules
| Rule | Condition | Threshold | Action |
|------|-----------|-----------|--------|
| overdue_1_day | is_overdue | 1 day | notify_owner |
| overdue_3_days | is_overdue | 3+ days | notify_project_manager |
| due_tomorrow | due_soon | 1 day | notify_owner |
| due_3_7_days | due_soon | 3-7 days | notify_team |

### Email Retry Strategy
- Attempt 1: Immediately
- Attempt 2: After 1 minute
- Attempt 3: After 5 minutes
- Attempt 4: After 30 minutes
- Max attempts: 3

### Environment Variables
```env
# Email Configuration
MAIL_FROM=noreply@example.com
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-password
```

## Hooks Usage

```typescript
// List notifications
const { data } = useNotifications({ page: 1, pageSize: 20 })

// Get unread count
const { data: unread } = useUnreadNotificationCount()

// Get single
const { data: notification } = useNotification(id)

// Mark as read
const markRead = useMarkNotificationAsRead()
markRead.mutate(id)

// Mark all as read
const markAllRead = useMarkAllNotificationsAsRead()
markAllRead.mutate()

// Delete
const deleteNotif = useDeleteNotification()
deleteNotif.mutate(id)
```

## Components Usage

```typescript
// Bell with unread badge
<NotificationBell onClick={() => setShowCenter(true)} />

// Full center (modal/drawer)
<NotificationCenter onClose={() => setShowCenter(false)} />

// Individual notification
<NotificationItem
  notification={data}
  onRead={handleRead}
  onDelete={handleDelete}
/>
```

## Backend Usage

```typescript
// Create notification
await notificationService.createNotification(companyId, {
  user_id: userId,
  title: 'Item due',
  message: 'Action item is due tomorrow',
  type: 'warning',
  action_item_id: itemId
})

// Queue email
await emailQueueService.enqueueEmail(companyId, {
  recipient_email: 'user@example.com',
  subject: 'Reminder',
  body: 'Your action item is due'
})

// Escalate items
await escalationService.runDailyEscalations(companyId)

// Bulk notify
await notificationService.createBulkNotifications(companyId, [userId1, userId2], {
  title: 'Team Update',
  message: 'New action items assigned',
  type: 'info'
})
```

## Monitoring

```typescript
// Email worker status
emailWorker.getEmailWorkerStatus()
// { running: true, batchSize: 10 }

// Escalation job status
escalationJob.getEscalationJobStatus()
// { running: true, nextDate: 2024-01-20T09:00:00Z }

// Email queue stats
await emailQueueService.getEmailQueueStats(companyId)
// { pending: 5, sent: 100, failed: 2, retrying: 1, avg_processing_time: 2.5 }
```

## Testing Checklist

- [ ] Create action item with due date
- [ ] Run escalations manually
- [ ] Verify notifications created
- [ ] Check email queue
- [ ] Mark notification as read
- [ ] Test notification bell badge
- [ ] Filter notifications by read status
- [ ] Delete notification
- [ ] Test pagination
- [ ] Verify old notifications cleanup (30+ days)
- [ ] Check email retry logic
- [ ] Verify escalation logs

## Common Issues

**Email not sending**: Check MAIL_* environment variables and nodemailer installation
**Escalation not running**: Verify cron schedule is set to 9 AM UTC
**Unread badge not updating**: Check React Query cache invalidation
**Notifications not showing**: Verify company_id and user_id in request context

## Performance

- Notification list: Paginated (default 20 per page)
- Email processing: 10 emails per batch, 1-second delay
- Unread count: Cached for 1 minute
- Escalation job: Runs once daily
- Database indexes: On company_id, user_id, created_at, status

## Files Count & Lines

- Backend services: 4 files, 770 lines
- Routes & jobs: 3 files, 200 lines
- Frontend hooks: 1 file, 180 lines
- Frontend components: 3 files, 350 lines
- Frontend styles: 4 files, 1,200 lines
- Documentation: 2 files, 2,500 lines
- **Total Phase 3: 20 files, 5,200+ lines**
