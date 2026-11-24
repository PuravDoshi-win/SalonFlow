# SalonFlow — Project Brief & Scope

**Application Name:** SalonFlow  
**Tagline:** Smart Salon. Zero Waiting.  
**Academic Context:** MSc IT Lab Assignment / Practical Examination Project  
**Author:** Full-Stack Engineering Team  

---

## 1. Problem Statement
In traditional and high-end salons alike, weekends and peak evening hours cause severe bottlenecks. Customers sit in crowded waiting areas for 1–2 hours without transparent visibility into their turn, leading to customer walkouts, frustration, disputes over arrival order, and inefficient barber utilization. Furthermore, receptionists struggle with paper tokens or disconnected spreadsheets, while salon owners lack real-time visibility into barber productivity, queue times, and revenue.

**SalonFlow** eliminates physical waiting by providing a smart, digital queue management SaaS platform that empowers customers to join queues remotely, monitor live wait times, and receive real-time notifications, while providing receptionists, barbers, and owners with purpose-built operational interfaces and a live waiting-area TV display.

---

## 2. Target Users & Roles

1. **Customer (Online & Walk-in):**
   - Discovers salon open/closed status, current queue length, and estimated wait.
   - Selects one or multiple services with transparent durations and Indian Rupee (₹) pricing.
   - Chooses a preferred barber or selects "Any Available Barber" (fastest).
   - Receives a unique branded token (e.g., `SF-001`) with live progress, countdown, and turn alerts.
   - Can cancel before being called and submit 1–5 star reviews with feedback upon completion.
   - Seamlessly toggles between English and Gujarati.

2. **Receptionist:**
   - Monitors live queue dashboard, barber status cards, and service timers.
   - Quickly admits walk-in customers into the unified first-come-first-served queue.
   - Calls the next eligible customer for an available barber adhering strictly to customer barber preferences.
   - Manages exceptions: marks no-shows (after 10 minutes) or processes customer cancellations.
   - Views alerts for customers waiting > 60 minutes.

3. **Barber:**
   - Dedicated mobile- and tablet-friendly station view.
   - Controls personal availability (Available vs. On Break).
   - Views assigned customer, requested service package, total duration, and real-time elapsed timer.
   - Moves queue lifecycle: "Start Service" (In Chair) → "Complete Service" (Done).
   - Enforces the strict rule that a barber can serve only one customer at a time.

4. **Salon Owner / Administrator:**
   - Comprehensive analytics & revenue dashboard with PostgreSQL-backed metrics and interactive Recharts visualizations (traffic trends, service popularity, barber performance).
   - Service Catalog Management: CRUD on services, pricing, durations, active toggles.
   - Barber Management: Staff accounts, specialization tags, active duty toggles.
   - Staff Management: Receptionist and barber credential administration and role assignments.
   - Salon Operations Settings: Opening/closing hours, max online queue capacity, online queue toggle, contact info.

---

## 3. Must-Have Features (Core Scope)

1. **Role-Based Authentication & Authorization:**
   - Secure registration for customers.
   - Owner-managed staff accounts (Receptionist, Barber, Admin).
   - Argon2/Bcrypt password hashing, JWT Access Tokens + secure Refresh Token rotation.
   - Protected route guards on frontend and dependency-injected RBAC on backend.

2. **Smart Queue Algorithm & Engine:**
   - Strict status state machine: `WAITING` → `CALLED` → `IN_CHAIR` → `DONE`.
   - Branching transitions: `WAITING` → `CANCELLED`, `CALLED` → `NO_SHOW`.
   - Barber preference enforcement: specific barber selection is never reassigned; "Any" picks earliest eligible.
   - Server-side estimated waiting time dynamically computed from remaining active service time + durations ahead.
   - Anti-duplicate rule: maximum 1 active queue entry per phone number.

3. **Unified Walk-in & Online Queue Synchronization:**
   - Receptionist walk-ins enter the exact same queue sequence as mobile online entries.

4. **Receptionist Queue Console & Barber Station Boards:**
   - Real-time queue table with instant search and status filters.
   - Barber status cards showing live customer, elapsed timer, and one-click "Call Next".

5. **Waiting Area Full-Screen TV Display (`/display`):**
   - High-contrast, large-typography board for television screens.
   - Currently served tokens per barber, upcoming 5 tokens with estimated wait, announcements banner.
   - Visual gold pulse animation + Web Audio chime when a token is called.

6. **Customer Portal & Live Token Tracker:**
   - Mobile-first status screen with dynamic alerts: "Start coming to salon" when 2nd in line; "It's your turn!" when called.

7. **Bilingual Localization (English & Gujarati):**
   - Centralized i18n dictionary covering all customer and staff interfaces.

8. **Customer Feedback & Ratings:**
   - 1 to 5 star rating + review text upon service completion, restricted to 1 review per queue entry.

9. **Owner Analytics & Business Intelligence:**
   - Revenue, throughput, wait-time averages, Recharts bar/line/pie charts populated from live PostgreSQL transactions.

---

## 4. "Don't Build" List (Explicit Out-of-Scope)

To ensure laser focus on the MSc IT grading criteria and queue management excellence, the following are explicitly out of scope:
- **No Online Payment Gateways:** Salon services are settled at reception via cash/UPI in person; no Stripe/Razorpay SDKs required.
- **No Future-Date Appointments/Calendar Bookings:** SalonFlow is purely a live, same-day queue system ("Smart Salon. Zero Waiting.").
- **No Paid SMS / WhatsApp Gateway APIs (e.g., Twilio):** All real-time updates and alerts are powered by WebSockets, in-app badges, browser notifications, and sound chimes.
- **No Multi-Branch / Multi-Tenant Salon Chains:** Single-salon architecture with multi-chair, multi-barber setup.
- **No Complex Loyalty Point Systems / Gift Cards:** Standard customer profile and visit history only.

---

## 5. Look & Feel Identity

- **Design Philosophy:** Clean, spacious, commercial SaaS product matching the premium salon dashboard benchmark.
- **Color Palette:**
  - Primary: Deep Navy (`#253247`) — headers, active nav items, high-emphasis text
  - Secondary: Indigo (`#596FE0`) — interactive buttons, badges, links
  - Background: Crisp Light Blue-Gray (`#F5F7FB`) — app canvas
  - Surface/Cards: Pure White (`#FFFFFF`) — rounded cards with subtle borders (`#E2E8F0`) and soft elevation shadows (`shadow-sm`, `shadow-md`)
  - Luxury Accent: Champagne Gold (`#D4AF72`) — token highlights, VIP badges, "It's your turn!" celebratory alerts
  - Semantic: Soft Green (`#10B981`) for completed/available, Soft Amber (`#F59E0B`) for waiting/break, Soft Red (`#EF4444`) for cancelled/no-show.
- **Typography & Accessibility:** Inter / Plus Jakarta Sans font family, minimum 44px touch targets on mobile, high-contrast readable elements for TV display viewable from 5+ meters.
