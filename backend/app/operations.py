import asyncio, json
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, and_, func, desc
from datetime import datetime, timedelta

from app import models, schemas
from app.router.notifications_router import broadcast_message

from app.redis.dependencies import delete_cache, redis


async def check_low_stock_notification(db: Session, product: models.Product):
    """
    Ensures notifications state matches current stock.
    Called anytime that the stock is changed
    """

    # stock low - creates the notifs
    if product.stock <= product.reorder_level:
        notif = db.query(models.LowStockNotification).filter_by(
            product_id=product.id, is_active=True
        ).first()


        if not notif:
            notif = models.LowStockNotification(
                product_id=product.id,
                message=f"{product.drug.name} {product.strength or ''} "
                        f"{product.formulation_type.name if product.formulation_type else ''} "
                        f"({product.brand.name if product.brand else 'No Brand'}) "
                        f"low on stock — {product.stock} left."
            )
            db.add(notif)
            db.flush()


            await redis.publish(
                "low_stock_channel",
                json.dumps({
                    "add": {
                        "id": notif.id,
                        "message": notif.message,
                        "product_id": product.id
                    }
                })
            )

    
    # stock is ookay, deactivates notifs
    else:
        notif = db.query(models.LowStockNotification).filter_by(
            product_id=product.id, is_active=True
        ).first()

        if notif:
            notif.is_active = False
            db.flush()


            # Broadcast the removal
            await redis.publish(
                "low_stock_channel",
                json.dumps({"remove": product.id})
            )



async def dispense_products(db: Session, user: models.User, dispense_in: schemas.DispenseCreate):
    """Dispense products automatically and handle low-stock notifications."""

    # Collect product IDs
    product_ids = [item.product_id for item in dispense_in.items]

    # Lock all products once
    products = (
        db.query(models.Product)
        .filter(models.Product.id.in_(product_ids))
        .with_for_update()
        .all()
    )

    prod_map = {p.id: p for p in products}

    # Validate stock before any modifications
    for item in dispense_in.items:
        p = prod_map.get(item.product_id)
        if not p:
            raise ValueError(f"Product {item.product_id} not found.")
        if item.qty <= 0:
            raise ValueError("Quantity must be > 0.")
        if p.stock is None or p.stock < item.qty:
            raise ValueError(f"Insufficient stock for product {p.id} ({p.drug.name})")

    # These will be published after commit
    redis_messages = []

    try:
        print("DEBUG - Dispense initiated by:", user.id, user.username)

        disp = models.Dispense(user_id=user.id)
        db.add(disp)
        db.flush()

        for item in dispense_in.items:
            p = prod_map[item.product_id]

            # Decrease stock
            p.stock -= item.qty

            # Check reorder-level condition
            await check_low_stock_notification(db, p)

        # Commit DB transaction
        db.commit()

    except Exception:
        db.rollback()
        raise

    # Only publish Redis messages after successful commit
    for msg in redis_messages:
        await redis.publish("low_stock_channel", json.dumps(msg))

    return disp




async def ad_search_products(db: Session, query: str, skip=0, limit=100):
    tokens = [q.strip() for q in query.split() if q.strip()]

    def sync_query():
        q = db.query(models.Product).join(models.Drug).outerjoin(models.Brand).outerjoin(models.Unit)
        filters = []
        for tok in tokens:
            tok_like = f"%{tok}%"
            filters.append(
                or_(
                    models.Drug.name.ilike(tok_like),
                    models.Brand.name.ilike(tok_like),
                    models.Product.strength.ilike(tok_like),
                    models.Unit.code.ilike(tok_like),
                    models.Unit.name.ilike(tok_like),
                )
            )
        if not filters:
            return []
        q = q.filter(and_(*filters)).offset(skip).limit(limit)
        return q.all()

    return await asyncio.to_thread(sync_query)



def get_low_stock(db: Session):
    return (
        db.query(models.Product)
        .filter(models.Product.stock <= models.Product.reorder_level)
        .order_by(models.Product.stock.asc())
        .all()
    )


def log_action(db: Session, admin_id: int, product_id: int, action: str, old_value: int, new_value: int):
    log_entry = models.AuditLog(
        admin_id=admin_id,
        product_id=product_id,
        action=action,
        old_value=old_value,
        new_value=new_value,
    )
    db.add(log_entry)
    
    return log_entry


async def update_product_reorder_level(db: Session, product_id: int, reorder_level: int, admin_id: int):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    old_value = product.reorder_level
    product.reorder_level = reorder_level

    log_action(db, admin_id, product.id, "update_reorder", old_value, reorder_level)

    db.commit()
    db.refresh(product)
    await check_low_stock_notification(db, product)

    return product



async def update_product_stock(db: Session, product_id: int, qty: int, admin_id: int):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    old_value = product.stock
    product.stock = qty

    log_action(db, admin_id, product.id, "update_stock", old_value, qty)
    
    db.commit()
    db.refresh(product)
    await check_low_stock_notification(db, product)
    
    return product


def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    """Fetch audit logs with pagination."""
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()


