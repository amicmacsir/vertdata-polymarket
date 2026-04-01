# VertData Polymarket CLOB Executor

Production-ready trade executor service for Polymarket using CLOB API.

## 🔐 Security Architecture

**IMPORTANT**: This service does NOT store users' private keys. It uses Polymarket's CLOB API key system:

1. Users connect their wallet in the browser (WalletConnect)
2. Frontend derives CLOB API credentials (key, secret, passphrase) using `py-clob-client`
3. Only the CLOB API credentials are stored server-side (not the private key)
4. CLOB credentials are scoped — they can place/cancel orders but cannot withdraw funds

## 📦 Components

- **FastAPI service** on port 8003
- **SQLite database** for user settings and order tracking
- **Polymarket CLOB API integration** for order execution

## 🚀 Installation

```bash
cd /root/.openclaw/workspace/projects/vertdata-polymarket/executor
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
```

## ⚙️ Configuration

Create `.env` from `.env.example`:

```bash
EXECUTOR_API_SECRET=your-secret-here
MAX_ORDER_USD=500
DB_PATH=./executor.db
PORT=8003
```

## 🏃 Running

### Development
```bash
./venv/bin/uvicorn clob_executor:app --host 127.0.0.1 --port 8003
```

### Production (PM2)
```bash
pm2 start ./venv/bin/uvicorn --name vertdata-executor -- clob_executor:app --host 127.0.0.1 --port 8003
pm2 save
```

## 📡 API Endpoints

### Health Check
```bash
GET /health

Response:
{
  "ok": true,
  "version": "1.0.0",
  "clob_api": "reachable"
}
```

### Register User
```bash
POST /users/register
Authorization: Bearer <EXECUTOR_API_SECRET>

Body:
{
  "user_id": "user123",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f7a3a8F",
  "clob_api_key": "clob-key-here",
  "clob_secret": "clob-secret-here",
  "clob_passphrase": "passphrase",
  "portfolio_usdc": 1000.0
}

Response:
{
  "success": true,
  "user_id": "user123",
  "message": "User registered successfully"
}
```

### Update Settings
```bash
PUT /users/{user_id}/settings

Body:
{
  "portfolio_usdc": 2000.0,
  "max_positions": 5,
  "risk_level": "aggressive",
  "max_trade_usd": 1000.0
}
```

### Get User Info
```bash
GET /users/{user_id}

Response:
{
  "user_id": "user123",
  "wallet_address": "0x...",
  "portfolio_usdc": 1000.0,
  "max_positions": 3,
  "risk_level": "balanced",
  "max_trade_usd": 500.0
}
```

### Execute Signals
```bash
POST /execute
Authorization: Bearer <EXECUTOR_API_SECRET>

Body: Full signal JSON from signal_generator service

Response:
{
  "run_id": "run_123",
  "executed": [
    {
      "signal": {...},
      "order_id": "ord_run_123_1",
      "status": "filled",
      "size_usdc": 50.0
    }
  ],
  "skipped": [
    {
      "signal": {...},
      "reason": "max_positions_reached"
    }
  ],
  "total_deployed_usdc": 150.0
}
```

### Get Positions
```bash
GET /positions/{user_id}

Response:
{
  "polymarket_positions": [...],
  "pending_orders": [...]
}
```

### Get Orders
```bash
GET /orders/{user_id}

Response:
{
  "orders": [
    {
      "order_id": "ord_123",
      "market_question": "Will BTC reach $100k?",
      "outcome": "YES",
      "price": 0.65,
      "size_usdc": 50.0,
      "status": "pending"
    }
  ]
}
```

### Cancel Order
```bash
DELETE /orders/{user_id}/{order_id}

Response:
{
  "success": true,
  "order_id": "ord_123"
}
```

### Get History
```bash
GET /history/{user_id}

Response:
{
  "history": [...]
}
```

## 🔒 Security Features

1. **API Secret Authentication**: All write endpoints require Bearer token
2. **CLOB-only Credentials**: No private keys stored
3. **Local-only Binding**: Service binds to 127.0.0.1 (Nginx handles public traffic)
4. **Safety Checks**: Price range validation, position limits, trade size caps

## 🛡️ Safety Checks

The executor enforces multiple safety checks:

- **Price range**: 0.01-0.99 only
- **Position limits**: User-configurable max open positions
- **Trade size caps**: Min of (position_size_pct * portfolio, max_trade_usd, 500)
- **Order validation**: All fields validated before placement

## 📊 Database Schema

### Users
- user_id (PK)
- wallet_address
- clob_api_key
- clob_secret
- clob_passphrase
- portfolio_usdc (default: 1000)
- max_positions (default: 3)
- risk_level (default: 'balanced')
- max_trade_usd (default: 500)
- created_at, updated_at

### Orders
- order_id (PK)
- user_id
- market_question
- condition_id
- token_id
- side
- outcome
- price
- size_usdc
- status
- polymarket_order_id
- created_at, updated_at

### Signals Log
- id (PK)
- run_id
- timestamp
- markets_reviewed
- signals_count
- executed_count
- skipped_count
- raw_json

## 📝 Logs

All trades are logged to `trades.log` with timestamps:
```
2026-04-01 12:34:56 | INFO | Order placed: ord_123 | Will BTC reach $100k? | YES @ 0.65 | $50.0
```

## 🔗 Integration

This service integrates with:
- **signal_generator** (port 8002): Receives trading signals
- **frontend** (port 3030): Receives user registrations and CLOB credentials
- **Polymarket CLOB API**: Places and cancels orders

## 🧪 Testing

```bash
# Health check
curl http://127.0.0.1:8003/health

# Register test user
curl -X POST http://127.0.0.1:8003/users/register \
  -H "Authorization: Bearer vertdata-dev-secret-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"test123",
    "wallet_address":"0x742d35Cc6634C0532925a3b844Bc9e7595f7a3a8F",
    "clob_api_key":"test-key",
    "clob_secret":"test-secret",
    "clob_passphrase":"test-pass",
    "portfolio_usdc":1000
  }'
```

## 📦 Dependencies

- fastapi==0.109.0
- uvicorn==0.27.0
- httpx==0.26.0
- python-dotenv==1.0.0
- pydantic==2.5.3
- cryptography==42.0.0

## 🌐 Nginx Proxy

```nginx
location /executor/ {
    proxy_pass http://127.0.0.1:8003/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 📈 Production Status

- ✅ Service running on port 8003
- ✅ PM2 process manager
- ✅ Nginx reverse proxy
- ✅ GitHub repository: amicmacsir/vertdata-polymarket
- ✅ Health check passing
- ✅ User registration tested

## 🔮 Next Steps

1. Frontend integration for CLOB credential derivation
2. Webhook endpoint for order fill notifications
3. Real-time position monitoring
4. Trade history analytics
5. Risk management dashboard

## 📞 Support

For issues or questions, contact the VertData team or open an issue on GitHub.
