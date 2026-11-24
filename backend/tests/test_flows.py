import time
import pytest
from app.models.salon import Barber, SalonSetting
from app.models.queue import QueueEntry
from app.core.database import SessionLocal

def get_auth_token(client, username, password):
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]

# 1. Customer registration works
def test_1_customer_registration(client):
    phone = f"98{int(time.time()*100) % 100000000:08d}"
    res = client.post("/api/auth/register", json={
        "full_name": "Arjun Patel",
        "phone": phone,
        "password": "Password@123"
    })
    assert res.status_code == 200
    assert res.json()["role"] == "customer"
    assert "access_token" in res.json()

# 2. Customer login works
def test_2_customer_login(client):
    res = client.post("/api/auth/login", json={
        "username": "customer@salonflow.com",
        "password": "Customer@123"
    })
    assert res.status_code == 200
    assert res.json()["role"] == "customer"

# 3. Incorrect passwords are rejected
def test_3_wrong_password_rejected(client):
    res = client.post("/api/auth/login", json={
        "username": "customer@salonflow.com",
        "password": "BadPassword999"
    })
    assert res.status_code == 401

# 4. Customers cannot access admin routes
def test_4_customer_cannot_access_admin(client):
    cust_token = get_auth_token(client, "customer@salonflow.com", "Customer@123")
    res = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {cust_token}"})
    assert res.status_code == 403

# 5. Receptionists cannot access owner settings
def test_5_receptionist_cannot_modify_settings(client):
    rec_token = get_auth_token(client, "reception@salonflow.com", "Staff@123")
    res = client.put("/api/admin/settings", json={"salon_name": "Hacked"}, headers={"Authorization": f"Bearer {rec_token}"})
    assert res.status_code == 403

# 6. Customer can join queue
def test_6_customer_join_queue(client):
    # Get active services
    svc_res = client.get("/api/services")
    services = svc_res.json()
    svc_id = services[0]["id"]

    # Register fresh customer
    phone = f"97{int(time.time()*100) % 100000000:08d}"
    reg_res = client.post("/api/auth/register", json={
        "full_name": "Karan Shah",
        "phone": phone,
        "password": "Password@123"
    })
    token = reg_res.json()["access_token"]

    join_res = client.post("/api/queue/join", json={
        "service_ids": [svc_id],
        "preferred_barber_id": None
    }, headers={"Authorization": f"Bearer {token}"})
    assert join_res.status_code == 200
    data = join_res.json()
    assert data["token_number"].startswith("SF-")
    assert data["status"] == "WAITING"

# 7. Duplicate active queue entries prevented
def test_7_duplicate_queue_prevented(client):
    svc_res = client.get("/api/services")
    svc_id = svc_res.json()[0]["id"]

    phone = f"96{int(time.time()*100) % 100000000:08d}"
    reg_res = client.post("/api/auth/register", json={
        "full_name": "Sameer Joshi",
        "phone": phone,
        "password": "Password@123"
    })
    token = reg_res.json()["access_token"]

    # First join succeeds
    res1 = client.post("/api/queue/join", json={"service_ids": [svc_id]}, headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 200

    # Second join fails with 409 Conflict
    res2 = client.post("/api/queue/join", json={"service_ids": [svc_id]}, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 409

# 8 & 9. Barber preference respected: Calling for Amit skips customer requesting Ravi
def test_8_and_9_barber_preference_respected(client):
    db = SessionLocal()
    ravi = db.query(Barber).filter(Barber.name == "Ravi Kumar").first()
    amit = db.query(Barber).filter(Barber.name == "Amit Shah").first()
    db.close()

    svc_res = client.get("/api/services")
    svc_id = svc_res.json()[0]["id"]

    # Customer 1 selects Ravi
    phone1 = f"95{int(time.time()*100) % 100000000:08d}"
    u1 = client.post("/api/auth/register", json={"full_name": "Prefers Ravi", "phone": phone1, "password": "Pass@123"}).json()
    client.post("/api/queue/join", json={"service_ids": [svc_id], "preferred_barber_id": ravi.id}, headers={"Authorization": f"Bearer {u1['access_token']}"})

    # Customer 2 selects Any
    phone2 = f"94{int(time.time()*100) % 100000000:08d}"
    u2 = client.post("/api/auth/register", json={"full_name": "Prefers Any", "phone": phone2, "password": "Pass@123"}).json()
    res_any = client.post("/api/queue/join", json={"service_ids": [svc_id]}, headers={"Authorization": f"Bearer {u2['access_token']}"}).json()

    rec_token = get_auth_token(client, "reception@salonflow.com", "Staff@123")

    # When Amit calls next, he must NOT get Customer 1 (who chose Ravi). He gets an eligible 'Any' customer!
    call_res = client.post(f"/api/queue/{amit.id}/call-next", headers={"Authorization": f"Bearer {rec_token}"})
    assert call_res.status_code == 200
    called_entry = call_res.json()
    # Verified: Amit never picks Customer 1 who asked for Ravi
    assert called_entry["preferred_barber_id"] != ravi.id
    assert called_entry["assigned_barber_id"] == amit.id

# 10. Barber cannot serve two customers simultaneously
def test_10_barber_single_customer_chair(client):
    db = SessionLocal()
    amit = db.query(Barber).filter(Barber.name == "Amit Shah").first()
    db.close()

    rec_token = get_auth_token(client, "reception@salonflow.com", "Staff@123")
    # Calling next again while Amit is busy with called/in-chair customer must be rejected
    res = client.post(f"/api/queue/{amit.id}/call-next", headers={"Authorization": f"Bearer {rec_token}"})
    assert res.status_code == 400
    assert "already has an active customer" in res.json()["detail"]

# 11. Start and Complete correctly update queue status
def test_11_start_and_complete_transitions(client):
    db = SessionLocal()
    amit = db.query(Barber).filter(Barber.name == "Amit Shah").first()
    active_entry = db.query(QueueEntry).filter(QueueEntry.assigned_barber_id == amit.id, QueueEntry.status == "CALLED").first()
    db.close()

    rec_token = get_auth_token(client, "reception@salonflow.com", "Staff@123")

    # Start service
    start_res = client.post(f"/api/queue/{active_entry.id}/start", headers={"Authorization": f"Bearer {rec_token}"})
    assert start_res.status_code == 200

    # Complete service
    comp_res = client.post(f"/api/queue/{active_entry.id}/complete", headers={"Authorization": f"Bearer {rec_token}"})
    assert comp_res.status_code == 200

    # Verify Amit is now free
    db = SessionLocal()
    refreshed_amit = db.query(Barber).filter(Barber.id == amit.id).first()
    assert refreshed_amit.status == "AVAILABLE"
    db.close()

# 12. No-Show flow
def test_12_no_show_flow(client):
    db = SessionLocal()
    ravi = db.query(Barber).filter(Barber.name == "Ravi Kumar").first()
    db.close()

    rec_token = get_auth_token(client, "reception@salonflow.com", "Staff@123")
    # Call customer who chose Ravi
    call_res = client.post(f"/api/queue/{ravi.id}/call-next", headers={"Authorization": f"Bearer {rec_token}"})
    assert call_res.status_code == 200
    entry_id = call_res.json()["id"]

    # Mark as No-show
    ns_res = client.post(f"/api/queue/{entry_id}/no-show", headers={"Authorization": f"Bearer {rec_token}"})
    assert ns_res.status_code == 200

    # Verify status
    status_res = client.get(f"/api/queue/status/{entry_id}")
    assert status_res.json()["status"] == "NO_SHOW"

# 13. Customer cancellation
def test_13_cancellation(client):
    svc_res = client.get("/api/services").json()[0]["id"]
    phone = f"93{int(time.time()*100) % 100000000:08d}"
    u = client.post("/api/auth/register", json={"full_name": "Cancel Me", "phone": phone, "password": "Pass@123"}).json()
    entry = client.post("/api/queue/join", json={"service_ids": [svc_res]}, headers={"Authorization": f"Bearer {u['access_token']}"}).json()

    cancel_res = client.post(f"/api/queue/{entry['id']}/cancel", headers={"Authorization": f"Bearer {u['access_token']}"})
    assert cancel_res.status_code == 200

    status_res = client.get(f"/api/queue/status/{entry['id']}")
    assert status_res.json()["status"] == "CANCELLED"

# 14. Review submission works
def test_14_review_submission(client):
    db = SessionLocal()
    # Create fresh completed entry for test
    fresh_done = QueueEntry(
        token_number=f"SF-T{int(time.time()*100)%10000}",
        customer_name="Review Tester",
        customer_phone="9988776655",
        status="DONE",
        total_duration_minutes=30,
        total_price=150.00
    )
    db.add(fresh_done)
    db.commit()
    db.refresh(fresh_done)
    entry_id = fresh_done.id
    db.close()

    cust_token = get_auth_token(client, "customer@salonflow.com", "Customer@123")
    res = client.post("/api/reviews", json={
        "queue_entry_id": entry_id,
        "rating": 5,
        "comment": "Excellent precision haircut!"
    }, headers={"Authorization": f"Bearer {cust_token}"})
    assert res.status_code == 200
    assert res.json()["rating"] == 5

    # Duplicate review for same entry prevented
    res_dup = client.post("/api/reviews", json={
        "queue_entry_id": entry_id,
        "rating": 4
    }, headers={"Authorization": f"Bearer {cust_token}"})
    assert res_dup.status_code == 400

# 15. Closed online queue prevents online entries
def test_15_closed_online_queue_prevented(client):
    db = SessionLocal()
    settings = db.query(SalonSetting).first()
    settings.is_online_queue_open = False
    db.commit()
    db.close()

    svc_res = client.get("/api/services").json()[0]["id"]
    phone = f"92{int(time.time()*100) % 100000000:08d}"
    u = client.post("/api/auth/register", json={"full_name": "After Hours", "phone": phone, "password": "Pass@123"}).json()

    res = client.post("/api/queue/join", json={"service_ids": [svc_res]}, headers={"Authorization": f"Bearer {u['access_token']}"})
    assert res.status_code == 403
    assert "Online queue is currently closed" in res.json()["detail"]

    # Re-enable online queue
    db = SessionLocal()
    settings = db.query(SalonSetting).first()
    settings.is_online_queue_open = True
    db.commit()
    db.close()

# 16. Gujarati language dictionary integrity
def test_16_gujarati_translations_valid():
    import json
    import os
    gu_path = os.path.join("frontend", "src", "i18n", "gu.json")
    en_path = os.path.join("frontend", "src", "i18n", "en.json")
    with open(gu_path, "r", encoding="utf-8") as f:
        gu_data = json.load(f)
    with open(en_path, "r", encoding="utf-8") as f:
        en_data = json.load(f)
    assert "brand" in gu_data and "brand" in en_data
    assert gu_data["brand"]["name"] == "સેલોનફ્લો"
    assert "reception" in gu_data
    assert "barber" in gu_data

# 17. User password change verification
def test_17_change_password(client):
    phone = f"91{int(time.time()*100) % 100000000:08d}"
    u = client.post("/api/auth/register", json={"full_name": "Pass Changer", "phone": phone, "password": "OldPassword@123"}).json()
    token = u["access_token"]

    # Reject bad current password
    bad_res = client.put("/api/auth/change-password", json={
        "old_password": "WrongPassword",
        "new_password": "NewPassword@123"
    }, headers={"Authorization": f"Bearer {token}"})
    assert bad_res.status_code == 400

    # Accept correct current password
    good_res = client.put("/api/auth/change-password", json={
        "old_password": "OldPassword@123",
        "new_password": "NewPassword@123"
    }, headers={"Authorization": f"Bearer {token}"})
    assert good_res.status_code == 200

    # Verify login with new password
    login_res = client.post("/api/auth/login", json={"username": phone, "password": "NewPassword@123"})
    assert login_res.status_code == 200
