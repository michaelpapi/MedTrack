from sqlalchemy import (
    Column, Integer, BigInteger, String, Float, Boolean,
    ForeignKey, DateTime, Text, func
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.hybrid import hybrid_property
from app.database import Base


# --------------------
# LOOKUP TABLES
# --------------------

class FormulationType(Base):
    __tablename__ = "formulation_type"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    last_changed_date = Column(DateTime, server_default=func.now(), onupdate=func.now())

    products = relationship("Product", back_populates="formulation_type")


class Unit(Base):
    __tablename__ = "unit"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    last_changed_date = Column(DateTime, server_default=func.now(), onupdate=func.now())

    products = relationship("Product", back_populates="unit")


class Drug(Base):
    __tablename__ = "drug"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    last_changed_date = Column(DateTime, server_default=func.now(), onupdate=func.now())

    products = relationship("Product", back_populates="drug")


class Brand(Base):
    __tablename__ = "brand"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    last_changed_date = Column(DateTime, server_default=func.now(), onupdate=func.now())

    products = relationship("Product", back_populates="brand")


# --------------------
# PRODUCT
# --------------------

class Product(Base):
    __tablename__ = "product"

    id = Column(Integer, primary_key=True, autoincrement=True)

    drug_id = Column(Integer, ForeignKey("drug.id"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brand.id"), nullable=True)
    formulation_type_id = Column(Integer, ForeignKey("formulation_type.id"), nullable=False)
    unit_id = Column(Integer, ForeignKey("unit.id"), nullable=True)

    strength = Column(String)
    price = Column(Float)
    nhia_cover = Column(Boolean, default=False)
    stock = Column(Integer, default=0)
    reorder_level = Column(Integer, default=10)
    last_changed_date = Column(DateTime, server_default=func.now(), onupdate=func.now())
    notes = Column(Text, nullable=True)

    drug = relationship("Drug", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    formulation_type = relationship("FormulationType", back_populates="products")
    unit = relationship("Unit", back_populates="products")


# --------------------
# USER
# --------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    username = Column(String, unique=True, nullable=False)

    _email = Column("email", String, unique=True, nullable=False)

    @hybrid_property
    def email(self):
        return self._email

    @email.setter
    def email(self, value):
        self._email = value.strip().lower() if value else None

    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_google_account = Column(Boolean, default=False)

    verification_code = Column(String(6))
    password_reset_code = Column(String(6))

    created_at = Column(DateTime, server_default=func.now())

    totp_secret: Mapped[str] = mapped_column(nullable=True)

    dispenses = relationship("Dispense", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="admin")


# --------------------
# DISPENSING
# --------------------

class Dispense(Base):
    __tablename__ = "dispense"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="dispenses")
    items = relationship("DispenseItem", back_populates="dispense", cascade="all, delete-orphan")


class DispenseItem(Base):
    __tablename__ = "dispense_item"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dispense_id = Column(Integer, ForeignKey("dispense.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("product.id"), nullable=False)

    qty = Column(Integer, nullable=False)
    price_at_dispense = Column(Float)

    dispense = relationship("Dispense", back_populates="items")
    product = relationship("Product")


# --------------------
# AUDIT LOG
# --------------------

class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("product.id"), nullable=False)

    action = Column(String, nullable=False)
    old_value = Column(Integer)
    new_value = Column(Integer)
    timestamp = Column(DateTime, server_default=func.now())

    admin = relationship("User", back_populates="audit_logs")
    product = relationship("Product")




class LowStockNotification(Base):
    __tablename__ = "low_stock_notifications"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.id"), unique=True, index=True)
    message = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product")

    