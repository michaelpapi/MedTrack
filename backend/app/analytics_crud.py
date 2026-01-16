from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.models import Dispense, DispenseItem, Product, User, Drug, Brand


# --- Get most purchased products ---
def get_most_purchased_products(
        db: Session,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
):
    
    if not start_date and not end_date:
        start_date = datetime.now() - timedelta(days=7)
        end_date = datetime.now()


    """
    Returns the most purchased products withtin a date range or defaults to the last N days
    """
    # Default to past N days only if no explicit date range is provided


    q = (
        db.query(
            Product.id.label("product_id"),
            Drug.name.label("product_name"),
            Brand.name.label("brand_name"),
            func.sum(DispenseItem.qty).label("total_qty")
        )
        .join(Product.drug)
        .join(Product.brand, isouter=True)
        .join(DispenseItem, DispenseItem.product_id == Product.id)
        .join(Dispense, DispenseItem.dispense_id == Dispense.id)

    )

    # Apply filters dynamically
    if start_date:
        q = q.filter(Dispense.created_at >= start_date)
    if end_date:
        if end_date.time() == datetime.min.time():
            end_date = end_date + timedelta(days=1) - timedelta(microseconds=1)
        q = q.filter(Dispense.created_at <= end_date)

    
    results = (
        q.group_by(Product.id, Drug.name, Brand.name)
            .order_by(desc("total_qty"))
            .all()
    )

    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "brand_name": row.brand_name or "_",
            "total_qty": row.total_qty,
        }
        for row in results
    ]

# --- Get most active users ---
def get_most_active_users(
    db: Session,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """
    Returns users with the most dispenses in a given date range or defaults to the last N days.
    """

    if not start_date and not end_date:
        start_date = datetime.now() - timedelta(days=7)
        end_date = datetime.now()


    q = (
        db.query(
            Dispense.user_id,
            User.username,
            func.sum(DispenseItem.qty).label("total_dispensed")
        )
        .join(DispenseItem, Dispense.id == DispenseItem.dispense_id)
        .join(User, Dispense.user_id == User.id)
    )

    if start_date:
        q = q.filter(Dispense.created_at >= start_date)
    if end_date:
        if end_date.time() == datetime.min.time():
            end_date = end_date + timedelta(days=1) - timedelta(microseconds=1)
        q = q.filter(Dispense.created_at <= end_date)

    results = (
        q.group_by(Dispense.user_id, User.username)
         .order_by(desc("total_dispensed"))
         .all()
    )

    return [
        {
            "user_id": row.user_id,
            "username": row.username,
            "total_dispensed": row.total_dispensed,
        }
        for row in results
    ]


# --- Get revenue statistics ---
def get_revenue_stats(db: Session, start_date: datetime = None, end_date: datetime = None):
    """
    Returns total revenue and items sold within a date range.
    If no range is provided, returns for all time.
    """
    if not start_date and not end_date:
        start_date = datetime.now() - timedelta(days=7)
        end_date = datetime.now()

    q = db.query(
        func.sum(DispenseItem.qty * DispenseItem.price_at_dispense).label("total_revenue"),
        func.sum(DispenseItem.qty).label("total_items")
    ).join(Dispense, DispenseItem.dispense_id == Dispense.id)

    if start_date:
        q = q.filter(Dispense.created_at >= start_date)
    if end_date:
        if end_date.time() == datetime.min.time():
            end_date = end_date + timedelta(days=1) - timedelta(microseconds=1)
        q = q.filter(Dispense.created_at <= end_date)

    result = q.first()

    return {
        "total_revenue": result.total_revenue or 0.0,
        "total_items": result.total_items or 0,
    }
