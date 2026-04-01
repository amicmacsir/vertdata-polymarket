# VertData Polymarket Trading Pipeline — n8n Workflow

Complete orchestration workflow for automated Polymarket trading based on VertData AI signals.

## Overview

This n8n workflow:
- Runs every 30 minutes (configurable)
- Fetches trading signals from the Signal Service
- Executes trades via the Executor Service
- Sends email notifications for executed trades
- Handles errors with email alerts
- Logs all runs for monitoring

## Prerequisites

### 1. n8n Instance
- Self-hosted n8n instance (v1.0.0+)
- Running and accessible
- Admin access to import workflows

### 2. VertData Services Running
- **Signal Service**: Port 8002 (managed by PM2: `vertdata-signals`)
- **Executor Service**: Port 8003 (managed by PM2: `vertdata-executor`)
- Both services proxied through Nginx at `http://31.220.31.142:3030`

### 3. Email Credentials
- SMTP server access for sending notifications
- Recommended: Gmail, SendGrid, Resend, or Mailgun
- You'll need: host, port, username, password, sender email

---

## Installation

### Step 1: Import the Workflow

1. Open your n8n instance
2. Click **"Workflows"** in the left sidebar
3. Click **"Add Workflow"** → **"Import from File"** or **"Import from URL"**
4. Paste the contents of `vertdata-polymarket-workflow.json`
5. Click **"Import"**

The workflow will appear as: **"VertData — Polymarket Trading Pipeline"**

---

### Step 2: Configure Environment Variables

n8n uses environment variables for sensitive configuration.

#### Option A: Set via n8n UI (Recommended)
1. Go to **Settings** → **Environments**
2. Add these variables:

```
SIGNAL_SERVICE_URL=http://127.0.0.1:8002
EXECUTOR_URL=http://127.0.0.1:8003
EXECUTOR_API_SECRET=your-secret-here
DEFAULT_USER_ID=your-default-user-id
ADMIN_EMAIL=your-email@example.com
```

#### Option B: Set via Docker Compose / System Environment
If running n8n via Docker, add to your `docker-compose.yml`:

```yaml
environment:
  - SIGNAL_SERVICE_URL=http://host.docker.internal:8002
  - EXECUTOR_URL=http://host.docker.internal:8003
  - EXECUTOR_API_SECRET=your-secret-here
  - DEFAULT_USER_ID=your-default-user-id
  - ADMIN_EMAIL=your-email@example.com
```

**Note:** If n8n is in Docker and services are on host, use `host.docker.internal` instead of `127.0.0.1`.

#### Get Your Values:
- **EXECUTOR_API_SECRET**: Check `/root/.openclaw/workspace/projects/vertdata-polymarket/executor/.env` (look for `API_SECRET`)
- **DEFAULT_USER_ID**: After registering your first user, get from database or registration response
- **ADMIN_EMAIL**: Your email for trade notifications and error alerts

---

### Step 3: Configure SMTP Credentials

The workflow sends emails for trade notifications and error alerts.

1. In n8n, go to **Settings** → **Credentials**
2. Click **"Add Credential"** → **"SMTP"**
3. Fill in your SMTP details:
   - **Name**: `SMTP account` (must match credential name in workflow)
   - **Host**: e.g., `smtp.gmail.com` or `smtp.resend.com`
   - **Port**: e.g., `587` (TLS) or `465` (SSL)
   - **User**: Your SMTP username/email
   - **Password**: Your SMTP password or app password
   - **From Email**: e.g., `noreply@vertdata.com`
4. Click **"Test"** to verify connection
5. Click **"Save"**

#### Sender Email Configuration
The workflow uses two sender addresses:
- **Trade notifications**: `noreply@vertdata.com`
- **Error alerts**: `alerts@vertdata.com`

Make sure these are authorized in your SMTP provider or update them in the workflow:
- Node 8: "Email: Trades Executed" → `fromEmail` parameter
- Node 11: "Email: Error Alert" → `fromEmail` parameter

---

### Step 4: Register Your First User

Before activating the workflow, register at least one user with their Polymarket CLOB API credentials:

```bash
curl -X POST http://127.0.0.1:8003/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "clob_api_key": "your-polymarket-clob-key",
    "clob_api_secret": "your-polymarket-clob-secret",
    "clob_api_passphrase": "your-polymarket-passphrase"
  }'
```

Response will include `user_id` — use this for `DEFAULT_USER_ID` environment variable.

---

### Step 5: Test the Workflow (Manual Trigger)

Before activating the schedule, test manually:

1. Open the workflow in n8n
2. Click **"Execute Workflow"** (top right)
3. Watch the execution flow in real-time
4. Check for:
   - ✅ Signals fetched successfully
   - ✅ Trades executed (if signals found)
   - ✅ Email sent (if trades executed)
   - ✅ Logs written

**Expected outcomes:**
- **If signals found**: You'll receive a trade notification email
- **If no signals**: Workflow completes silently (logged in Executor)
- **If error**: You'll receive an error alert email

---

### Step 6: Activate the Workflow

Once testing passes:

1. Toggle the **"Active"** switch in the workflow header (top right)
2. The workflow will now run automatically every 30 minutes

---

## Monitoring

### View Execution History
1. Go to **"Executions"** in n8n left sidebar
2. Filter by workflow: "VertData — Polymarket Trading Pipeline"
3. Click any execution to see detailed logs

### What to Monitor:
- **Success rate**: Should be >95%
- **Signal frequency**: How often signals are found
- **Trade execution**: Success vs. skipped trades
- **Email delivery**: Ensure notifications arrive

### Logs in Executor Service
Check PM2 logs for backend details:
```bash
pm2 logs vertdata-executor
pm2 logs vertdata-signals
```

---

## Configuration

### Adjust Schedule Frequency

To change from 30 minutes to another interval:

1. Open the workflow
2. Click the **"Every 30 Minutes"** node (Node 1)
3. In the right panel, adjust:
   - **Interval**: e.g., `15` for 15 minutes, `60` for hourly
4. Save the workflow

### Adjust Trade Parameters

Trade size and risk parameters are configured in the Executor Service, not in n8n. To modify:

1. Edit `/root/.openclaw/workspace/projects/vertdata-polymarket/executor/.env`
2. Adjust parameters (e.g., `MAX_POSITION_SIZE`, `MIN_EXPECTED_VALUE`)
3. Restart the service: `pm2 restart vertdata-executor`

---

## Troubleshooting

### Common Issues

#### 1. **Error: "Cannot connect to SIGNAL_SERVICE_URL"**
- Check if Signal Service is running: `pm2 list | grep vertdata-signals`
- Verify port 8002 is open: `curl http://127.0.0.1:8002/health`
- If n8n is in Docker, use `host.docker.internal:8002` instead of `127.0.0.1:8002`

#### 2. **Error: "Cannot connect to EXECUTOR_URL"**
- Check if Executor Service is running: `pm2 list | grep vertdata-executor`
- Verify port 8003 is open: `curl http://127.0.0.1:8003/health`
- If n8n is in Docker, use `host.docker.internal:8003` instead of `127.0.0.1:8003`

#### 3. **Error: "401 Unauthorized" on Execute Trades**
- Check `EXECUTOR_API_SECRET` matches the value in `/root/.openclaw/workspace/projects/vertdata-polymarket/executor/.env`
- Ensure environment variable is set correctly in n8n

#### 4. **Email Not Sending**
- Verify SMTP credentials in n8n **Settings → Credentials**
- Test SMTP connection manually
- Check sender email is authorized by SMTP provider
- Review n8n execution logs for detailed error message

#### 5. **No Signals Found (Always False Branch)**
- This is normal — not every 30-minute check will find tradeable opportunities
- Check Signal Service logs: `pm2 logs vertdata-signals`
- Verify Polymarket API is accessible
- Ensure market data is being fetched correctly

---

## Workflow Node Details

| Node | Type | Purpose |
|------|------|---------|
| Every 30 Minutes | Schedule Trigger | Initiates workflow every 30 minutes |
| Fetch Trade Signals | HTTP Request | GET /analyze from Signal Service |
| Has Signals? | IF | Routes based on signals_count > 0 |
| Execute Trades | HTTP Request | POST /execute to Executor Service |
| Format Summary | Code | Transforms execution results for email |
| Trades Executed? | IF | Routes based on executed_count > 0 |
| Log: No Trades | HTTP Request | Records run with no trades |
| Email: Trades Executed | Email Send | Sends trade notification |
| Log: Run Complete | HTTP Request | Records successful run |
| Error Handler | Error Trigger | Catches all node errors |
| Email: Error Alert | Email Send | Sends error notification |

---

## Security Notes

- **API Secrets**: Stored as environment variables (never hardcoded)
- **Email Credentials**: Encrypted by n8n credential manager
- **Services Binding**: Both services bind to `127.0.0.1` only (not public)
- **Nginx Proxy**: Public access controlled via Nginx reverse proxy

---

## Next Steps

1. **Production Domain**: Point `trade.vertdata.com` to `31.220.31.142`
2. **SSL Setup**: `certbot --nginx -d trade.vertdata.com`
3. **Monitor First Week**: Review execution history daily
4. **Tune Parameters**: Adjust trade size / risk tolerance based on performance
5. **Add Users**: Register additional users as needed

---

## Support

For issues:
1. Check n8n execution logs (detailed error messages)
2. Check PM2 logs: `pm2 logs vertdata-signals` / `pm2 logs vertdata-executor`
3. Review Nginx access logs: `tail -f /var/log/nginx/access.log`
4. Verify database connectivity (Supabase)

---

**Workflow Version**: 1.0.0  
**Last Updated**: 2026-04-01  
**Maintained By**: VertData Platform Team
