# Quick Internet Access with ngrok

## Setup Instructions

1. **Install ngrok** (if not already installed):
   ```bash
   npm install -g ngrok
   # or download from https://ngrok.com/
   ```

2. **Start your server**:
   ```bash
   cd apps/server
   npm run dev
   ```

3. **Expose server with ngrok**:
   ```bash
   ngrok http 4000
   ```

4. **Update client configuration**:
   Replace the SOCKET_URL in `apps/client/src/stores/gameStore.ts` with the ngrok URL:
   ```typescript
   const SOCKET_URL = 'https://your-ngrok-url.ngrok.io';
   ```

5. **Build and serve client**:
   ```bash
   cd apps/client
   npm run build
   npm run preview
   ```

## Important Notes:
- ngrok URLs change each time you restart ngrok (unless you have a paid account)
- This is for testing only - not recommended for production
- Free ngrok has connection limits
