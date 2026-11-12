import asyncio
import httpx

BASE_URL = "http://localhost:8000"


async def test_api():
    async with httpx.AsyncClient() as client:
        # Register
        print("1. Registering user...")
        response = await client.post(
            f"{BASE_URL}/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "test123456",
                "full_name": "Test User",
                "organization_name": "Test Org",
                "organization_slug": "test-org"
            }
        )
        print(f"   Status: {response.status_code}")
        if response.status_code != 201:
            print(f"   Error: {response.text}")
            return

        # Login
        print("\n2. Logging in...")
        response = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "test123456"
            }
        )
        print(f"   Status: {response.status_code}")
        if response.status_code != 200:
            print(f"   Error: {response.text}")
            return

        token_data = response.json()
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create equipment type
        print("\n3. Creating equipment type...")
        response = await client.post(
            f"{BASE_URL}/api/v1/equipment/types?name=Notebook",
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")

        # Create equipment
        print("\n4. Creating equipment...")
        response = await client.post(
            f"{BASE_URL}/api/v1/equipment/",
            headers=headers,
            json={
                "type_id": 1,
                "asset_number": "NB001",
                "serial_number": "SN12345",
                "brand": "Dell",
                "model": "Latitude 5420",
                "status": "active"
            }
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")

        if response.status_code == 201:
            equipment_id = response.json()["id"]

            # List equipment
            print("\n5. Listing equipment...")
            response = await client.get(
                f"{BASE_URL}/api/v1/equipment/",
                headers=headers
            )
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")

            # Get equipment
            print(f"\n6. Getting equipment {equipment_id}...")
            response = await client.get(
                f"{BASE_URL}/api/v1/equipment/{equipment_id}",
                headers=headers
            )
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")

        # Create ticket
        print("\n7. Creating ticket...")
        response = await client.post(
            f"{BASE_URL}/api/v1/tickets/",
            headers=headers,
            json={
                "title": "Problema na tela",
                "description": "Tela piscando",
                "priority": "medium",
                "equipment_id": 1
            }
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")

        if response.status_code == 201:
            ticket_id = response.json()["id"]

            # List tickets
            print("\n8. Listing tickets...")
            response = await client.get(
                f"{BASE_URL}/api/v1/tickets/",
                headers=headers
            )
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")

            # Add comment
            print(f"\n9. Adding comment to ticket {ticket_id}...")
            response = await client.post(
                f"{BASE_URL}/api/v1/tickets/{ticket_id}/comments",
                headers=headers,
                json={"comment": "Preciso verificar o cabo"}
            )
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")

        # Dashboard stats
        print("\n10. Getting dashboard stats...")
        response = await client.get(
            f"{BASE_URL}/api/v1/dashboard/stats",
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")

        print("\nAll tests completed successfully!")


if __name__ == "__main__":
    asyncio.run(test_api())
