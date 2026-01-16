from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import schemas, models
from app.database import get_db
from app.operations import get_audit_logs
from app.security import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


# Audit router for audit endpoint 
@router.get("/", response_model=list[schemas.AuditLogBase], dependencies=[Depends(get_current_user)])
async def read_audit_logs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve system audit logs (admin actions)."""
    logs = get_audit_logs(db, skip=skip, limit=limit)
    return logs
