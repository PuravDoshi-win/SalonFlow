# AGENTS.md — SalonFlow Engineering Instructions

This document is the primary instruction file for autonomous development agents and engineers working on **SalonFlow**.

---

## 1. Project Summary
**SalonFlow** is a commercial-grade, multi-role salon queue management SaaS system designed as an MSc IT practical examination project. It connects customers, receptionists, barbers, and salon owners through a centralized Python/FastAPI backend, PostgreSQL database, React frontend, and real-time WebSockets synchronization.

---

## 2. Mandatory Documentation References
Before writing or modifying any code, consult:
- `docs/01-brief.md`: Project scope, user roles, must-haves, out-of-scope boundaries, brand identity.
- `docs/02-screens.md`: Complete specifications for all 10 screens, UI components, states, and responsive views.
- `docs/03-flows-rules.md`: Queue state machines, barber allocation rules, waiting-time formula, and 18-point QA checklist.

---

## 3. Technology Stack & Directory Structure

### Stack
- **Frontend:** React 19 / Vite, Tailwind CSS, React Router DOM v7, Axios, Lucide React, Recharts, Sonner / Hot Toast.
- **Backend:** Python 3.12+ / FastAPI, SQLAlchemy 2.0 (async or robust sync), Pydantic v2, Alembic migrations, Pytest.
- **Security:** Passlib (Bcrypt / Argon2), Python-Jose / PyJWT, HTTPBearer, Role-Based Access Control (RBAC).
- **Database:** PostgreSQL (with proper relational constraints, indexes, and transactions).
- **Real-Time:** FastAPI native WebSockets with pub/sub connection manager.

### Directory Layout
```
ITP_project/
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI widgets (cards, modals, badges, tables)
│   │   ├── pages/           # Screen views (Home, Join, Status, Reception, Barber, Admin, Display)
│   │   ├── layouts/         # DashboardLayout, AuthLayout, TVLayout
│   │   ├── hooks/           # useQueue, useWebSocket, useAuth, useTranslation
│   │   ├── context/         # AuthContext, LanguageContext, QueueContext
│   │   ├── services/        # Axios API client modules
│   │   ├── i18n/            # Centralized translations (en.json, gu.json)
│   │   └── utils/           # Time formatters, token generators, sound synthesis
│   ├── index.html
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (auth, customers, services, queue, barbers, admin, reviews)
│   │   ├── core/            # Config, security, database session, hashing, dependencies
│   │   ├── models/          # SQLAlchemy ORM models (13 tables)
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── services/        # Business logic (queue engine, waiting time calculator)
│   │   ├── repositories/    # Database query access layers
│   │   ├── websocket/       # ConnectionManager and real-time broadcast engine
│   │   └── main.py          # Application entrypoint and CORS
│   ├── alembic/             # Database migrations
│   ├── tests/               # Pytest suite for 18 test cases
│   └── requirements.txt
│
├── docs/                    # Architectural documents
├── README.md                # Project documentation with live demo & credentials
└── .env.example             # Standardized environment template
```

---

## 4. Engineering & Styling Guidelines

1. **Visual Theme & Styling:**
   - Primary Deep Navy: `#253247`
   - Secondary Indigo: `#596FE0`
   - Background Canvas: `#F5F7FB`
   - Card Background: `#FFFFFF` with borders `#E2E8F0` and subtle shadows (`shadow-sm`, `shadow-md`)
   - Accent Champagne Gold: `#D4AF72`
   - Semantic: Soft Green `#10B981`, Amber `#F59E0B`, Danger Red `#EF4444`.
   - Never use garish neon colors or excessive gradients. Maintain a calm, high-end salon aesthetic.

2. **Centralized Queue Logic:**
   - All queue decisions (eligibility, calling next, status transitions, wait-time computation) **MUST** occur on the Python backend. The frontend must never calculate or mutate queue state independently.

3. **Concurrency & Integrity:**
   - Use database transactions and row-level locking where applicable to prevent two barbers from calling the same customer or assigning a customer to a busy chair.

4. **Localization (English & Gujarati):**
   - Zero hardcoded English strings in UI components. Every label, button, and notification must be keyed through the translation system (`en` and `gu`).

5. **Demo Accounts & Seeding:**
   - Provide pre-seeded database accounts for immediate evaluation:
     - Owner / Admin: `owner@salonflow.com` / `Owner@123`
     - Receptionist: `reception@salonflow.com` / `Staff@123`
     - Barbers: `ravi@salonflow.com`, `amit@salonflow.com`, `imran@salonflow.com`, `vikram@salonflow.com` / `Barber@123`
     - Customer: `customer@salonflow.com` / `Customer@123`
