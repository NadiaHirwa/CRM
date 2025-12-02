## Project structure

```text
CRM/
├─ server/                  # Backend (Node.js + Express + TypeScript + SQLite)
│  ├─ index.ts              # Express app entry
│  ├─ db.ts                 # SQLite connection + schema
│  ├─ auth.ts               # JWT auth middleware & role helpers
│  └─ routes/               # REST API routes
│     ├─ authRoutes.ts      # /api/auth (login, register)
│     ├─ customersRoutes.ts # /api/customers
│     ├─ retailersRoutes.ts # /api/retailers
│     ├─ productsRoutes.ts  # /api/products
│     ├─ ordersRoutes.ts    # /api/orders
│     ├─ complaintsRoutes.ts# /api/complaints
│     └─ reportsRoutes.ts   # /api/reports/*
│
├─ frontend/                # React (TypeScript) portal
│  ├─ src/
│  │  ├─ App.tsx            # Single-page app: auth + dashboards
│  │  ├─ App.css            # Styling for admin & retailer views
│  │  ├─ index.tsx          # React entry
│  │  └─ ...                # CRA boilerplate
│  └─ public/               # Static assets
│
├─ crm.db                   # SQLite database (ignored in git)
├─ package.json             # Backend scripts + deps
├─ tsconfig.json            # Backend TypeScript config
├─ README.md                # Overview, how to run, APIs, spec
├─ PROJECT_STRUCTURE.md     # This file
└─ TASKS.md                 # Project task status (finished vs TODO)
```


