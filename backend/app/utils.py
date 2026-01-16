from pathlib import Path
import pyotp
from dotenv import load_dotenv
from sqlalchemy import func
from sqlalchemy.orm import Session
from email_validator import validate_email, EmailNotValidError
from app import models, schemas, crud, security
import os
import secrets

from app import models, schemas
from passlib.context import CryptContext

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

def to_product_response(p: models.Product) -> schemas.ProductResponse:
    """
    Convert a SQLAlchemy Product instance -> Pydantic ProductResponse.
    Expects related objects (drug, brand, formulation_type, unit) to be loaded.
    """
    if p is None:
        raise ValueError("Product is None")
    
    return schemas.ProductResponse(
        id=p.id,
        drug=p.drug.name if p.drug else None,
        brand=p.brand.name if p.brand else None,
        formulation_type=p.formulation_type.name if p.formulation_type else None,
        unit=p.unit.name if p.unit else None,
        strength=p.strength,
        price=p.price,
        nhia_cover=p.nhia_cover,
        stock=p.stock,
        notes=p.notes,
        reorder_level=p.reorder_level,
        last_changed_date=p.last_changed_date
    )


# for users 

def to_user_response(u: models.User) -> schemas.UserResponse:
    """
    Convert a SQLAlchemy User instance -> Pydantic UserResponse.
    Expects a fully loaded User object.
    """
    if u is None:
        raise ValueError("User is None")
    
    return schemas.UserResponse(
        id=u.id,
        first_name=u.first_name,
        last_name=u.last_name,
        username=u.username,
        email=u.email,
        is_active=u.is_active,
        is_admin=u.is_admin,
    )


def to_dispense_response(dispense: models.Dispense) -> dict:
    """
    Convert a Dispense SQLAlchemy model -> dict matching schemas.DispenseResponse.
    Includes user_id and user {id, username} for frontend use.
    """
    if dispense is None:
        raise ValueError("Dispense is None")

    # build items as before
    items = []
    for it in dispense.items:
        prod = it.product

        if prod:
            drug_value = prod.drug.name if hasattr(prod.drug, "name") else prod.drug
            brand_value = prod.brand.name if hasattr(prod.brand, "name") else prod.brand

            product_data = {
                "id": prod.id,
                "drug": drug_value,
                "brand": brand_value,
            }
        else:
            product_data = {"id": None, "drug": None, "brand": None}

        items.append(
            {
                "id": it.id,
                "qty": it.qty,
                "price_at_dispense": it.price_at_dispense,
                "product": product_data,
            }
        )

    # user info — be defensive (relationship may or may not be loaded)
    user_obj = None
    try:
        if getattr(dispense, "user", None):
            user_obj = {
                "id": getattr(dispense.user, "id", None),
                "username": getattr(dispense.user, "username", None),
            }
    except Exception:
        user_obj = None

    return {
        "id": dispense.id,
        "created_at": dispense.created_at,
        "user_id": getattr(dispense, "user_id", None),
        "user": user_obj,  
        "items": items,
    }






# hashing the password

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password:str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)



def authenticate_user(
        db: Session,
        username_or_email: str,
        password: str
):
    input_value = username_or_email.strip()
    try:
        validate_email(input_value)
        user = (
            db.query(models.User)
            .filter(func.lower(models.User.email) == input_value.lower())
            .first()
        )
    except EmailNotValidError:
        user = (
            db.query(models.User)
            .filter(func.lower(models.User.username) == input_value.lower())
            .first()
        )

    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    return user


# MFA generation of OTP code for users


def generate_unique_username(db, email: str):
    base = email.split("@")[0].lower()
    username = base

    while crud.get_user_by_username(db, username) is not None:
        username = f"{base}_{secrets.token_hex(2)}"

    return username




# CREATE RESET LINK FOR PASSWORDS

def create_reset_link(user_id: int):
    token = security.create_password_reset_token(user_id)
    frontend_url = "http://localhost:5173/reset-password"
    
    return f"{frontend_url}?token={token}"
