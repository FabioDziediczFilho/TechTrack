from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.core.security import get_password_hash
from app.models import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter()


async def get_current_admin(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    result = await db.execute(
        select(User).where(
            User.id == int(current_user["sub"]),
            User.organization_id == int(current_user["organization_id"]),
            User.is_active.is_(True),
        )
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Active user not found",
        )
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return user


@router.get("/", response_model=list[UserResponse])
async def list_users(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.organization_id == current_admin.organization_id)
        .order_by(User.full_name, User.id)
    )
    return result.scalars().all()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    user = User(
        organization_id=current_admin.organization_id,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name.strip(),
        role=user_data.role,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.organization_id == current_admin.organization_id,
        )
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updates = user_data.model_dump(exclude_unset=True)
    if "email" in updates:
        duplicate = await db.execute(
            select(User).where(User.email == updates["email"], User.id != user.id)
        )
        if duplicate.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

    new_role = updates.get("role", user.role)
    new_is_active = updates.get("is_active", user.is_active)
    if user.id == current_admin.id and (
        new_role != UserRole.ADMIN or not new_is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own administrator access",
        )

    removes_active_admin = (
        user.role == UserRole.ADMIN
        and user.is_active
        and (new_role != UserRole.ADMIN or not new_is_active)
    )
    if removes_active_admin:
        active_admins = await db.scalar(
            select(func.count())
            .select_from(User)
            .where(
                User.organization_id == current_admin.organization_id,
                User.role == UserRole.ADMIN,
                User.is_active.is_(True),
            )
        )
        if active_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The organization must have at least one active administrator",
            )

    for field, value in updates.items():
        setattr(user, field, value.strip() if field == "full_name" else value)

    await db.commit()
    await db.refresh(user)
    return user
