from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class ProductScenario(str, Enum):
    REGISTRATION = "registration"
    PHYSICAL = "physical_product"
    DIGITAL = "digital_product"

class ItemStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

# Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Category Models
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = ""
    status: ItemStatus = ItemStatus.ACTIVE

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ItemStatus] = None

class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Product Models
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = ""
    scenario: ProductScenario
    category_id: Optional[str] = None
    price: float = 0.0
    status: ItemStatus = ItemStatus.ACTIVE

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scenario: Optional[ProductScenario] = None
    category_id: Optional[str] = None
    price: Optional[float] = None
    status: Optional[ItemStatus] = None

class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Analytics Model
class Analytics(BaseModel):
    total_categories: int
    active_categories: int
    total_products: int
    active_products: int
    products_by_scenario: dict
    price_stats: dict
    recent_activity: List[dict]

# Settings Models
class LanguageSettings(BaseModel):
    default_language: str = "ru"
    available_languages: List[str] = ["ru", "en", "uk"]

class PaymentSettings(BaseModel):
    currency: str = "UAH"
    payment_methods: List[str] = ["card", "cash", "online"]
    tax_rate: float = 20.0

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Admin Panel API"}

# Status endpoints
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Categories CRUD
@api_router.get("/categories", response_model=List[Category])
async def get_categories(status: Optional[ItemStatus] = None):
    query = {}
    if status:
        query["status"] = status.value
    categories = await db.categories.find(query, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat.get('created_at'), str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
        if isinstance(cat.get('updated_at'), str):
            cat['updated_at'] = datetime.fromisoformat(cat['updated_at'])
    return categories

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if isinstance(category.get('created_at'), str):
        category['created_at'] = datetime.fromisoformat(category['created_at'])
    if isinstance(category.get('updated_at'), str):
        category['updated_at'] = datetime.fromisoformat(category['updated_at'])
    return category

@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate):
    category = Category(**input.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    doc['status'] = doc['status'].value
    await db.categories.insert_one(doc)
    return category

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, input: CategoryUpdate):
    existing = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if 'status' in update_data:
        update_data['status'] = update_data['status'].value
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.categories.update_one({"id": category_id}, {"$set": update_data})
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return updated

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, permanent: bool = False):
    existing = await db.categories.find_one({"id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if permanent:
        await db.categories.delete_one({"id": category_id})
        return {"message": "Category permanently deleted"}
    else:
        await db.categories.update_one(
            {"id": category_id}, 
            {"$set": {"status": ItemStatus.ARCHIVED.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Category archived"}

# Products CRUD
@api_router.get("/products", response_model=List[Product])
async def get_products(
    status: Optional[ItemStatus] = None,
    scenario: Optional[ProductScenario] = None,
    category_id: Optional[str] = None
):
    query = {}
    if status:
        query["status"] = status.value
    if scenario:
        query["scenario"] = scenario.value
    if category_id:
        query["category_id"] = category_id
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for prod in products:
        if isinstance(prod.get('created_at'), str):
            prod['created_at'] = datetime.fromisoformat(prod['created_at'])
        if isinstance(prod.get('updated_at'), str):
            prod['updated_at'] = datetime.fromisoformat(prod['updated_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    if isinstance(product.get('updated_at'), str):
        product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    return product

@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
    product = Product(**input.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    doc['status'] = doc['status'].value
    doc['scenario'] = doc['scenario'].value
    await db.products.insert_one(doc)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, input: ProductUpdate):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if 'status' in update_data:
        update_data['status'] = update_data['status'].value
    if 'scenario' in update_data:
        update_data['scenario'] = update_data['scenario'].value
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, permanent: bool = False):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if permanent:
        await db.products.delete_one({"id": product_id})
        return {"message": "Product permanently deleted"}
    else:
        await db.products.update_one(
            {"id": product_id}, 
            {"$set": {"status": ItemStatus.ARCHIVED.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Product archived"}

# Restore archived item
@api_router.post("/restore/{item_type}/{item_id}")
async def restore_item(item_type: str, item_id: str):
    collection = db.categories if item_type == "category" else db.products
    existing = await collection.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await collection.update_one(
        {"id": item_id}, 
        {"$set": {"status": ItemStatus.ACTIVE.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": f"{item_type.capitalize()} restored"}

# Analytics
@api_router.get("/analytics", response_model=Analytics)
async def get_analytics():
    # Get categories stats
    all_categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    active_categories = [c for c in all_categories if c.get('status') != 'archived']
    
    # Get products stats
    all_products = await db.products.find({}, {"_id": 0}).to_list(1000)
    active_products = [p for p in all_products if p.get('status') != 'archived']
    
    # Products by scenario
    products_by_scenario = {
        "registration": len([p for p in active_products if p.get('scenario') == 'registration']),
        "physical_product": len([p for p in active_products if p.get('scenario') == 'physical_product']),
        "digital_product": len([p for p in active_products if p.get('scenario') == 'digital_product'])
    }
    
    # Price stats
    prices = [p.get('price', 0) for p in active_products if p.get('price', 0) > 0]
    price_stats = {
        "min": min(prices) if prices else 0,
        "max": max(prices) if prices else 0,
        "avg": sum(prices) / len(prices) if prices else 0,
        "total": sum(prices)
    }
    
    # Recent activity (mock data for now)
    recent_activity = [
        {"type": "category", "action": "created", "name": "Electronics", "time": "2 hours ago"},
        {"type": "product", "action": "updated", "name": "Smartphone", "time": "4 hours ago"},
        {"type": "product", "action": "created", "name": "Laptop", "time": "1 day ago"}
    ]
    
    return Analytics(
        total_categories=len(all_categories),
        active_categories=len(active_categories),
        total_products=len(all_products),
        active_products=len(active_products),
        products_by_scenario=products_by_scenario,
        price_stats=price_stats,
        recent_activity=recent_activity
    )

# Settings endpoints
@api_router.get("/settings/language", response_model=LanguageSettings)
async def get_language_settings():
    settings = await db.settings.find_one({"type": "language"}, {"_id": 0})
    if settings:
        return LanguageSettings(**settings)
    return LanguageSettings()

@api_router.put("/settings/language", response_model=LanguageSettings)
async def update_language_settings(input: LanguageSettings):
    await db.settings.update_one(
        {"type": "language"},
        {"$set": {**input.model_dump(), "type": "language"}},
        upsert=True
    )
    return input

@api_router.get("/settings/payment", response_model=PaymentSettings)
async def get_payment_settings():
    settings = await db.settings.find_one({"type": "payment"}, {"_id": 0})
    if settings:
        return PaymentSettings(**settings)
    return PaymentSettings()

@api_router.put("/settings/payment", response_model=PaymentSettings)
async def update_payment_settings(input: PaymentSettings):
    await db.settings.update_one(
        {"type": "payment"},
        {"$set": {**input.model_dump(), "type": "payment"}},
        upsert=True
    )
    return input

# Archived items
@api_router.get("/archive")
async def get_archived_items():
    archived_categories = await db.categories.find({"status": "archived"}, {"_id": 0}).to_list(1000)
    archived_products = await db.products.find({"status": "archived"}, {"_id": 0}).to_list(1000)
    return {
        "categories": archived_categories,
        "products": archived_products
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
