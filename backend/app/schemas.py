from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class DrugBase(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class BrandBase(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes =True


class FormulationTypeBase(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class Unit(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True



class ProductBase(BaseModel):
    strength: Optional[str] = None
    price: Optional[float] = None
    nhia_cover: Optional[bool] = False
    stock: Optional[int] = 0
    reorder_level: Optional[int] = 0
    notes: Optional[str] = None



class ProductCreate(ProductBase):
    drug_id: str
    brand_id: Optional[str] = None
    formulation_type_id: str
    unit_id: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    drug: str
    brand: Optional[str]
    formulation_type: str
    unit: Optional[str]
    last_changed_date: Optional[datetime] = None

    class Config:
        from_attributes = True # allows returning SQLALchemy models directly

# Users 

class UserBase(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    username: str
    email: EmailStr
    


class UserCreate(UserBase):
    password: str
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None



class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str



class UserCreateResponse(BaseModel):
    username: str
    email: EmailStr



# DISPENSING SCHEMAS 

class DispenseUser(BaseModel):
    id: int | None = None
    username: str | None = None

    class Config:
        from_attributes = True

class DispenseItemCreate(BaseModel):
    product_id: int
    qty: int


class DispenseCreate(BaseModel):
    items: List[DispenseItemCreate]


class DispenseProduct(BaseModel):
    id: int
    drug: str | None = None
    brand: str | None = None

    class Config:
        from_attributes = True



class DispenseItemResponse(BaseModel):
    id: int
    qty: int
    price_at_dispense: Optional[float]
    product: DispenseProduct

    class Config:
        from_attributes = True


class DispenseProduct(BaseModel):
    id: int
    drug: Optional[str]
    brand: Optional[str]

    class Config:
        from_attributes = True

class DispenseResponse(BaseModel):
    id: int
    created_at: datetime
    user_id: Optional[int] = None
    user: Optional[DispenseUser] = None
    items: list[DispenseItemResponse]

    class Config:
        from_attributes = True


class AuditLogBase(BaseModel):
    admin_id: int
    product_id: int
    action: str
    old_value: int | None = None
    new_value: int | None = None
    timestamp: datetime

    class Config:
        from_attributes = True

class DeleteResponse(BaseModel):
    message: str


# Email Verification Schema 

class VerifyEmail(BaseModel):
    email: str
    code: str

# ForgotPassword 

class ForgotPasswordRequest(BaseModel):
    email: str
    


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str



# Low Notifications 

class LowStockNotificationBase(BaseModel):
    product_id: int
    message: str
    is_active: bool


class LowStockNotificationResponse(LowStockNotificationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ActiveNotification(BaseModel):
    message: str

    
