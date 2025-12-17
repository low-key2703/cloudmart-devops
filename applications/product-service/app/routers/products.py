from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.models.database import get_db
from app.models.product import Product, Category
from app.schemas.product import (
    ProductCreate, 
    ProductUpdate, 
    ProductResponse,
    PaginatedProducts,
    CategoryCreate,
    CategoryResponse
)

router = APIRouter()


# ==================== PRODUCTS ====================

@router.get("/products", response_model=PaginatedProducts)
def list_products(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all products with pagination and filters"""
    
    # Start query - only active products
    query = db.query(Product).filter(Product.is_active == True)
    
    # Apply filters
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    pages = (total + size - 1) // size  # Ceiling division
    offset = (page - 1) * size
    
    # Get items
    items = query.offset(offset).limit(size).all()
    
    return PaginatedProducts(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.post("/products", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product"""
    
    # Validate category exists if provided
    if product.category_id:
        category = db.query(Category).filter(Category.id == product.category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
    
    # Create product
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    return db_product


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int, 
    product: ProductUpdate, 
    db: Session = Depends(get_db)
):
    """Update an existing product"""
    
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Only update fields that were provided
    update_data = product.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    
    return db_product


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product"""
    
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    
    return None


@router.patch("/products/{product_id}/stock")
def update_stock(
    product_id: int, 
    quantity: int = Query(..., description="Amount to add (positive) or remove (negative)"),
    db: Session = Depends(get_db)
):
    """Update product stock. Used by Order Service when orders are placed."""
    
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_stock = db_product.stock_quantity + quantity
    
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    db_product.stock_quantity = new_stock
    db.commit()
    
    return {
        "product_id": product_id,
        "previous_stock": db_product.stock_quantity - quantity,
        "change": quantity,
        "new_stock": new_stock
    }


# ==================== CATEGORIES ====================

@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """List all categories"""
    return db.query(Category).all()


@router.get("/categories/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a single category"""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category


@router.post("/categories", response_model=CategoryResponse, status_code=201)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""
    
    # Check if name already exists
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category
