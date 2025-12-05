# Changelog - Recent Updates

## Completed Features

### 1. Enhanced Authentication UX
- ✅ **JWT localStorage persistence**: Tokens are now saved to localStorage and automatically restored on page refresh
- ✅ **Token expiry handling**: 
  - Automatic warnings when session is about to expire (30 min, 5 min warnings)
  - Auto-logout on token expiration
  - Session restoration on page load

**Files Changed:**
- `frontend/src/utils/auth.ts` - New utility for auth management
- `frontend/src/App.tsx` - Integrated localStorage persistence and expiry checking

### 2. Notifications & Automation System
- ✅ **Low Stock Alerts**: API endpoint checks for products below threshold
- ✅ **Long-Pending Complaints**: Tracks complaints open for more than configured hours
- ✅ **Notification Infrastructure**: Service with hooks for future email/SMS integration
- ✅ **Frontend Notifications Banner**: Displays alerts in admin dashboard

**New Files:**
- `server/routes/notificationsRoutes.ts` - Notification API endpoints
- `server/services/notificationService.ts` - Notification service with hooks

**Features:**
- Configurable thresholds via query params or environment variables
- Severity levels (low, medium, high, critical)
- Automatic periodic checking in frontend (every 5 minutes)
- Dismissible notification banner

### 3. Database Seed Script
- ✅ **Demo Data Generator**: Creates realistic demo data for presentations
- ✅ **Multiple Users**: Admin, Staff, and Retailer accounts
- ✅ **Sample Data**: Products, customers, retailers, orders, transactions, complaints
- ✅ **Low Stock & Long-Pending Items**: Includes demo items that trigger notifications

**New Files:**
- `scripts/seed.ts` - Seed script

**Usage:**
```bash
npm run seed
```

**Demo Credentials:**
- Admin: `admin@example.com` / `password123`
- Staff: `staff@example.com` / `password123`
- Retailers: `retailer1@example.com` through `retailer4@example.com` / `password123`

### 4. Docker Deployment
- ✅ **Backend Dockerfile**: Production-ready Node.js container
- ✅ **Frontend Dockerfile**: Multi-stage build with Nginx
- ✅ **Docker Compose**: Orchestrates backend + frontend with networking
- ✅ **Health Checks**: Built-in health monitoring
- ✅ **Volume Persistence**: Database file persists across container restarts

**New Files:**
- `Dockerfile` - Backend container
- `frontend/Dockerfile` - Frontend container
- `docker-compose.yml` - Service orchestration
- `.dockerignore` files

**Usage:**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Configuration

### Environment Variables

**Backend:**
- `JWT_SECRET` - Secret for JWT signing (default: dev-secret)
- `PORT` - Server port (default: 4000)
- `LOW_STOCK_THRESHOLD` - Low stock threshold (default: 10)
- `COMPLAINT_WARNING_HOURS` - Hours before complaint warning (default: 24)

**Frontend:**
- `REACT_APP_API_BASE` - API base URL (default: http://localhost:4000)

## API Endpoints

### New Endpoints

- `GET /api/notifications` - Get all notifications (low stock + long-pending complaints)
- `GET /api/notifications/low-stock?threshold=10` - Get low stock products only
- `GET /api/notifications/long-pending-complaints?hours=24` - Get long-pending complaints only

## Next Steps (Future Ideas)

- **Ishyiga Integration**: Sync stock updates via Ishyiga API
- **Email/SMS Notifications**: Implement notification hooks for real alerts
- **Advanced Reporting**: Enhanced analytics and export features
- **Real-time Updates**: WebSocket integration for live notifications

