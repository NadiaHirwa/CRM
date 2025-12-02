# FLR Depot CRM

Backend: `Node.js` + `Express` + `SQLite` (TypeScript) providing REST APIs for customers, retailers, products, orders, complaints, reports, and users with role-based access (Admin, Staff, Retailer).
Frontend: `React` (TypeScript) admin/retailer portal.

---

## 1. Running the project

### Backend (API)

From the project root (`CRM`):

```bash
npm install
npm run dev
```

Verify it is running:

- Open `http://localhost:4000/health` → should return `{"status":"ok","app":"FLR Depot CRM"}`.

### Frontend (React portal)

In another terminal:

```bash
cd frontend
npm install
npm start
```

Then open `http://localhost:3000` in the browser.

---

### 1.1. Helpful docs

- `PROJECT_STRUCTURE.md` – overview of folders and key files.
- `TASKS.md` – list of completed work and future TODOs.

---

## 2. API overview (main endpoints)

All protected endpoints (everything under `/api/*` except `/api/auth/*`) require a header:

- `Authorization: Bearer <JWT_TOKEN>`

### Auth

- `POST /api/auth/register` – create user (Admin/Staff/Retailer).
- `POST /api/auth/login` – log in and receive `token`, `role`, `retailer_id` (if retailer).

### Core entities

- `GET/POST/PUT/DELETE /api/customers` – manage customers (Admin/Staff).
- `GET/POST/PUT/DELETE /api/retailers` – manage retailers (Admin/Staff).
- `GET/POST/PUT/DELETE /api/products` – manage products and stock (Admin/Staff).
- `GET/POST /api/orders` – create and list orders (Admin/Staff see all, Retailer sees own).
- `PATCH /api/orders/:id/status` – update order status (Admin/Staff).
- `GET/POST /api/complaints` – list/create complaints (Admin/Staff see all, Retailer sees own).
- `PATCH /api/complaints/:id` – update complaint status/assignment (Admin/Staff).

### Reports

- `GET /api/reports/sales` – sales grouped by day.
- `GET /api/reports/stock` – stock levels per product.
- `GET /api/reports/pending-orders` – non-delivered orders.
- `GET /api/reports/complaints` – unresolved complaints.

---

## 3. Frontend behaviour

- **Admin / Staff**
  - Log in with Admin/Staff credentials.
  - See dashboard with:
    - Sales by day.
    - Stock levels.
    - Pending orders (with inline status change).
    - Unresolved complaints (with inline status and assignee update).
- **Retailer**
  - Log in with a Retailer account linked to a `retailer_id`.
  - See portal with:
    - Place new order (choose product + quantity).
    - View own orders.
    - Submit new complaints.
    - View own complaints.

---

## 4. Functional specification (high level)

1. Purpose

The CRM system is designed to help Flr Depot:

Manage customer information and interactions

Track sales, stock, and orders

Improve communication between the main stock team and retailers

Automate reporting and provide actionable insights

The system should be web-based (accessible from multiple devices) and integrated with Ishyiga software where possible.

2. Core Modules & Features
A. Customer Management

Add, edit, and delete customer profiles (name, contact info, address, business type)

Store customer history (transactions, complaints, visits)

Search and filter customers easily

B. Retailer & Stock Management

Track which retailers use the CRM and Ishyiga

Record sales and stock updates per retailer

Auto-update main stock inventory when sales are recorded

Track discrepancies or missing entries

C. Sales & Transaction Tracking

Record each sale with:

Date & time (timestamp)

Product sold

Quantity

Retailer

Total price

Prevent duplicate entries using unique transaction IDs

Generate daily, weekly, and monthly sales reports

D. Orders & Delivery

Allow retailers to place stock orders

Track order status (Pending, In Progress, Delivered)

Notify main stock team for adjustments

Record delivery confirmations

E. Complaint & Feedback Management

Log customer complaints or feedback

Assign responsible staff to resolve issues

Track status and resolution time

Generate reports on recurring issues

F. Reporting & Dashboards

Display:

Daily sold stock per retailer

Stock levels and adjustments

Top-selling products

Monthly inventory discrepancies

Allow export of reports in Excel or PDF

Optional dashboard for real-time visualization

G. Notifications

Send automatic alerts for:

Low stock

Pending orders

Complaints unresolved for more than X hours/days

Daily/weekly summary to main stock team

3. Data & Database Structure

The system should store structured data for:

Customers: ID, name, contact, address, type, notes

Retailers: ID, name, contact, linked customers

Products: ID, name, category, unit price, stock quantity

Transactions: ID, date/time, retailer ID, customer ID, product IDs & quantities, total amount

Orders: ID, retailer ID, product IDs & quantities, order date, delivery status

Complaints: ID, customer/retailer ID, description, date, assigned staff, status

Users: ID, name, role (admin, staff, retailer), login credentials

Notes:

Use proper relational database design

Ensure timestamps for transactions to avoid duplicates

Optional: Include audit logs for changes

4. User Roles

Admin: Full access, manage users, view all reports

Staff/Stock Manager: Add/edit transactions, update stock, handle complaints

Retailer: View own sales/orders, place orders, report feedback

5. Technical Requirements

Web-based application (accessible via browser)

Backend: Node.js, Python/Django, or PHP (any standard)

Database: MySQL, PostgreSQL, or SQLite

Frontend: HTML/CSS/JS (React or Vue optional)

Optional integration with Ishyiga system API for stock synchronization

6. Workflow

Customer or retailer interacts → enters transaction/order → system records in database

System updates stock in main inventory (real-time)

Notifications sent to relevant staff for pending tasks or low stock

Daily/weekly reports generated automatically for review

Admin/staff can resolve complaints and track status

7. Security & Access

Login system with roles

Passwords hashed and stored securely

Only authorized users can modify stock or transaction data

Optional: Activity logs for auditing

✅ Summary:
This CRM system is all-in-one for Flr Depot:

- Tracks customers, sales, stock, orders, and complaints.
- Automates reporting and notifications.
- Integrates with existing Ishyiga system (API-ready).
- Provides role-based access for staff, admin, and retailers.
