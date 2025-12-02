# FLR Depot CRM

Backend: `Node.js` + `Express` + `SQLite` with TypeScript, providing REST APIs for customers, retailers, products, transactions, orders, complaints, and users with role-based access.

To run the backend:

```bash
npm install
npm run dev
```

Then open `http://localhost:4000/health` to verify the server is running.




**Customer Relationship Management (CRM) System for Flr Depot – Ready-to-Build Description**

The CRM system is a **web-based application** designed to manage customers, retailers, sales, stock, orders, and complaints. It should integrate with the existing Ishyiga system to ensure real-time stock updates. The system must support role-based access: **Admin** (full access), **Staff/Stock Manager** (transactions, stock, complaints), and **Retailer** (view own sales/orders, place orders, report feedback).

**Core Features:**

* Customer and retailer management (profiles, contact info, transaction history)
* Sales/transaction tracking with timestamps and unique IDs to prevent duplicates
* Orders and delivery management with status tracking
* Complaint and feedback logging with assignment and resolution tracking
* Reporting and dashboards for daily/weekly sales, stock levels, and inventory discrepancies
* Automated notifications for low stock, pending orders, unresolved complaints, and daily summaries

**Database Structure:** Customers, Retailers, Products, Transactions, Orders, Complaints, Users — all linked relationally with proper timestamps and audit logs.

**Technical Requirements:** Web-based frontend (HTML/CSS/JS; React/Vue optional), backend (Node.js, Django, or PHP), relational database (MySQL/PostgreSQL/SQLite), secure login with role-based access, and optional Ishyiga system API integration for stock synchronization.

**Workflow:** Transactions/orders recorded → updates main stock → notifications sent → reports generated automatically → complaints resolved by staff/admin.

The system should be secure, reliable, and support real-time operations for Flr Depot’s business processes.
