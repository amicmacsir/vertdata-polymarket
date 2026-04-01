"""
VertData Polymarket CLOB Trade Executor
FastAPI service for executing trades via Polymarket CLOB API
"""
import os
import sqlite3
import json
import hmac
import hashlib
import base64
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv

load_dotenv()

# Configuration
EXECUTOR_SECRET = os.getenv("EXECUTOR_API_SECRET", "change-me-in-production")
MAX_ORDER_USD = float(os.getenv("MAX_ORDER_USD", "500"))
DB_PATH = os.getenv("DB_PATH", "./executor.db")
PORT = int(os.getenv("PORT", "8003"))

# Security
security = HTTPBearer()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler('trades.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Database initialization
def init_db():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            wallet_address TEXT NOT NULL,
            clob_api_key TEXT NOT NULL,
            clob_secret TEXT NOT NULL,
            clob_passphrase TEXT NOT NULL,
            portfolio_usdc REAL DEFAULT 1000.0,
            max_positions INTEGER DEFAULT 3,
            risk_level TEXT DEFAULT 'balanced',
            max_trade_usd REAL DEFAULT 500.0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    
    # Orders table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            market_question TEXT,
            condition_id TEXT,
            token_id TEXT,
            side TEXT,
            outcome TEXT,
            price REAL,
            size_usdc REAL,
            status TEXT DEFAULT 'pending',
            polymarket_order_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    
    # Signals log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS signals_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT,
            timestamp TEXT,
            markets_reviewed INTEGER,
            signals_count INTEGER,
            executed_count INTEGER,
            skipped_count INTEGER,
            raw_json TEXT
        )
    """)
    
    conn.commit()
    conn.close()
    logger.info(f"Database initialized at {DB_PATH}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager - initialize DB on startup"""
    init_db()
    yield

# FastAPI app
app = FastAPI(
    title="VertData Polymarket Executor",
    version="1.0.0",
    lifespan=lifespan
)

# Pydantic models
class UserRegister(BaseModel):
    user_id: str
    wallet_address: str
    clob_api_key: str
    clob_secret: str
    clob_passphrase: str
    portfolio_usdc: float = 1000.0

class UserSettings(BaseModel):
    portfolio_usdc: Optional[float] = None
    max_positions: Optional[int] = None
    risk_level: Optional[str] = None
    max_trade_usd: Optional[float] = None

class Signal(BaseModel):
    market_question: str
    condition_id: str
    token_id: str
    outcome: str
    recommended_price: float
    position_size_pct: float
    confidence: float

class ExecuteRequest(BaseModel):
    timestamp: str
    run_id: str
    signals: List[Signal]
    markets_reviewed: int
    user_id: str

# Security dependency
def verify_secret(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.credentials != EXECUTOR_SECRET:
        raise HTTPException(status_code=401, detail="Invalid executor secret")
    return credentials

# Helper functions
def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

async def check_clob_api():
    """Check if Polymarket CLOB API is reachable"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("https://clob.polymarket.com/", timeout=5.0)
            return response.status_code < 500
    except Exception as e:
        logger.error(f"CLOB API check failed: {e}")
        return False

async def place_order(
    clob_api_key: str,
    clob_secret: str,
    clob_passphrase: str,
    token_id: str,
    price: float,
    size_usdc: float,
    outcome: str
) -> Dict[str, Any]:
    """Place limit order via Polymarket CLOB API"""
    try:
        timestamp = str(int(datetime.utcnow().timestamp() * 1000))
        
        # Calculate shares from USDC size
        shares = round(size_usdc / price, 2)
        
        # Build order payload
        order_payload = {
            "orderType": "GTC",
            "tokenID": token_id,
            "price": str(price),
            "size": str(shares),
            "side": "BUY",
            "feeRateBps": "0",
            "nonce": timestamp,
            "expiration": "0"
        }
        
        # Sign with CLOB secret
        msg = json.dumps(order_payload, separators=(',', ':'))
        sig = hmac.new(clob_secret.encode(), msg.encode(), hashlib.sha256).digest()
        signature = base64.b64encode(sig).decode()
        
        headers = {
            "POLY_ADDRESS": clob_api_key,
            "POLY_SIGNATURE": signature,
            "POLY_TIMESTAMP": timestamp,
            "POLY_PASSPHRASE": clob_passphrase,
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://clob.polymarket.com/order",
                json=order_payload,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": response.text}
                
    except Exception as e:
        logger.error(f"Order placement failed: {e}")
        return {"success": False, "error": str(e)}

# Endpoints
@app.get("/health")
async def health():
    """Health check endpoint"""
    clob_reachable = await check_clob_api()
    return {
        "ok": True,
        "version": "1.0.0",
        "clob_api": "reachable" if clob_reachable else "unreachable"
    }

@app.post("/users/register")
async def register_user(user: UserRegister, _creds = Depends(verify_secret)):
    """Register a new user with CLOB API credentials"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        now = datetime.utcnow().isoformat()
        cursor.execute("""
            INSERT INTO users (
                user_id, wallet_address, clob_api_key, clob_secret, 
                clob_passphrase, portfolio_usdc, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user.user_id, user.wallet_address, user.clob_api_key,
            user.clob_secret, user.clob_passphrase, user.portfolio_usdc,
            now, now
        ))
        conn.commit()
        
        logger.info(f"User registered: {user.user_id}")
        return {
            "success": True,
            "user_id": user.user_id,
            "message": "User registered successfully"
        }
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists")
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.put("/users/{user_id}/settings")
async def update_settings(user_id: str, settings: UserSettings):
    """Update user settings"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Build update query dynamically
        updates = []
        params = []
        
        if settings.portfolio_usdc is not None:
            updates.append("portfolio_usdc = ?")
            params.append(settings.portfolio_usdc)
        if settings.max_positions is not None:
            updates.append("max_positions = ?")
            params.append(settings.max_positions)
        if settings.risk_level is not None:
            updates.append("risk_level = ?")
            params.append(settings.risk_level)
        if settings.max_trade_usd is not None:
            updates.append("max_trade_usd = ?")
            params.append(settings.max_trade_usd)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No settings provided")
        
        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(user_id)
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE user_id = ?"
        cursor.execute(query, params)
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Fetch updated user
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = dict(cursor.fetchone())
        
        # Omit sensitive credentials
        user.pop('clob_api_key', None)
        user.pop('clob_secret', None)
        user.pop('clob_passphrase', None)
        
        return user
    finally:
        conn.close()

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get user information (without sensitive credentials)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = dict(row)
        # Omit sensitive credentials
        user.pop('clob_api_key', None)
        user.pop('clob_secret', None)
        user.pop('clob_passphrase', None)
        
        return user
    finally:
        conn.close()

@app.post("/execute")
async def execute_signals(request: ExecuteRequest, _creds = Depends(verify_secret)):
    """Execute trading signals"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Load user
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (request.user_id,))
        user_row = cursor.fetchone()
        
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = dict(user_row)
        
        # Count open positions
        cursor.execute(
            "SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status = 'pending'",
            (request.user_id,)
        )
        open_positions = cursor.fetchone()['count']
        
        executed = []
        skipped = []
        total_deployed_usdc = 0.0
        
        for signal in request.signals:
            # Safety checks
            if signal.recommended_price < 0.01 or signal.recommended_price > 0.99:
                skipped.append({
                    "signal": signal.dict(),
                    "reason": "price_out_of_range"
                })
                continue
            
            if open_positions >= user['max_positions']:
                skipped.append({
                    "signal": signal.dict(),
                    "reason": "max_positions_reached"
                })
                continue
            
            # Calculate position size
            size_usdc = (signal.position_size_pct / 100) * user['portfolio_usdc']
            size_usdc = min(size_usdc, user['max_trade_usd'], MAX_ORDER_USD)
            
            # Place order
            result = await place_order(
                user['clob_api_key'],
                user['clob_secret'],
                user['clob_passphrase'],
                signal.token_id,
                signal.recommended_price,
                size_usdc,
                signal.outcome
            )
            
            # Generate order ID
            order_id = f"ord_{request.run_id}_{len(executed) + 1}"
            now = datetime.utcnow().isoformat()
            
            if result.get('success'):
                # Log to database
                polymarket_order_id = result.get('data', {}).get('orderID', '')
                cursor.execute("""
                    INSERT INTO orders (
                        order_id, user_id, market_question, condition_id, token_id,
                        side, outcome, price, size_usdc, status, polymarket_order_id,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    order_id, request.user_id, signal.market_question,
                    signal.condition_id, signal.token_id, 'BUY', signal.outcome,
                    signal.recommended_price, size_usdc, 'pending',
                    polymarket_order_id, now, now
                ))
                
                executed.append({
                    "signal": signal.dict(),
                    "order_id": order_id,
                    "status": "filled",
                    "size_usdc": size_usdc
                })
                
                total_deployed_usdc += size_usdc
                open_positions += 1
                
                logger.info(f"Order placed: {order_id} | {signal.market_question} | {signal.outcome} @ {signal.recommended_price} | ${size_usdc}")
            else:
                skipped.append({
                    "signal": signal.dict(),
                    "reason": f"order_failed: {result.get('error', 'unknown')}"
                })
                logger.error(f"Order failed: {signal.market_question} | {result.get('error')}")
        
        # Log execution run
        cursor.execute("""
            INSERT INTO signals_log (
                run_id, timestamp, markets_reviewed, signals_count,
                executed_count, skipped_count, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            request.run_id, request.timestamp, request.markets_reviewed,
            len(request.signals), len(executed), len(skipped),
            json.dumps(request.dict())
        ))
        
        conn.commit()
        
        return {
            "run_id": request.run_id,
            "executed": executed,
            "skipped": skipped,
            "total_deployed_usdc": round(total_deployed_usdc, 2)
        }
        
    finally:
        conn.close()

@app.get("/positions/{user_id}")
async def get_positions(user_id: str):
    """Get user positions from Polymarket and local DB"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get user
        cursor.execute("SELECT wallet_address FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        wallet_address = user['wallet_address']
        
        # Query Polymarket Data API
        polymarket_positions = []
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://data-api.polymarket.com/positions?user={wallet_address}",
                    timeout=10.0
                )
                if response.status_code == 200:
                    polymarket_positions = response.json()
        except Exception as e:
            logger.error(f"Failed to fetch Polymarket positions: {e}")
        
        # Get local pending orders
        cursor.execute(
            "SELECT * FROM orders WHERE user_id = ? AND status = 'pending'",
            (user_id,)
        )
        pending_orders = [dict(row) for row in cursor.fetchall()]
        
        return {
            "polymarket_positions": polymarket_positions,
            "pending_orders": pending_orders
        }
        
    finally:
        conn.close()

@app.get("/orders/{user_id}")
async def get_orders(user_id: str):
    """Get all orders for user"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        orders = [dict(row) for row in cursor.fetchall()]
        return {"orders": orders}
    finally:
        conn.close()

@app.delete("/orders/{user_id}/{order_id}")
async def cancel_order(user_id: str, order_id: str):
    """Cancel an order"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get order and user
        cursor.execute("SELECT * FROM orders WHERE order_id = ? AND user_id = ?", (order_id, user_id))
        order = cursor.fetchone()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order = dict(order)
        polymarket_order_id = order.get('polymarket_order_id')
        
        if not polymarket_order_id:
            raise HTTPException(status_code=400, detail="No Polymarket order ID")
        
        # Get user credentials
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = dict(cursor.fetchone())
        
        # Cancel via CLOB API
        timestamp = str(int(datetime.utcnow().timestamp() * 1000))
        
        # Build cancel payload
        cancel_payload = {"orderID": polymarket_order_id}
        msg = json.dumps(cancel_payload, separators=(',', ':'))
        sig = hmac.new(user['clob_secret'].encode(), msg.encode(), hashlib.sha256).digest()
        signature = base64.b64encode(sig).decode()
        
        headers = {
            "POLY_ADDRESS": user['clob_api_key'],
            "POLY_SIGNATURE": signature,
            "POLY_TIMESTAMP": timestamp,
            "POLY_PASSPHRASE": user['clob_passphrase'],
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                "https://clob.polymarket.com/order",
                json=cancel_payload,
                headers=headers,
                timeout=30.0
            )
        
        # Update local DB
        cursor.execute(
            "UPDATE orders SET status = 'cancelled', updated_at = ? WHERE order_id = ?",
            (datetime.utcnow().isoformat(), order_id)
        )
        conn.commit()
        
        logger.info(f"Order cancelled: {order_id}")
        return {"success": True, "order_id": order_id}
        
    except Exception as e:
        logger.error(f"Cancel failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/history/{user_id}")
async def get_history(user_id: str):
    """Get completed orders (filled/cancelled)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT * FROM orders WHERE user_id = ? AND status IN ('filled', 'cancelled') ORDER BY created_at DESC",
            (user_id,)
        )
        history = [dict(row) for row in cursor.fetchall()]
        return {"history": history}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=PORT)
