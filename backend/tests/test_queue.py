def test_services_list(client):
    response = client.get("/api/services")
    assert response.status_code == 200
    services = response.json()
    assert len(services) >= 7
    # Verify Indian salon services
    names = [s["name_en"] for s in services]
    assert "Haircut" in names
    assert "Beard Trim" in names

def test_barbers_list(client):
    response = client.get("/api/barbers")
    assert response.status_code == 200
    barbers = response.json()
    assert len(barbers) == 4
    names = [b["name"] for b in barbers]
    assert "Ravi Kumar" in names
    assert "Amit Shah" in names

def test_queue_summary(client):
    response = client.get("/api/queue/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_waiting" in data
    assert "is_salon_open" in data
