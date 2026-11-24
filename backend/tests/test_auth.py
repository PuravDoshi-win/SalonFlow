def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "SalonFlow"

def test_login_demo_owner(client):
    response = client.post("/api/auth/login", json={
        "username": "owner@salonflow.com",
        "password": "Owner@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"

def test_login_demo_barber(client):
    response = client.post("/api/auth/login", json={
        "username": "ravi@salonflow.com",
        "password": "Barber@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "barber"

def test_login_demo_customer(client):
    response = client.post("/api/auth/login", json={
        "username": "customer@salonflow.com",
        "password": "Customer@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "customer"

def test_invalid_password_rejected(client):
    response = client.post("/api/auth/login", json={
        "username": "owner@salonflow.com",
        "password": "WrongPassword!404"
    })
    assert response.status_code == 401

def test_customer_registration(client):
    import time
    phone = f"99{int(time.time()) % 100000000:08d}"
    response = client.post("/api/auth/register", json={
        "full_name": "Test User",
        "phone": phone,
        "password": "TestPassword@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "customer"
