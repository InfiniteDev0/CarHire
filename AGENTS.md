<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->





## Core Event System

Implement a centralized event-driven architecture where application events trigger background workflows.

Examples:

* User registered
* Email verified
* User logged in
* Password changed
* Password reset requested
* Profile updated
* Item created
* Item updated
* Item deleted
* Comment created
* Notification created
* Subscription renewed
* Payment received
* Admin action performed

Each event should be easy to extend with additional workflows without changing existing business logic.

---

## Notification System

Build a complete notification system.

Support:

* In-app notifications
* Real-time notifications using Supabase Realtime
* Browser push notifications
* Email notifications
* Read/unread status
* Notification history
* Notification preferences
* Notification categories
* Batched notifications when appropriate

---

## Background Processing

Move expensive or slow work out of request handlers.

Examples:

* Send emails
* Process uploads
* Generate thumbnails
* Clean temporary data
* Refresh caches
* Generate reports
* Retry failed operations
* Import/export data
* Scheduled reminders

---

## Redis Usage

Introduce Redis for:

* API rate limiting
* Caching expensive database queries
* Queue storage
* Temporary verification data
* Password reset tokens
* OTP storage
* Session caching (where appropriate)
* Idempotency keys
* Distributed locks

---

## Scheduled Jobs

Create recurring jobs for:

* Cleaning expired data
* Removing expired sessions
* Sending reminders
* Weekly summaries
* Monthly reports
* Refreshing cached data
* Monitoring failed jobs
* Security audits

---

## Security Improvements

Use Redis and background jobs to support:

* Rate limiting
* Brute-force protection
* Login attempt tracking
* Security notifications
* Audit logs
* Suspicious activity detection

---

## Architecture Principles

The application should be:

* Event-driven
* Modular
* Scalable
* Asynchronous where appropriate
* Observable
* Easy to extend with new event handlers
* Production-ready

Business logic should not directly send emails or notifications. Instead, business logic should publish events, and background workers should react to those events. This keeps the system clean, maintainable, and scalable.

The "make it feel alive" vision
That AGENTS.md is a big, multi-service architecture (Inngest, Resend, Redis, cron, audit logs…). Since you're doing Redis yourself, and Inngest/Resend need their own accounts, the highest-value piece I can build right now with zero new services is:

Supabase Realtime → in-app notifications and lists update live (no refresh) — a rental gets created/paid/overdue and every open tab reacts instantly. This is the single biggest "alive" win and it's already half-built (you have the notifications system + web push).
A small central event helper so every action (payment.received, rental.overdue, complaint.filed…) publishes one event that fans out to: DB notification row → web push → (later) email/Inngest — exactly the flow in your doc, without rewiring business logic each time.
Then Resend (emails) and Inngest (background jobs/cron) slot into that event helper once you add those accounts.

Want me to start with Supabase Realtime live notifications now (concrete, no new accounts), and scaffold the event helper so Resend/Inngest plug in later? I held build/lint per your earlier note — say the word and I'll also run one verify pass on the push fix. lets set this up one by one okay break it down in to phases until we achiev the ruiqured goal 