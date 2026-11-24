# SalonFlow — Flows & Queue Business Rules

This document establishes the state transitions, scheduling algorithms, waiting-time mathematical model, edge-case handlers, and comprehensive test checklist for SalonFlow.

---

## 1. End-to-End User Flows

### Flow A: Remote Customer (Online Mobile Entry)
```
[Customer on Mobile]
       │
       ▼
1. Visits / -> Checks Live Queue Length & Estimated Wait
       │
       ▼
2. Logs in / Registers -> Clicks "Join Queue" (/join)
       │
       ▼
3. Selects 1–3 Services (e.g., Haircut ₹150 + Beard Trim ₹80 = ₹230, 45m)
       │
       ▼
4. Selects Barber Preference ("Any Available Barber" OR specific barber e.g., "Amit")
       │
       ▼
5. Confirms Queue Entry
       │
       ▼
6. Backend validates:
   - Salon is open & Online Queue is open (> 30m before close).
   - Phone number has NO existing active token (status in WAITING, CALLED, IN_CHAIR).
   - Max online queue capacity not breached.
       │
       ▼
7. Token issued (e.g., SF-005) -> Redirects to /status/SF-005
       │
       ▼
8. Customer tracks live position from home / commute.
   - At Position 2: Banner prompts "Start heading to salon now".
       │
       ▼
9. Receptionist / Barber calls customer:
   - Status changes to CALLED.
   - Customer phone triggers "It's your turn! Proceed to Chair X".
   - TV Display flashes token + plays chime.
       │
       ▼
10. Customer arrives -> Barber taps "Start Service" -> Status becomes IN_CHAIR.
       │
       ▼
11. Service completes -> Barber taps "Complete Service" -> Status becomes DONE.
       │
       ▼
12. Customer submits 1–5 Star Rating & Review.
```

---

### Flow B: Walk-in Customer (In-Person Front Desk Entry)
```
[Customer walks into Salon]
       │
       ▼
1. Receptionist greets customer on /reception screen.
       │
       ▼
2. Receptionist clicks "+ Add Walk-in" modal.
       │
       ▼
3. Enters Customer Name, Mobile Number, Services, Barber preference.
       │
       ▼
4. Backend validates phone active state; assigns next sequential token.
       │
       ▼
5. Customer is placed into the exact same unified queue list based on arrival timestamp.
       │
       ▼
6. Walk-in token appears on Waiting Area TV (/display).
       │
       ▼
7. Customer waits in lounge until called on TV screen.
```

---

## 2. Queue Lifecycle State Machine

```
              ┌───────────────────────────┐
              │          WAITING          │
              └─────────────┬─────────────┘
                            │
               ┌────────────┴────────────┐
               │                         │
      (Customer cancels)        (Barber/Reception calls)
               │                         │
               ▼                         ▼
        ┌─────────────┐           ┌─────────────┐
        │  CANCELLED  │           │   CALLED    │
        └─────────────┘           └──────┬──────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                 (10 min no arrival)             (Arrived at chair)
                         │                               │
                         ▼                               ▼
                  ┌─────────────┐                 ┌─────────────┐
                  │   NO_SHOW   │                 │  IN_CHAIR   │
                  └─────────────┘                 └──────┬──────┘
                                                         │
                                                 (Barber finishes)
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │    DONE     │
                                                  └─────────────┘
```

### Transition Validation Matrix

| From Status | Allowed Target Status | Triggered By | Validation Rules |
|---|---|---|---|
| `WAITING` | `CALLED` | Receptionist / Barber | Barber must be Available; customer must be earliest eligible. |
| `WAITING` | `CANCELLED` | Customer / Receptionist | Allowed only while customer is still in `WAITING`. |
| `CALLED` | `IN_CHAIR` | Barber | Barber chair must be currently empty; timer starts. |
| `CALLED` | `NO_SHOW` | Receptionist | Customer failed to present after being called (recommended >10m). |
| `IN_CHAIR` | `DONE` | Barber | Service complete; releases barber; records service completion time. |
| *Any other* | *Any* | *Forbidden* | Returns HTTP 400 Bad Request: "Invalid status transition". |

---

## 3. Core Queue Business Rules

### Rule 1: First-Come, First-Served (FCFS) with Strict Barber Preference
- Every queue entry receives an immutable `created_at` timestamp and an incremental daily token number (`SF-001`, `SF-002`, ...).
- When Barber `B` is ready to call the next customer:
  - The queue engine queries all entries with status `WAITING`, ordered by `created_at ASC`.
  - Eligible entry condition: `(preferred_barber_id == B.id) OR (preferred_barber_id IS NULL)`.
  - The earliest waiting entry satisfying this condition is selected.
- **Strict Barber Lock:** If Customer `C1` selected Barber `Ravi`, Barber `Amit` will **never** be assigned `C1`, even if `C1` arrived earlier than other customers. `Amit` will bypass `C1` and serve the next customer who requested `Amit` or `Any`.

### Rule 2: Single Customer Per Barber In Chair
- A barber can have at most **ONE** active customer in `IN_CHAIR` status at any given time.
- Attempting to call or start a customer while another customer is `IN_CHAIR` with that barber is blocked by database constraints and transactional checks.

### Rule 3: Single Active Token Per Phone Number
- A phone number can only have **one active entry** across statuses `WAITING`, `CALLED`, and `IN_CHAIR`.
- If a customer attempts to join while already in queue, the API returns HTTP 409 Conflict with the active token payload.

### Rule 4: No-Show Rejoining Rule
- If a customer is marked `NO_SHOW`, their token is finalized and permanently closed.
- If the customer later arrives and wishes to be served, they must be registered as a **new entry** at the **end of the queue** with a fresh token. No jumping back to the front.

### Rule 5: Barber On-Break Handling
- If a barber toggles status to `ON_BREAK`:
  - They are excluded from calling next customers.
  - Customers viewing `/join` or `/status` see an indicator: "[Barber Name] is currently on break".
  - If a customer chose that barber, the estimated waiting time includes the estimated break duration (default 15 mins).

### Rule 6: Online Queue Operating Window
- Online queue joining closes exactly **30 minutes before the salon's closing time** (`closing_time - 30 minutes`).
- If online queue is closed, the `/join` API returns HTTP 403 Forbidden with message: "Online queue is closed for today. Walk-ins accepted at reception."
- In-person walk-ins can still be added by the receptionist as long as the salon is officially open.

---

## 4. Mathematical Model for Waiting-Time Estimation

Unlike naive static estimates, SalonFlow calculates wait time dynamically on the server:

### Formula
For a customer $C$ who preferred Barber $B$ (or Any):
$$\text{Estimated Wait}(C) = \text{Remaining Active Service Time} + \sum_{k \in \text{Ahead}(C)} \text{Duration}(k) \div N_{\text{effective}}$$

Where:
1. $\text{Ahead}(C)$ is the set of all customers in status `WAITING` created prior to $C$ who are eligible to be served by the same barber pool.
2. For specific barber preference $B$:
   - $N_{\text{effective}} = 1$.
   - Wait = Remaining time of customer currently in chair with $B$ + sum of durations of earlier waiting customers who picked $B$ or were assigned to $B$.
3. For "Any Available Barber":
   - $N_{\text{effective}} = \text{Count of currently active, on-duty, non-break barbers}$.
   - Wait = $\frac{\sum \text{Remaining Chair Times} + \sum \text{Durations of Unassigned Waiting Ahead}}{N_{\text{effective}}}$.
4. A minimum floor of 5 minutes is applied if the barber is currently wrapping up.

---

## 5. Comprehensive Quality Assurance Checklist (18 Scenarios)

1. [ ] **Customer Registration:** Validates email format, 10-digit phone number, password strength, and hashes password securely.
2. [ ] **Customer Login:** Issues valid JWT access and refresh tokens; returns role `customer`.
3. [ ] **Password Security:** Rejects wrong passwords with 401; securely handles authentication errors.
4. [ ] **RBAC Protection (Customer -> Admin):** Customers attempting to hit `/api/admin/*` receive 403 Forbidden.
5. [ ] **RBAC Protection (Receptionist -> Owner):** Receptionist cannot update salon settings or delete staff accounts.
6. [ ] **Queue Entry Creation:** Customer successfully selects services and joins queue; receives token `SF-001`.
7. [ ] **Duplicate Prevention:** Same phone number attempting second active queue entry receives 409 Conflict.
8. [ ] **Barber Preference Respect:** Customer selecting Barber Ravi is skipped when Barber Amit calls next.
9. [ ] **Call Next Algorithm:** Selects earliest eligible customer according to FCFS and barber preference.
10. [ ] **Concurrency & Chair Limit:** Barber cannot have two customers simultaneously in `IN_CHAIR`.
11. [ ] **Status Transitions:** Transitions `WAITING` → `CALLED` → `IN_CHAIR` → `DONE` succeed; backwards transitions fail.
12. [ ] **No-Show Resolution:** Called customer marked `NO_SHOW` exits active list; rejoining gets new token at the end.
13. [ ] **Customer Cancellation:** Customer in `WAITING` can cancel; token transitions to `CANCELLED` and drops from line.
14. [ ] **Dynamic Wait Time Recalculation:** When a service completes, estimated wait times for downstream customers update.
15. [ ] **WebSocket Broadcast:** Action on Barber screen reflects on Receptionist and TV `/display` within 1 second.
16. [ ] **Online Queue Cutoff:** Joining online within 30 minutes of closing is rejected with friendly message.
17. [ ] **Bilingual Toggle:** Switching to Gujarati updates all labels seamlessly without losing page state.
18. [ ] **PostgreSQL Persistence:** All queue states, customer records, and review data persist across server restarts.
