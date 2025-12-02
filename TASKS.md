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

### Next / Ideas (not yet implemented)


- **Better auth UX**
  - Persist JWT in `localStorage` and auto-restore session
  - Handle token expiry gracefully (auto logout / refresh prompt)

- **Notifications & automation**
  - Background checks for low stock and long-pending complaints
  - Email/SMS or in-app notification hooks (for future integration)

- **Ishyiga integration**
  - Sync stock updates via Ishyiga API (push/pull stock changes)

- **Deployment & demo**
  - Dockerize backend + frontend
  - Seed script to create demo data for presentations


