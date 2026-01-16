import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from app.security import get_current_admin, get_current_user

from app.schemas import ProductBase, ProductCreate, ProductResponse
from app.crud import (
    get_all_products, 
    get_product_by_name_or_id, 
    create_product, 
    update_product, 
    delete_product
)
from app.utils import to_product_response

from app import models

from app.database import get_db
from app.operations import ad_search_products, update_product_reorder_level, update_product_stock

router = APIRouter(prefix="/products", tags=["Products"])


# ------- PUBLIC ENDPOINTS --------

@router.get("/", response_model=list[ProductResponse], dependencies=[Depends(get_current_user)])
def read_products(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Get a paginated list of all products.
    """
    products = get_all_products(db, skip=skip, limit=limit)
    return [
        to_product_response(p) for p in products
    ]


@router.get("/db-search/", response_model=list[ProductResponse], dependencies=[Depends(get_current_user)])
def search_products(query: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """
    Search for products by name.
    """
    results = get_product_by_name_or_id(db, query)
    if not results:
        return []
    return [
        to_product_response(p) for p in results
    ]


@router.get("/search/", response_model=List[ProductResponse], dependencies=[Depends(get_current_user)])
async def advanced_search_products(
    query: str = Query(..., description="Search text for drug name, brand, strength, or unit."),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
     Advanced search for products by multiple tokens.
    Example: `paracetamol 500mg fidson` → filters by all terms.
    """

    results = await ad_search_products(db=db, query=query, skip=skip, limit=limit)
    if not results:
        raise HTTPException(status_code=404, detail="No matching products found.")
    return [to_product_response(p) for p in results]


# ----- ADMIN ENDPOINTS --------

@router.post("/create-products/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin)])
def create_product_route(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Create a new product record.
    """
    new_product = create_product(db, product)
    return to_product_response(new_product)



@router.put("/update-products/{product_id}", response_model=ProductResponse, dependencies=[Depends(get_current_admin)])
def update_product_route(product_id: int, update_data: ProductBase, db: Session = Depends(get_db)):
    """
    Update an existing product by ID.
    """
    product = update_product(db, product_id, update_data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return to_product_response(product)



@router.delete("/delete-products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin)])
def delete_product_route(product_id: int, db: Session = Depends(get_db)):
    """
    Delete a product by ID.
    """
    success = delete_product(db,product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found.")
    return {"detail": "Product deleted successfully."}


@router.put("/{product_id}/reorder", response_model=ProductResponse)
def update_reorder_level(
    product_id: int,
    reorder_level: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    updated_product = update_product_reorder_level(db, product_id, reorder_level, current_admin.id)

    return to_product_response(updated_product)


@router.put("/{product_id}/stock", response_model=ProductResponse)
def update_stock(
    product_id: int,
    qty: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    updated_stock = update_product_stock(db, product_id, qty, current_admin.id)
    return to_product_response(updated_stock)
    