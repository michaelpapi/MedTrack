import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from typing import List
from app import operations, schemas, models
from app.database import get_db
from app.security import get_current_user, get_current_admin
from app.utils import to_dispense_response
from app.crud import get_dispense_history_per_user

router = APIRouter(prefix="/dispense", tags=["Dispense"])


@router.post("/", response_model=schemas.DispenseResponse)
async def create_dispense(dispense_in: schemas.DispenseCreate, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    try:
        disp = await operations.dispense_products(db, current_user, dispense_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # serialize before returning so Pydantic doesn't try to validate relationship objects
    return to_dispense_response(disp)


@router.get("/my-history", response_model=list[schemas.DispenseResponse])
def get_my_dispense_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    dispenses = (
        db.query(models.Dispense)
        .filter(models.Dispense.user_id == current_user.id)
        .order_by(models.Dispense.created_at.desc())
        .all()
    )

    # map to serialized dicts
    return [to_dispense_response(d) for d in dispenses]


@router.get("/all", response_model=List[schemas.DispenseResponse])
def get_all_dispenses(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
    start_date: datetime | None = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: datetime | None = Query(None, description="End date filter (YYYY-MM-DD)")
):
    """
    Retrieve all dispenses with items and user info.
    Admin-only access.
    Optional date range filtering.
    """
    query = db.query(models.Dispense).options(joinedload(models.Dispense.user)).order_by(models.Dispense.created_at.desc())
    if start_date:
        query = query.filter(models.Dispense.created_at >= start_date)
    if end_date:
        if end_date.time() == datetime.min.time():
            end_date = end_date + timedelta(days=1) - timedelta(microseconds=1)
        query = query.filter(models.Dispense.created_at <= end_date)

    dispenses = query.all()
    return [to_dispense_response(d) for d in dispenses]



@router.get(
    "/dispense-history/{user_id}",
    response_model=dict,
    dependencies=[Depends(get_current_admin)]
)
def get_user_dispense_history(
    user_id: int,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(5, ge=1, le=100, description="Items per page"),
    paginate: bool = Query(True, descrition="If false return ALL matching dispenses (no server-side pagination)"),
    db: Session = Depends(get_db),
    start_date: datetime | None = Query(None, description="Filter dispenses created on/after this date (YYYY-MM-DD or ISO)"),
    end_date: datetime | None = Query(None, description="Filter dispenses created on/before this date (YYYY-MM-DD or ISO)")
):
    """
    Get paginated dispense history for a specific user (admin view).
    Supports optional start_date / end_date filters and returns:
    { total, page, limit, results }
    where results is a list of serialized dispense dicts.
    """
    # Build base query (use SQL filtering to avoid post-serialization date parsing)
    query = db.query(models.Dispense).filter(models.Dispense.user_id == user_id)

    # Apply date filters at DB level if provided
    if start_date:
        query = query.filter(models.Dispense.created_at >= start_date)
    if end_date:
        # include the whole end_date day if only date provided by user — but user may pass full datetime
        if end_date.time() == datetime.min.time():
            end_date = end_date + timedelta(days=1) - timedelta(microseconds=1)
        query = query.filter(models.Dispense.created_at <= end_date)


    # If client requests all results (no pagination), return the fll list
    if not paginate:
        dispenses_objs = query.order_by(models.Dispense.created_at.desc()).all()
        results = [to_dispense_response(d) for d in dispenses_objs]
        total = len(results)
        return {"total": total, "page": 1, "limit": total or 0, "results": results}

    total = query.count()

    offset = (page - 1) * limit
    dispenses_objs = (
        query.order_by(models.Dispense.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # Serialize each Dispense using your existing helper
    results = [to_dispense_response(d) for d in dispenses_objs]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": results,
    }