# SalonFlow — Screens & Features Specification

This document details every screen in the SalonFlow application: purpose, route, access level, UI components top-to-bottom, interactions, and responsive states.

---

## 1. Screen Catalog & Routes

| # | Screen Name | Route | Allowed Roles | Primary Device Target |
|---|---|---|---|---|
| 1 | Home / Customer Landing | `/` | Public / Customer | Mobile / Desktop |
| 2 | Login | `/login` | Public (Unauthenticated) | Mobile / Desktop |
| 3 | Customer Registration | `/register` | Public (Unauthenticated) | Mobile / Desktop |
| 4 | Join Queue | `/join` | Customer | Mobile-first |
| 5 | My Queue Status | `/status/:id` | Customer (owner of token) | Mobile-first |
| 6 | Customer Profile & History | `/profile` | Customer | Mobile / Tablet |
| 7 | Receptionist Dashboard | `/reception` | Receptionist, Owner | Desktop / 10-inch Tablet |
| 8 | Barber Station Console | `/barber` | Barber, Owner | Mobile / Tablet |
| 9 | Owner Analytics & Admin | `/admin` | Salon Owner / Admin | Desktop |
| 10 | Waiting Area TV Display | `/display` | Public / Salon TV | 1080p / 4K Full-screen TV |

---

## 2. Screen Specifications

### Screen 1: Home & Customer Portal (`/`)
- **Target User:** Prospective or returning salon customer.
- **Purpose:** Inform customer of salon availability, live wait time, active barbers, and provide one-click entry to join the queue.
- **UI Elements (Top to Bottom):**
  - **Header:** SalonFlow logo (golden scissors + elegant modern typography), Language toggle (English / ગુજરાતી), Auth status (Login button or Customer Avatar + Name + Logout).
  - **Salon Status Banner:** 
    - Badge: "Salon Open · Closes 9:00 PM" (Green dot) or "Salon Closed · Opens Tomorrow 9:00 AM" (Gray dot).
    - Online Queue Badge: "Online Queue Open" (Green) or "Online Queue Closed" (Amber; closes 30m before salon closing).
  - **Live Wait Hero Card (Light navy gradient/accent):**
    - Large metric: Current waiting count (e.g., "4 people in line").
    - Estimated wait time: (e.g., "~35 mins expected wait").
    - Available barbers count: (e.g., "3 of 4 Barbers on duty").
  - **Duty Barbers Strip:**
    - Barber chips with avatar, name, and live status badge:
      - Available (Green)
      - Serving (Indigo)
      - On Break (Amber)
  - **Primary Action:**
    - Large Gold/Indigo CTA: `[ + Join Queue Now ]` (Disabled with tooltip if online queue is closed or salon is closed).
  - **Popular Services Carousel / Grid:**
    - Cards displaying top services: Haircut (₹150), Beard Trim (₹80), Hair Spa (₹400) with durations.
  - **Footer:** Salon address, phone number, operating hours, and link to Waiting Display (`/display`).

---

### Screen 2: Login (`/login`)
- **Target User:** All roles (Customer, Receptionist, Barber, Admin).
- **Purpose:** Secure credential authentication.
- **UI Elements:**
  - Centered luxury card with subtle gold trim.
  - SalonFlow logo and tagline: "Smart Salon. Zero Waiting."
  - Role quick-demo credential selector buttons (One-click fill for evaluation: Owner, Receptionist, Barber Ravi, Customer Amit).
  - Form fields:
    - Email or 10-digit Phone Number input with clear icon.
    - Password field with Show/Hide toggle icon.
  - Options row: "Remember me" checkbox and "Forgot password?" link.
  - Action button: `[ Sign In ]` with loading spinner.
  - Switch prompt: "Don't have an account? Register as Customer".
  - Validation: Client-side field presence + backend 401 error message banner.

---

### Screen 3: Registration (`/register`)
- **Target User:** New customer.
- **Purpose:** Onboard customer with verified phone number and credentials.
- **UI Elements:**
  - Brand header with back-to-login link.
  - Form inputs:
    - Full Name (required, min 2 chars).
    - Email Address (valid format).
    - Mobile Phone Number (10 digits Indian format `^[6-9]\d{9}$`).
    - Password (min 8 chars, strength meter).
    - Confirm Password (must match).
  - Terms of service & privacy agreement checkbox.
  - Action button: `[ Create Account ]`.
  - Redirect: On success, auto-login or redirect to `/login` with success toast.

---

### Screen 4: Join Queue (`/join`)
- **Target User:** Authenticated customer.
- **Purpose:** Configure service package, choose barber preference, view pricing & time estimates, and confirm queue entry.
- **UI Elements:**
  - Progress bar: Step 1: Services → Step 2: Barber → Step 3: Confirmation.
  - **Step 1: Service Selection:**
    - Search input to filter services.
    - Service cards in 2-column grid:
      - Service Name (English & Gujarati)
      - Duration badge (e.g. `30 min`)
      - Price tag (e.g. `₹150`)
      - Checkbox/Selection ring (max 3 services selectable at one visit).
  - **Step 2: Barber Selection:**
    - "Any Available Barber (Fastest Wait)" card highlighted with sparkle icon.
    - Individual Barber Cards:
      - Photo avatar, Name, Specialization tags (e.g., "Fades & Styling", "Beard Sculpting").
      - Current status: "Free now", "Busy (finish in ~15m)", "On Break".
  - **Step 3: Live Summary Panel (Sticky Bottom on Mobile / Sidebar on Desktop):**
    - Selected items breakdown.
    - Total Duration calculation (e.g., `45 min`).
    - Total Price calculation (e.g., `₹230`).
    - Estimated Wait to Chair (e.g., `~25 min`).
    - Action button: `[ Confirm & Join Queue ]`.
  - **Guards & Validation:**
    - If customer already has an active queue entry (`WAITING` or `CALLED`), alert banner: "You already have an active token: SF-002" with a button to view `/status/:id`.

---

### Screen 5: My Queue Status (`/status/:id`)
- **Target User:** Customer who joined queue.
- **Purpose:** Real-time personal queue tracker with stage-specific guidance.
- **UI Elements:**
  - **Header:** Salon info + live clock.
  - **Big Token Card:**
    - Massive font: `SF-004`.
    - Live Queue Position: "3rd in line ahead of you".
    - Barber Assigned / Preference: "Barber: Amit" (or "Any Barber").
    - Circular Progress / Countdown: Estimated wait time `~25 mins`.
  - **Dynamic Stage Banners:**
    - *Position > 2:* "Sit back and relax. We'll alert you when to head over." (Blue/Navy)
    - *Position == 2 (Almost Next):* "⚠️ Start heading to the salon now! You're almost next." (Amber highlight)
    - *Status == CALLED:* Full-screen celebratory champagne gold card with pulse animation:  
      **"IT'S YOUR TURN!"**  
      "Please proceed to Chair 2 (Barber Amit). Your barber is ready for you!"
    - *Status == IN_CHAIR:* "You're in the chair! Enjoy your service." (Service timer running)
    - *Status == DONE:* "Service Completed! Thank you for visiting SalonFlow." Includes 5-star rating widget.
  - **Service Breakdown Card:** List of services chosen, total price `₹...`.
  - **Actions:**
    - `[ Cancel My Spot ]` button (enabled only when status is `WAITING`). Triggers confirmation modal: "Are you sure? You will lose your position in line."
    - Auto-reconnect indicator for WebSocket sync.

---

### Screen 6: Receptionist Live Console (`/reception`)
- **Target User:** Salon Receptionist and Front Desk Manager.
- **Purpose:** Primary operational hub for walk-ins, queue management, no-show handling, and barber chair oversight.
- **Layout (Split View on Desktop / Tabbed on Tablet):**
  - **Top KPI Statistics Cards:**
    - Today's Total Customers
    - Currently Waiting
    - Currently Being Served
    - Completed Services Today
    - Average Wait Time (mins)
  - **Action Toolbar:**
    - Search input (filter by customer name, phone, or token).
    - Status Filter dropdown (`All`, `Waiting`, `Called`, `In Chair`).
    - Primary Button: `[ + Add Walk-in Customer ]` (opens modal).
  - **Left / Top Section: Barber Station Cards (Grid):**
    - Card for each registered barber:
      - Avatar + Name
      - Status pill: Available (Green) / Busy (Indigo) / On Break (Amber).
      - If Busy: Active customer name, token, services, elapsed timer (mm:ss).
      - Quick Action: `[ Call Next ]` button (active if barber is Available; triggers backend Call Next algorithm).
  - **Right / Bottom Section: Unified Live Queue Table:**
    - Columns: Token #, Customer Name, Phone, Selected Services, Preferred Barber, Waiting Since, Est. Wait, Status, Actions.
    - Visual indicators: Row highlighted in Amber if waiting > 60 minutes.
    - Row Actions:
      - `[ Call Next ]` (if Waiting)
      - `[ Mark No-Show ]` (if Called > 10m)
      - `[ Cancel ]` (with confirmation)
      - `[ View Details ]` modal
  - **Walk-in Modal Form:**
    - Full Name, Phone (10 digits), Services multi-select, Barber preference dropdown.
    - Submit adds directly to queue end and prints/displays generated token.

---

### Screen 7: Barber Station Dashboard (`/barber`)
- **Target User:** Salon Stylists / Barbers (Ravi, Amit, Imran, Vikram).
- **Purpose:** Station-level tool to manage active clients, view next queue candidate, and manage breaks.
- **UI Elements:**
  - **Barber Status Header:**
    - Barber photo, name, chair number.
    - Duty toggle: `[ Available ]` ↔ `[ Take a Break ]` (with break duration notice).
  - **Current Customer Card (Active Service):**
    - If serving: Customer Name, Token (e.g. `SF-003`), Services, Elapsed Service Timer (`18:42` with target progress bar).
    - Big Action Buttons:
      - If Called: `[ Start Service ]` (transitions customer to `IN_CHAIR`, starts timer).
      - If In Chair: `[ Complete Service ]` (transitions customer to `DONE`, records duration, frees chair).
    - If Idle: "No customer in chair. Ready for next client." `[ Call Next Customer ]`.
  - **Upcoming Client Preview Card:**
    - "Next in line for you:" Name, Token, Services, Wait time.
  - **Barber Today Summary:**
    - Completed cuts today, total active chair time, average service rating.

---

### Screen 8: Owner / Admin Management & Analytics (`/admin`)
- **Target User:** Salon Owner / Administrator.
- **Layout:** Sidebar navigation + responsive content canvas.
- **Tabs/Sub-modules:**
  1. **Analytics & Performance:**
     - KPI Metric Cards: Revenue Today, Total Served, Active Queue, Avg Wait Time, Top Service.
     - Charts (Recharts):
       - Daily & Hourly Customer Traffic (Bar Chart)
       - Weekly Revenue Trend (Line Chart)
       - Popular Services Distribution (Pie/Donut Chart)
       - Barber Performance & Throughput (Horizontal Bar Chart)
  2. **Service Catalog Management:**
     - Table of all services: Name (EN/GU), Duration (mins), Price (₹), Status (Active/Inactive), Actions (Edit, Delete, Toggle).
     - `[ + Add Service ]` modal.
  3. **Barber Management:**
     - Barber profiles, photos, specialties, daily schedule, on-duty status toggle, performance stats.
  4. **Staff Management:**
     - User accounts with role assignments (Receptionist, Barber, Admin).
     - Password reset, account deactivation.
  5. **Salon Operations Settings:**
     - Salon Name, Logo, Address, Contact Phone.
     - Operating Hours (Open Time, Close Time).
     - Working Days checkboxes.
     - Online Queue Master Switch: `[ Open / Closed ]`.
     - Max Online Queue Capacity (e.g., 25).

---

### Screen 9: Waiting Area TV Display (`/display`)
- **Target User:** Salon customers sitting in the lounge / waiting area.
- **Device:** 1080p / 4K Wall-mounted Smart TV / HDMI Display (Full-screen mode via F11).
- **Layout & Visual Hierarchy:**
  - Dark luxury theme with high-contrast Champagne Gold and Crisp White typography (readable from 5+ meters).
  - **Top Banner:**
    - Left: SalonFlow logo + Salon Name.
    - Center: Live Digital Clock & Date (e.g., `11:45 AM · Saturday, 24 Nov`).
    - Right: Salon announcements ticker (e.g., "Welcome to SalonFlow · Complimentary Wi-Fi available").
  - **Main Split Display:**
    - **Left Section (60%): "Now In Chair / Being Served"**
      - Grid of chairs/barbers:
        - Barber Name & Chair #
        - Large Token # (e.g., `SF-002`)
        - Customer First Name
        - Service(s) being performed
        - Live service progress ring
    - **Right Section (40%): "Up Next" Waiting Queue**
      - Numbered list of next 5 waiting tokens:
        - Position (1 to 5), Token # (e.g., `SF-005`), Preferred Barber / Any, Est. Wait (e.g., `10m`).
  - **Live Audio-Visual Alert Interaction:**
    - When any token status transitions to `CALLED`:
      - Full-screen animated overlay or flashing gold border on token.
      - Large display: `NOW SERVING: SF-004 → CHAIR 1 (AMIT)`.
      - Clear two-tone audio chime played via Web Audio API.
