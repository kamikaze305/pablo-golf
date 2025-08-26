# Environment Setup Instructions

## Step 1: Create the .env file

1. Navigate to `C:\Users\katiy\Documents\Pablo\apps\server\`
2. Create a new file named `.env` (exactly this name, with the dot)
3. Copy and paste this content:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# QA Configuration (Host-only)
QA_ENABLED=true
QA_USER=admin
QA_PASS=secret123

# Game Limits
MAX_ROOMS=50
MAX_PLAYERS_PER_ROOM=5
MAX_CONNECTIONS=100

# Security
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Room Settings
ROOM_CLEANUP_HOURS=24
```

## Step 2: Restart the server

After creating the .env file, restart the development server:
```bash
npm run dev
```

## Step 3: Verify

You should see in the server logs:
- `📊 QA Mode: ENABLED` instead of `DISABLED`
- The server should work properly with room creation

