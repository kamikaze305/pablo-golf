# Pablo Game Setup Guide

## Environment Configuration

### Server Environment (.env)

Create a file named `.env` in the `apps/server` directory with the following content:

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
MAX_PLAYERS_PER_ROOM=6
MAX_CONNECTIONS=100

# Security
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Room Settings
ROOM_CLEANUP_HOURS=24
```

## Quick Start

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Client: http://localhost:5173
   - Server: http://localhost:4000
   - QA Interface: http://localhost:4000/qa (admin/secret123)

## Build for Production

```bash
npm run build
npm run serve
```

## Testing

```bash
npm test
```

