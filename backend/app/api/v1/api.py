from fastapi import APIRouter

from app.api.v1.endpoints import auth, dashboard, equipment, maintenance, tickets, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(equipment.router, prefix="/equipment", tags=["equipment"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(maintenance.router, prefix="/maintenance", tags=["maintenance"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
