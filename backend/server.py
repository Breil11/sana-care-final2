from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str  # admin, infirmier, aide_soignant
    phone: Optional[str] = None
    photo: Optional[str] = None
    institution_id: Optional[str] = None
    referent_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: str  # pending, approved, rejected
    created_at: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Institution(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    address: str
    phone: str
    email: Optional[str] = None
    created_at: str

class InstitutionCreate(BaseModel):
    name: str
    address: str
    phone: str
    email: Optional[str] = None

class Schedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    institution_id: str
    date: str
    start_time: str
    end_time: str
    status: str  # available, booked, completed
    created_at: str

class ScheduleCreate(BaseModel):
    user_id: str
    institution_id: str
    date: str
    start_time: str
    end_time: str
    status: str = "available"

class Shift(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    institution_id: str
    date: str
    hours: float
    hourly_rate: float
    travel_cost: float
    total: float
    status: str  # pending, validated, paid
    created_at: str

class ShiftCreate(BaseModel):
    user_id: str
    institution_id: str
    date: str
    hours: float
    hourly_rate: float
    travel_cost: float = 0.0

class Payslip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    period: str  # YYYY-MM
    shifts: List[str]  # shift IDs
    gross_total: float
    commission: float  # 7%
    net_total: float
    created_at: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    sender_id: str
    recipient_id: str
    content: str
    timestamp: str
    read: bool = False

class MessageCreate(BaseModel):
    recipient_id: str
    content: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    type: str
    content: str
    timestamp: str
    read: bool = False

class ShiftExchange(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    from_user_id: str
    to_user_id: str
    shift_id: str
    status: str  # pending, accepted, rejected
    created_at: str

class ShiftExchangeCreate(BaseModel):
    to_user_id: str
    shift_id: str

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def create_notification(user_id: str, notification_type: str, content: str):
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "read": False
    }
    await db.notifications.insert_one(notification)

# Routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.model_dump()
    user_dict["password_hash"] = hash_password(user_dict.pop("password"))
    user_dict["id"] = str(uuid.uuid4())
    user_dict["status"] = "pending" if user_data.role != "admin" else "approved"
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Notify admins
    admins = await db.users.find({"role": "admin"}, {"_id": 0}).to_list(100)
    for admin in admins:
        await create_notification(admin["id"], "new_user", f"Nouvelle inscription: {user_data.first_name} {user_data.last_name}")
    
    return User(**{k: v for k, v in user_dict.items() if k != "password_hash"})

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["status"] != "approved":
        raise HTTPException(status_code=403, detail="Account pending approval")
    
    token = create_access_token({"sub": user["id"]})
    user_obj = User(**{k: v for k, v in user.items() if k != "password_hash"})
    return Token(access_token=token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [User(**u) for u in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.patch("/users/{user_id}/status")
async def update_user_status(user_id: str, status: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await create_notification(user_id, "status_update", f"Votre compte a été {status}")
    return {"message": "Status updated"}

@api_router.patch("/users/{user_id}")
async def update_user(user_id: str, updates: dict, current_user: User = Depends(get_current_user)):
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))
    
    result = await db.users.update_one({"id": user_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated"}

# Institutions
@api_router.post("/institutions", response_model=Institution)
async def create_institution(data: InstitutionCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    inst_dict = data.model_dump()
    inst_dict["id"] = str(uuid.uuid4())
    inst_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.institutions.insert_one(inst_dict)
    return Institution(**inst_dict)

@api_router.get("/institutions", response_model=List[Institution])
async def get_institutions(current_user: User = Depends(get_current_user)):
    institutions = await db.institutions.find({}, {"_id": 0}).to_list(1000)
    return [Institution(**i) for i in institutions]

# Schedules
@api_router.post("/schedules", response_model=Schedule)
async def create_schedule(data: ScheduleCreate, current_user: User = Depends(get_current_user)):
    schedule_dict = data.model_dump()
    schedule_dict["id"] = str(uuid.uuid4())
    schedule_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.schedules.insert_one(schedule_dict)
    return Schedule(**schedule_dict)

@api_router.get("/schedules", response_model=List[Schedule])
async def get_schedules(user_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if user_id:
        query["user_id"] = user_id
    elif current_user.role != "admin":
        query["user_id"] = current_user.id
    
    schedules = await db.schedules.find(query, {"_id": 0}).to_list(1000)
    return [Schedule(**s) for s in schedules]

@api_router.patch("/schedules/{schedule_id}")
async def update_schedule(schedule_id: str, updates: dict, current_user: User = Depends(get_current_user)):
    result = await db.schedules.update_one({"id": schedule_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule updated"}

# Shifts
@api_router.post("/shifts", response_model=Shift)
async def create_shift(data: ShiftCreate, current_user: User = Depends(get_current_user)):
    shift_dict = data.model_dump()
    shift_dict["id"] = str(uuid.uuid4())
    shift_dict["total"] = (data.hours * data.hourly_rate) + data.travel_cost
    shift_dict["status"] = "pending"
    shift_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.shifts.insert_one(shift_dict)
    return Shift(**shift_dict)

@api_router.get("/shifts", response_model=List[Shift])
async def get_shifts(user_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if user_id:
        query["user_id"] = user_id
    elif current_user.role != "admin":
        query["user_id"] = current_user.id
    
    shifts = await db.shifts.find(query, {"_id": 0}).to_list(1000)
    return [Shift(**s) for s in shifts]

@api_router.patch("/shifts/{shift_id}/status")
async def update_shift_status(shift_id: str, status: str, current_user: User = Depends(get_current_user)):
    result = await db.shifts.update_one({"id": shift_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    return {"message": "Shift status updated"}

# Payslips
@api_router.post("/payslips/generate")
async def generate_payslip(user_id: str, period: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Get validated shifts for the period
    shifts = await db.shifts.find({
        "user_id": user_id,
        "status": "validated",
        "date": {"$regex": f"^{period}"}
    }, {"_id": 0}).to_list(1000)
    
    if not shifts:
        raise HTTPException(status_code=404, detail="No validated shifts for this period")
    
    gross_total = sum(s["total"] for s in shifts)
    commission = gross_total * 0.07
    net_total = gross_total - commission
    
    payslip = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "period": period,
        "shifts": [s["id"] for s in shifts],
        "gross_total": gross_total,
        "commission": commission,
        "net_total": net_total,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.payslips.insert_one(payslip)
    await db.shifts.update_many(
        {"id": {"$in": payslip["shifts"]}},
        {"$set": {"status": "paid"}}
    )
    
    await create_notification(user_id, "payslip", f"Nouvelle fiche de paie pour {period}")
    return Payslip(**payslip)

@api_router.get("/payslips", response_model=List[Payslip])
async def get_payslips(user_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if user_id:
        query["user_id"] = user_id
    elif current_user.role != "admin":
        query["user_id"] = current_user.id
    
    payslips = await db.payslips.find(query, {"_id": 0}).to_list(1000)
    return [Payslip(**p) for p in payslips]

# Messages
@api_router.post("/messages", response_model=Message)
async def send_message(data: MessageCreate, current_user: User = Depends(get_current_user)):
    message_dict = data.model_dump()
    message_dict["id"] = str(uuid.uuid4())
    message_dict["sender_id"] = current_user.id
    message_dict["timestamp"] = datetime.now(timezone.utc).isoformat()
    message_dict["read"] = False
    
    await db.messages.insert_one(message_dict)
    await create_notification(data.recipient_id, "message", f"Nouveau message de {current_user.first_name} {current_user.last_name}")
    
    return Message(**message_dict)

@api_router.get("/messages", response_model=List[Message])
async def get_messages(other_user_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    if other_user_id:
        query = {
            "$or": [
                {"sender_id": current_user.id, "recipient_id": other_user_id},
                {"sender_id": other_user_id, "recipient_id": current_user.id}
            ]
        }
    else:
        query = {
            "$or": [
                {"sender_id": current_user.id},
                {"recipient_id": current_user.id}
            ]
        }
    
    messages = await db.messages.find(query, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    return [Message(**m) for m in messages]

@api_router.patch("/messages/{message_id}/read")
async def mark_message_read(message_id: str, current_user: User = Depends(get_current_user)):
    result = await db.messages.update_one(
        {"id": message_id, "recipient_id": current_user.id},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message marked as read"}

# Notifications
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    return [Notification(**n) for n in notifications]

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@api_router.patch("/notifications/read-all")
async def mark_all_notifications_read(current_user: User = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user.id},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

# Shift Exchanges
@api_router.post("/exchanges", response_model=ShiftExchange)
async def create_exchange(data: ShiftExchangeCreate, current_user: User = Depends(get_current_user)):
    shift = await db.shifts.find_one({"id": data.shift_id}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    if shift["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not your shift")
    
    exchange_dict = data.model_dump()
    exchange_dict["id"] = str(uuid.uuid4())
    exchange_dict["from_user_id"] = current_user.id
    exchange_dict["status"] = "pending"
    exchange_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.shift_exchanges.insert_one(exchange_dict)
    await create_notification(data.to_user_id, "exchange", f"Demande d'échange de prestation de {current_user.first_name}")
    
    return ShiftExchange(**exchange_dict)

@api_router.get("/exchanges", response_model=List[ShiftExchange])
async def get_exchanges(current_user: User = Depends(get_current_user)):
    exchanges = await db.shift_exchanges.find({
        "$or": [
            {"from_user_id": current_user.id},
            {"to_user_id": current_user.id}
        ]
    }, {"_id": 0}).to_list(1000)
    return [ShiftExchange(**e) for e in exchanges]

@api_router.patch("/exchanges/{exchange_id}")
async def update_exchange(exchange_id: str, status: str, current_user: User = Depends(get_current_user)):
    exchange = await db.shift_exchanges.find_one({"id": exchange_id}, {"_id": 0})
    if not exchange:
        raise HTTPException(status_code=404, detail="Exchange not found")
    if exchange["to_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    await db.shift_exchanges.update_one({"id": exchange_id}, {"$set": {"status": status}})
    
    if status == "accepted":
        await db.shifts.update_one(
            {"id": exchange["shift_id"]},
            {"$set": {"user_id": current_user.id}}
        )
        await create_notification(exchange["from_user_id"], "exchange", "Votre demande d'échange a été acceptée")
    elif status == "rejected":
        await create_notification(exchange["from_user_id"], "exchange", "Votre demande d'échange a été refusée")
    
    return {"message": f"Exchange {status}"}

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        total_users = await db.users.count_documents({})
        pending_users = await db.users.count_documents({"status": "pending"})
        total_institutions = await db.institutions.count_documents({})
        total_shifts = await db.shifts.count_documents({})
        pending_shifts = await db.shifts.count_documents({"status": "pending"})
        
        # Recent shifts total
        from datetime import datetime, timedelta
        thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        recent_shifts = await db.shifts.find(
            {"created_at": {"$gte": thirty_days_ago}},
            {"_id": 0}
        ).to_list(1000)
        recent_total = sum(s["total"] for s in recent_shifts)
        
        return {
            "total_users": total_users,
            "pending_users": pending_users,
            "total_institutions": total_institutions,
            "total_shifts": total_shifts,
            "pending_shifts": pending_shifts,
            "recent_revenue": recent_total
        }
    else:
        user_shifts = await db.shifts.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
        total_hours = sum(s["hours"] for s in user_shifts)
        total_earned = sum(s["total"] for s in user_shifts if s["status"] == "paid")
        pending_amount = sum(s["total"] for s in user_shifts if s["status"] in ["pending", "validated"])
        
        unread_messages = await db.messages.count_documents({
            "recipient_id": current_user.id,
            "read": False
        })
        
        return {
            "total_shifts": len(user_shifts),
            "total_hours": total_hours,
            "total_earned": total_earned,
            "pending_amount": pending_amount,
            "unread_messages": unread_messages
        }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
