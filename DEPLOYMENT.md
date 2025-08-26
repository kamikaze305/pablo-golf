# Deploy Pablo Golf to the Internet

## Quick Start Options

### Option 1: Railway (Recommended - Easiest)

1. **Sign up for Railway** at https://railway.app/
2. **Connect your GitHub repository**
3. **Deploy the server**:
   - Create new project
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set root directory to `apps/server`
   - Railway will automatically detect it's a Node.js app
   - Add environment variables:
     ```
     NODE_ENV=production
     PORT=10000
     ORIGIN=https://your-client-domain.railway.app
     MAX_ROOMS=50
     MAX_PLAYERS_PER_ROOM=5
     MAX_CONNECTIONS=300
     ```

4. **Deploy the client**:
   - Create another project
   - Set root directory to `apps/client`
   - Add build command: `npm run build`
   - Add start command: `npm run preview`
   - Add environment variables:
     ```
     VITE_SOCKET_URL=https://your-server-domain.railway.app
     ```

### Option 2: Render (Also Easy)

1. **Sign up for Render** at https://render.com/
2. **Deploy server**:
   - Create new Web Service
   - Connect your GitHub repo
   - Set build command: `cd apps/server && npm install && npm run build`
   - Set start command: `cd apps/server && npm run serve`
   - Add environment variables as shown above

3. **Deploy client**:
   - Create new Static Site
   - Set build command: `cd apps/client && npm install && npm run build`
   - Set publish directory: `apps/client/dist`

### Option 3: Vercel + Railway

1. **Deploy server to Railway** (as above)
2. **Deploy client to Vercel**:
   - Sign up at https://vercel.com/
   - Import your GitHub repo
   - Set root directory to `apps/client`
   - Vercel will auto-detect Vite and deploy

## Environment Configuration

### Server Environment Variables
```bash
NODE_ENV=production
PORT=10000
ORIGIN=https://your-client-domain.com
MAX_ROOMS=50
MAX_PLAYERS_PER_ROOM=5
MAX_CONNECTIONS=300
QA_ENABLED=false
RATE_LIMIT_MAX_REQUESTS=100
```

### Client Environment Variables
```bash
VITE_SOCKET_URL=https://your-server-domain.com
VITE_APP_NAME=Pablo Golf
VITE_APP_VERSION=1.0.0
```

## Testing Your Deployment

1. **Test server health**: Visit `https://your-server-domain.com/health`
2. **Test client**: Visit your client URL
3. **Test game creation**: Create a room and share the link
4. **Test multiplayer**: Have friends join using the room link

## Troubleshooting

### Common Issues:
- **CORS errors**: Make sure ORIGIN environment variable matches your client domain
- **Socket connection fails**: Check that the server URL is correct and accessible
- **Build failures**: Ensure all dependencies are in package.json

### Debug Steps:
1. Check server logs for errors
2. Verify environment variables are set correctly
3. Test server health endpoint
4. Check browser console for client errors

## Security Considerations

- ✅ CORS is properly configured
- ✅ Rate limiting is enabled
- ✅ Helmet.js provides security headers
- ✅ Input validation on server side
- ⚠️ Consider adding authentication for production use
- ⚠️ Consider adding SSL/TLS for all connections
