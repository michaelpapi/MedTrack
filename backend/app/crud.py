from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.sql.expression import func
from datetime import datetime
import random

from app import models, schemas
from app.utils import hash_password, to_dispense_response
from email_validator import validate_email, EmailNotValidError





def get_or_create(session: Session, model, name_field: str, value: str):
    """Get an object by name or create if not exists."""
    instance = session.query(model).filter(getattr(model, name_field) == value).first()
    if instance:
        return instance
    instance = model(**{name_field: value})
    session.add(instance)
    session.commit()
    session.refresh(instance)

    return instance




def get_all_products(db: Session, skip: int = 0, limit: int = 100):
    query = db.query(models.Product)
    if random:
        query = query.order_by(func.random())
    return query.limit(limit).all()


def get_product_by_name_or_id(db: Session, query: str):
    q = (
        db.query(models.Product)
        .join(models.Drug, models.Product.drug_id == models.Drug.id)
        .join(models.Brand, models.Product.brand_id == models.Brand.id, isouter=True)
    )

    if query.isdigit():
        return q.filter(
            or_(
                models.Product.id == int(query),
                models.Drug.name.ilike(f"%{query}%"),
                models.Brand.name.ilike(f"%{query}%"),
            )
        ).all()

    return q.filter(
        or_(
            models.Drug.name.ilike(f"%{query}%"),
            models.Brand.name.ilike(f"%{query}%"),
        )
    ).all()




def create_product(db: Session, product: schemas.ProductCreate):
    # find or create related objects
    drug = get_or_create(db, models.Drug, "name", product.drug_id)
    brand = get_or_create(db, models.Brand, "name", product.brand_id)
    formulation = get_or_create(db, models.FormulationType, "name", product.formulation_type_id)
    unit = get_or_create(db, models.Unit, "name", product.unit_id)

    db_product = models.Product(
        strength=product.strength,
        price=product.price,
        nhia_cover=product.nhia_cover,
        stock=product.stock,
        notes=product.notes,
        drug_id=drug.id,
        brand_id=brand.id,
        formulation_type_id=formulation.id,
        unit_id=unit.id,
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product


def update_product(db: Session, product_id: int, update_data: schemas.ProductBase):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(product, key, value)

    product.last_changed_date = datetime.now()
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None
    
    db.delete(product)
    db.commit()
    return True


# USER CREATION ENDPOINT 

def create_user(db: Session, user: schemas.UserCreate):
    # Check for existing username or email
    existing_user = (
        db.query(models.User)
        .filter(
            (models.User.username == user.username) |
            (models.User.email == user.email)
        )
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists."
        )
    hashed_pw = hash_password(user.password)
    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        is_admin=user.is_admin,
        is_active=user.is_active,
        created_at=datetime.now()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def create_user_with_verification(db: Session, user: schemas.UserCreate, verification_code: str = None):
    # Generate a random 6-digit verification code if not provided
    if verification_code is None:
        verification_code = str(random.randint(100000, 999999))

    existing_user = (
        db.query(models.User)
        .filter(
            (models.User.username == user.username) |
            (models.User.email == user.email)
        )
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists."
        )
    # Create user object
    new_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hash_password(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=False,  # New users are inactive until verified
        is_google_account=user.is_google_account if hasattr(user, "is_google_account") else False,
        verification_code=verification_code,
        created_at=datetime.now()
    )

    # Add to DB
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def get_user(
    db: Session, username_or_email: str
) -> models.User | None:
    if isinstance(username_or_email, int):
        return db.query(models.User).filter(models.User.id == username_or_email).first()
    try:
        validate_email(username_or_email)
        query_filter = models.User.email
    except EmailNotValidError:
        query_filter = models.User.username
    user = (
        db.query(models.User)
        .filter(query_filter == username_or_email)
        .first()
    )
    return user

def get_user_by_email(db: Session, email: str):
    return (
        db.query(models.User)
        .filter(func.lower(models.User.email) == email.lower())
        .first()
    )

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_any(db:Session, query: str):
    """
    Search for a user by ID, username or email (case-insensitive)
    """

    q = db.query(models.User)

    if query.isdigit():
        # Search by ID or any string-like field
        return q.filter(
            or_(
                models.User.id == int(query),
                models.User.username.ilike(f"%{query}%"),
                models.User.email.ilike(f"%{query}%")
            )
        ).all()
    
    return q.filter(
        or_(
            models.User.username.ilike(f"%{query}%"),
            models.User.email.ilike(f"%{query}%")
        )
    ).all()


def update_user(db:Session, user_id: int, update_data: dict):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user



def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    db.delete(db_user)
    db.commit()
    return True


# gets dispense history per User

def get_dispense_history_per_user(db: Session, user_id: int):
    """
    Return all dispense records for a user, including nested items and product info
    """
    user_dispenses = (
        db.query(models.Dispense)
        .filter(models.Dispense.user_id == user_id)
        .order_by(models.Dispense.created_at.desc())
        .all()
    )
    return [to_dispense_response(u) for u in user_dispenses]