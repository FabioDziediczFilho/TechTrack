from httpx import AsyncClient


async def create_account(client: AsyncClient, slug: str) -> tuple[str, int]:
    registration = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"admin-{slug}@example.com",
            "password": "test-password-123",
            "full_name": f"Admin {slug}",
            "organization_name": f"Organization {slug}",
        },
    )
    assert registration.status_code == 201, registration.text

    login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": f"admin-{slug}@example.com",
            "password": "test-password-123",
        },
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"], registration.json()["id"]


async def test_admin_can_create_list_update_and_deactivate_users(client: AsyncClient):
    admin_token, _ = await create_account(client, "users-admin-org")
    headers = {"Authorization": f"Bearer {admin_token}"}

    created = await client.post(
        "/api/v1/users/",
        headers=headers,
        json={
            "email": "tech@example.com",
            "full_name": "Tech User",
            "password": "secure-password",
            "role": "technician",
        },
    )
    assert created.status_code == 201, created.text
    user = created.json()
    assert user["role"] == "technician"
    assert user["is_active"] is True
    assert "hashed_password" not in user
    assert "password" not in user

    listed = await client.get("/api/v1/users/", headers=headers)
    assert listed.status_code == 200
    assert {item["email"] for item in listed.json()} == {
        "admin-users-admin-org@example.com",
        "tech@example.com",
    }

    updated = await client.put(
        f"/api/v1/users/{user['id']}",
        headers=headers,
        json={"full_name": "Updated Technician", "role": "user"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["full_name"] == "Updated Technician"
    assert updated.json()["role"] == "user"

    deactivated = await client.put(
        f"/api/v1/users/{user['id']}",
        headers=headers,
        json={"is_active": False},
    )
    assert deactivated.status_code == 200, deactivated.text
    assert deactivated.json()["is_active"] is False

    inactive_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "tech@example.com", "password": "secure-password"},
    )
    assert inactive_login.status_code == 403


async def test_user_management_is_admin_only_and_organization_scoped(client: AsyncClient):
    admin_token, _ = await create_account(client, "users-scope-org")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    created = await client.post(
        "/api/v1/users/",
        headers=admin_headers,
        json={
            "email": "regular@example.com",
            "full_name": "Regular User",
            "password": "secure-password",
            "role": "user",
        },
    )
    assert created.status_code == 201, created.text
    user_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "regular@example.com", "password": "secure-password"},
    )
    user_headers = {"Authorization": f"Bearer {user_login.json()['access_token']}"}
    forbidden = await client.get("/api/v1/users/", headers=user_headers)
    assert forbidden.status_code == 403

    other_admin_token, _ = await create_account(client, "users-other-org")
    other_headers = {"Authorization": f"Bearer {other_admin_token}"}
    cross_organization_update = await client.put(
        f"/api/v1/users/{created.json()['id']}",
        headers=other_headers,
        json={"full_name": "Unauthorized edit"},
    )
    assert cross_organization_update.status_code == 404


async def test_admin_cannot_remove_own_access_and_can_demote_another_admin(
    client: AsyncClient,
):
    admin_token, admin_id = await create_account(client, "users-last-admin-org")
    headers = {"Authorization": f"Bearer {admin_token}"}

    self_deactivation = await client.put(
        f"/api/v1/users/{admin_id}",
        headers=headers,
        json={"is_active": False},
    )
    assert self_deactivation.status_code == 400

    self_demotion = await client.put(
        f"/api/v1/users/{admin_id}",
        headers=headers,
        json={"role": "technician"},
    )
    assert self_demotion.status_code == 400

    second_admin = await client.post(
        "/api/v1/users/",
        headers=headers,
        json={
            "email": "second-admin@example.com",
            "full_name": "Second Admin",
            "password": "secure-password",
            "role": "admin",
        },
    )
    assert second_admin.status_code == 201, second_admin.text

    demote_second_admin = await client.put(
        f"/api/v1/users/{second_admin.json()['id']}",
        headers=headers,
        json={"role": "user"},
    )
    assert demote_second_admin.status_code == 200, demote_second_admin.text


async def test_deactivated_user_access_token_is_rejected(client: AsyncClient):
    admin_token, _ = await create_account(client, "users-disable-token-org")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    created = await client.post(
        "/api/v1/users/",
        headers=admin_headers,
        json={
            "email": "inactive-token@example.com",
            "full_name": "Inactive Token",
            "password": "secure-password",
        },
    )
    assert created.status_code == 201, created.text

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "inactive-token@example.com", "password": "secure-password"},
    )
    user_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    deactivated = await client.put(
        f"/api/v1/users/{created.json()['id']}",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert deactivated.status_code == 200

    current_user = await client.get("/api/v1/auth/me", headers=user_headers)
    assert current_user.status_code == 401
