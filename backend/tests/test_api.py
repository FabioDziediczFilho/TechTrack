from httpx import AsyncClient


async def create_account(client: AsyncClient, slug: str) -> tuple[str, int]:
    registration = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"{slug}@example.com",
            "password": "test-password-123",
            "full_name": f"User {slug}",
            "organization_name": f"Organization {slug}",
        },
    )
    assert registration.status_code == 201, registration.text

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": f"{slug}@example.com", "password": "test-password-123"},
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"], registration.json()["id"]


async def test_register_generates_unique_organization_slug(client: AsyncClient):
    registration_data = {
        "email": "same-name@example.com",
        "password": "test-password-123",
        "full_name": "José Silva",
    }

    first = await client.post("/api/v1/auth/register", json=registration_data)
    assert first.status_code == 201, first.text

    registration_data["email"] = "same-name-2@example.com"
    second = await client.post("/api/v1/auth/register", json=registration_data)
    assert second.status_code == 201, second.text
    assert first.json()["id"] != second.json()["id"]

    registration_data["email"] = "same-name-3@example.com"
    registration_data["organization_name"] = "  "
    third = await client.post("/api/v1/auth/register", json=registration_data)
    assert third.status_code == 201, third.text


async def create_equipment_type(client: AsyncClient, token: str) -> int:
    response = await client.post(
        "/api/v1/equipment/types",
        params={"name": "Notebook"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    return response.json()["id"]


async def create_equipment(
    client: AsyncClient,
    token: str,
    type_id: int,
    sector_id: int | None = None,
) -> dict:
    response = await client.post(
        "/api/v1/equipment/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "type_id": type_id,
            "sector_id": sector_id,
            "asset_number": "ASSET-001",
            "brand": "Dell",
            "model": "Latitude",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_equipment_update_returns_updated_record_and_history(client: AsyncClient):
    token, _ = await create_account(client, "equipment-org")
    type_id = await create_equipment_type(client, token)
    equipment = await create_equipment(client, token, type_id)

    response = await client.put(
        f"/api/v1/equipment/{equipment['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"brand": "Lenovo"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["brand"] == "Lenovo"

    history = await client.get(
        f"/api/v1/equipment/{equipment['id']}/history",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert history.status_code == 200, history.text
    assert [entry["field_name"] for entry in history.json()] == ["brand"]


async def test_resources_cannot_be_linked_across_organizations(client: AsyncClient):
    token_a, _ = await create_account(client, "first-org")
    type_id = await create_equipment_type(client, token_a)
    sector_response = await client.post(
        "/api/v1/equipment/sectors",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"name": "IT"},
    )
    assert sector_response.status_code == 201, sector_response.text
    equipment = await create_equipment(client, token_a, type_id, sector_response.json()["id"])

    token_b, second_user_id = await create_account(client, "second-org")
    cross_org_sector_deletion = await client.delete(
        f"/api/v1/equipment/sectors/{sector_response.json()['id']}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert cross_org_sector_deletion.status_code == 404

    cross_org_equipment = await client.post(
        "/api/v1/tickets/",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"title": "Cross-tenant link", "equipment_id": equipment["id"]},
    )
    assert cross_org_equipment.status_code == 404

    cross_org_sector = await client.post(
        "/api/v1/equipment/",
        headers={"Authorization": f"Bearer {token_b}"},
        json={
            "type_id": type_id,
            "sector_id": sector_response.json()["id"],
            "asset_number": "ASSET-002",
            "brand": "Dell",
            "model": "Latitude",
        },
    )
    assert cross_org_sector.status_code == 404

    ticket = await client.post(
        "/api/v1/tickets/",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"title": "Assignment tenant check"},
    )
    assert ticket.status_code == 201, ticket.text
    cross_org_assignment = await client.put(
        f"/api/v1/tickets/{ticket.json()['id']}",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"assigned_to": second_user_id},
    )
    assert cross_org_assignment.status_code == 404


async def test_deleting_sector_keeps_equipment_and_clears_its_sector(client: AsyncClient):
    token, _ = await create_account(client, "sector-delete-org")
    type_id = await create_equipment_type(client, token)
    sector_response = await client.post(
        "/api/v1/equipment/sectors",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Financeiro",
            "address": "Rua Central, 100",
            "responsible": "Ana Souza",
        },
    )
    assert sector_response.status_code == 201, sector_response.text
    sector = sector_response.json()
    assert sector["address"] == "Rua Central, 100"
    assert sector["responsible"] == "Ana Souza"

    equipment = await create_equipment(client, token, type_id, sector["id"])
    deletion = await client.delete(
        f"/api/v1/equipment/sectors/{sector['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert deletion.status_code == 204, deletion.text

    equipment_after_deletion = await client.get(
        f"/api/v1/equipment/{equipment['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert equipment_after_deletion.status_code == 200
    assert equipment_after_deletion.json()["sector_id"] is None

    sectors = await client.get(
        "/api/v1/equipment/sectors",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert sectors.status_code == 200
    assert sectors.json() == []


async def test_equipment_edit_rejects_duplicate_asset_number(client: AsyncClient):
    token, _ = await create_account(client, "equipment-duplicate-edit-org")
    type_id = await create_equipment_type(client, token)
    first_equipment = await create_equipment(client, token, type_id)
    second_response = await client.post(
        "/api/v1/equipment/",
        headers={"Authorization": f"Bearer {token}"},
        json={"type_id": type_id, "asset_number": "ASSET-002"},
    )
    assert second_response.status_code == 201, second_response.text

    updated = await client.put(
        f"/api/v1/equipment/{second_response.json()['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"asset_number": first_equipment["asset_number"]},
    )
    assert updated.status_code == 400


async def test_equipment_status_can_be_changed(client: AsyncClient):
    token, _ = await create_account(client, "equipment-status-org")
    type_id = await create_equipment_type(client, token)
    equipment = await create_equipment(client, token, type_id)

    updated = await client.put(
        f"/api/v1/equipment/{equipment['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "maintenance"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "maintenance"


async def test_equipment_computer_number_can_be_created_updated_and_cleared(
    client: AsyncClient,
):
    token, _ = await create_account(client, "computer-number-org")
    headers = {"Authorization": f"Bearer {token}"}
    type_id = await create_equipment_type(client, token)

    created = await client.post(
        "/api/v1/equipment/",
        headers=headers,
        json={
            "type_id": type_id,
            "computer_number": "PC-024",
            "asset_number": "PATR-778",
        },
    )
    assert created.status_code == 201, created.text
    assert created.json()["computer_number"] == "PC-024"
    assert created.json()["asset_number"] == "PATR-778"

    updated = await client.put(
        f"/api/v1/equipment/{created.json()['id']}",
        headers=headers,
        json={"computer_number": "PC-025"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["computer_number"] == "PC-025"

    cleared = await client.put(
        f"/api/v1/equipment/{created.json()['id']}",
        headers=headers,
        json={"computer_number": "  "},
    )
    assert cleared.status_code == 200, cleared.text
    assert cleared.json()["computer_number"] is None


async def test_deleting_equipment_removes_history_and_maintenance_but_keeps_tickets(
    client: AsyncClient,
):
    token, _ = await create_account(client, "equipment-delete-org")
    headers = {"Authorization": f"Bearer {token}"}
    type_id = await create_equipment_type(client, token)
    equipment = await create_equipment(client, token, type_id)

    updated = await client.put(
        f"/api/v1/equipment/{equipment['id']}",
        headers=headers,
        json={"brand": "Lenovo"},
    )
    assert updated.status_code == 200, updated.text

    maintenance_type = await client.post(
        "/api/v1/maintenance/types",
        params={"name": "Preventiva"},
        headers=headers,
    )
    assert maintenance_type.status_code == 200, maintenance_type.text
    maintenance = await client.post(
        "/api/v1/maintenance/",
        headers=headers,
        json={
            "equipment_id": equipment["id"],
            "maintenance_type_id": maintenance_type.json()["id"],
            "description": "Revisão a ser removida",
            "performed_at": "2026-11-12T12:00:00",
        },
    )
    assert maintenance.status_code == 201, maintenance.text

    alert = await client.post(
        "/api/v1/maintenance/alerts",
        headers=headers,
        json={
            "equipment_id": equipment["id"],
            "alert_date": "2026-12-01T00:00:00",
        },
    )
    assert alert.status_code == 201, alert.text

    ticket = await client.post(
        "/api/v1/tickets/",
        headers=headers,
        json={"title": "Chamado a preservar", "equipment_id": equipment["id"]},
    )
    assert ticket.status_code == 201, ticket.text

    deleted = await client.delete(
        f"/api/v1/equipment/{equipment['id']}",
        headers=headers,
    )
    assert deleted.status_code == 204, deleted.text

    missing_equipment = await client.get(
        f"/api/v1/equipment/{equipment['id']}",
        headers=headers,
    )
    assert missing_equipment.status_code == 404

    history = await client.get(
        f"/api/v1/equipment/{equipment['id']}/history",
        headers=headers,
    )
    assert history.status_code == 404

    remaining_maintenance = await client.get(
        "/api/v1/maintenance/",
        headers=headers,
    )
    assert remaining_maintenance.status_code == 200
    assert remaining_maintenance.json() == []

    remaining_ticket = await client.get(
        f"/api/v1/tickets/{ticket.json()['id']}",
        headers=headers,
    )
    assert remaining_ticket.status_code == 200, remaining_ticket.text
    assert remaining_ticket.json()["equipment_id"] is None


async def test_equipment_optional_fields_and_observation(client: AsyncClient):
    token, _ = await create_account(client, "optional-equipment-org")
    type_id = await create_equipment_type(client, token)

    response = await client.post(
        "/api/v1/equipment/",
        headers={"Authorization": f"Bearer {token}"},
        json={"type_id": type_id, "observation": "Equipamento compartilhado"},
    )

    assert response.status_code == 201, response.text
    data = response.json()
    assert data["asset_number"] is None
    assert data["brand"] is None
    assert data["model"] is None
    assert data["observation"] == "Equipamento compartilhado"
    assert "serial_number" not in data
    assert "location" not in data


async def test_maintenance_uses_authenticated_user_and_checks_equipment_tenant(
    client: AsyncClient,
):
    token, user_id = await create_account(client, "maintenance-org")
    type_id = await create_equipment_type(client, token)
    equipment = await create_equipment(client, token, type_id)
    maintenance_type_response = await client.post(
        "/api/v1/maintenance/types",
        params={"name": "Preventiva"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert maintenance_type_response.status_code == 200, maintenance_type_response.text

    response = await client.post(
        "/api/v1/maintenance/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "equipment_id": equipment["id"],
            "maintenance_type_id": maintenance_type_response.json()["id"],
            "description": "Revisão",
            "performed_at": "2026-11-12T12:00:00",
        },
    )

    assert response.status_code == 201, response.text
    assert response.json()["performed_by"] == user_id

    other_token, _ = await create_account(client, "other-maintenance-org")
    cross_org_maintenance = await client.post(
        "/api/v1/maintenance/",
        headers={"Authorization": f"Bearer {other_token}"},
        json={
            "equipment_id": equipment["id"],
            "maintenance_type_id": maintenance_type_response.json()["id"],
            "performed_at": "2026-11-12T12:00:00",
        },
    )
    assert cross_org_maintenance.status_code == 404

    cross_org_alert = await client.post(
        "/api/v1/maintenance/alerts",
        headers={"Authorization": f"Bearer {other_token}"},
        json={
            "equipment_id": equipment["id"],
            "alert_date": "2026-12-01T00:00:00",
        },
    )
    assert cross_org_alert.status_code == 404


async def test_dashboard_counts_pending_maintenance_alerts_per_organization(
    client: AsyncClient,
):
    token_a, _ = await create_account(client, "dashboard-first-org")
    type_id = await create_equipment_type(client, token_a)
    equipment_a = await create_equipment(client, token_a, type_id)
    headers_a = {"Authorization": f"Bearer {token_a}"}

    pending_alert = await client.post(
        "/api/v1/maintenance/alerts",
        headers=headers_a,
        json={
            "equipment_id": equipment_a["id"],
            "alert_date": "2026-12-01T00:00:00",
        },
    )
    assert pending_alert.status_code == 201, pending_alert.text
    completed_alert = await client.post(
        "/api/v1/maintenance/alerts",
        headers=headers_a,
        json={
            "equipment_id": equipment_a["id"],
            "alert_date": "2026-12-02T00:00:00",
        },
    )
    assert completed_alert.status_code == 201, completed_alert.text
    completed = await client.put(
        f"/api/v1/maintenance/alerts/{completed_alert.json()['id']}",
        headers=headers_a,
        json={"status": "completed"},
    )
    assert completed.status_code == 200, completed.text

    token_b, _ = await create_account(client, "dashboard-second-org")
    equipment_b = await create_equipment(client, token_b, type_id)
    pending_alert_b = await client.post(
        "/api/v1/maintenance/alerts",
        headers={"Authorization": f"Bearer {token_b}"},
        json={
            "equipment_id": equipment_b["id"],
            "alert_date": "2026-12-03T00:00:00",
        },
    )
    assert pending_alert_b.status_code == 201, pending_alert_b.text

    response_a = await client.get("/api/v1/dashboard/stats", headers=headers_a)
    response_b = await client.get(
        "/api/v1/dashboard/stats",
        headers={"Authorization": f"Bearer {token_b}"},
    )

    assert response_a.status_code == 200, response_a.text
    assert response_a.json()["pending_maintenance_alerts"] == 1
    assert response_b.status_code == 200, response_b.text
    assert response_b.json()["pending_maintenance_alerts"] == 1


async def test_sector_can_be_edited_and_is_organization_scoped(client: AsyncClient):
    token, _ = await create_account(client, "sector-edit-org")
    response = await client.post(
        "/api/v1/equipment/sectors",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Suporte", "address": "Rua antiga"},
    )
    assert response.status_code == 201, response.text
    sector_id = response.json()["id"]

    updated = await client.put(
        f"/api/v1/equipment/sectors/{sector_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Suporte Técnico", "address": "Rua nova"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["name"] == "Suporte Técnico"
    assert updated.json()["address"] == "Rua nova"

    other_token, _ = await create_account(client, "other-sector-edit-org")
    cross_org_update = await client.put(
        f"/api/v1/equipment/sectors/{sector_id}",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"name": "Alteração indevida"},
    )
    assert cross_org_update.status_code == 404


async def test_maintenance_can_be_updated_and_deleted_with_tenant_checks(
    client: AsyncClient,
):
    token, _ = await create_account(client, "maintenance-edit-org")
    type_id = await create_equipment_type(client, token)
    equipment = await create_equipment(client, token, type_id)
    maintenance_type_response = await client.post(
        "/api/v1/maintenance/types",
        params={"name": "Preventiva"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert maintenance_type_response.status_code == 200, maintenance_type_response.text

    created = await client.post(
        "/api/v1/maintenance/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "equipment_id": equipment["id"],
            "maintenance_type_id": maintenance_type_response.json()["id"],
            "description": "Revisão inicial",
            "performed_at": "2026-11-12T12:00:00",
        },
    )
    assert created.status_code == 201, created.text
    maintenance_id = created.json()["id"]

    updated = await client.put(
        f"/api/v1/maintenance/{maintenance_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "description": "Revisão atualizada",
            "parts_replaced": "Filtro",
            "cost": 120.5,
            "performed_at": "2026-11-11T12:00:00",
        },
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["description"] == "Revisão atualizada"
    assert updated.json()["parts_replaced"] == "Filtro"
    assert updated.json()["cost"] == 120.5

    other_token, _ = await create_account(client, "other-maintenance-edit-org")
    cross_org_update = await client.put(
        f"/api/v1/maintenance/{maintenance_id}",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"description": "Não autorizado"},
    )
    assert cross_org_update.status_code == 404
    cross_org_delete = await client.delete(
        f"/api/v1/maintenance/{maintenance_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert cross_org_delete.status_code == 404

    deleted = await client.delete(
        f"/api/v1/maintenance/{maintenance_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert deleted.status_code == 204
    missing = await client.get(
        f"/api/v1/maintenance/{maintenance_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert missing.status_code == 404
