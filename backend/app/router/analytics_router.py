from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db
from app.schemas import BaseModel
from app.analytics_crud import (
    get_most_purchased_products,
    get_most_active_users,
    get_revenue_stats,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# --- Schemas for response ---
class ProductStats(BaseModel):
    product_id: int
    product_name: str
    brand_name: str
    total_qty: int


class UserStats(BaseModel):
    user_id: int
    username: str
    total_dispensed: int


class RevenueStats(BaseModel):
    total_revenue: float
    total_items: int


# --- Routes using the CRUD functions ---
@router.get("/most-purchased-products/", response_model=List[ProductStats])
def most_purchased_products(
    db: Session = Depends(get_db),
    start_date: datetime = Query(None),
    end_date: datetime = Query(None)
):
    return get_most_purchased_products(db, start_date, end_date)


@router.get("/most-active-users/", response_model=List[UserStats])
def most_active_users(
    db: Session = Depends(get_db),
    start_date: datetime = Query(None),
    end_date: datetime = Query(None)
):
    return get_most_active_users(db, start_date, end_date)


@router.get("/revenue-stats/", response_model=RevenueStats)
def revenue_stats(
    db: Session = Depends(get_db),
    start_date: datetime = Query(None),
    end_date: datetime = Query(None)
):
    return get_revenue_stats(db, start_date, end_date)
