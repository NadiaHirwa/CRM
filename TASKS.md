## Project tasks overview

### Completed

- **Project setup**
  - Node.js + Express + TypeScript backend
  - SQLite database and schema for users, customers, retailers, products, orders, transactions, complaints
  - Basic security middleware (helmet, CORS, JWT)

- **Authentication & roles**
  - User registration and login (`/api/auth/register`, `/api/auth/login`)
  - Roles: **ADMIN**, **STAFF**, **RETAILER**
  - Retailer users linked to `retailer_id`

- **Core CRM APIs**
  - Customers: `/api/customers`
  - Retailers: `/api/retailers`
  - Products: `/api/products`
  - Orders: `/api/orders`, `/api/orders/:id/status`
  - Complaints: `/api/complaints`, `/api/complaints/:id`
  - Reports: `/api/reports/sales`, `/stock`, `/pending-orders`, `/complaints`

- **Frontend (React)**
  - Admin/Staff dashboard with:
    - Sales, stock, pending orders, unresolved complaints
    - Inline update of order status and complaint status/assignee
  - Retailer portal with:
    - Place new order
    - View own orders
    - Submit complaints
    - View own complaints

- **Docs & housekeeping**
  - Updated `README.md` with run instructions and API overview
  - `PROJECT_STRUCTURE.md` for folder and file layout
  - `.gitignore` to exclude `node_modules`, builds, `crm.db`, env and log files

- **Data management UIs**
  - Admin screens to manage customers, retailers, and products from the frontend

- **Better auth UX**
  - Persist JWT in `localStorage` and auto-restore session on page load
  - Handle token expiry gracefully with warnings and auto-logout on expiration
  - Session restoration on page refresh

- **Notifications & automation**
  - API endpoint `/api/notifications` for low stock and long-pending complaints
  - Background notification service with hooks infrastructure for email/SMS integration
  - Frontend notifications banner in admin dashboard
  - Configurable thresholds via query params or environment variables

- **Deployment & demo**
  - Dockerfile for backend (Node.js + Express)
  - Dockerfile for frontend (React + Nginx)
  - `docker-compose.yml` to orchestrate backend + frontend services
  - Seed script (`npm run seed`) to populate database with demo data for presentations

### Next / Ideas (not yet implemented)

- **Ishyiga integration**
  - Sync stock updates via Ishyiga API (push/pull stock changes)


