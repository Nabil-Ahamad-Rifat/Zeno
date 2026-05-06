# Phase 1: Foundation & CRUD

**Status:** ✅ COMPLETE  
**Date:** 2026-05-06  
**Duration:** ~4 hours  

---

## 📋 Overview

Build the first working version of ASTRA: JWT-authenticated shop management backend (Express + Prisma + MySQL) and React frontend with customer and product CRUD operations.

### Deliverables
- ✅ Working backend on port 4000
- ✅ Working frontend on port 5173
- ✅ Can add/edit/delete customers
- ✅ Can add/edit/delete products
- ✅ Login required to access pages
- ✅ JWT authentication
- ✅ Zod validation on all inputs

---

## 🏗️ Architecture

### Prisma Schema Location
`backend/prisma/schema.prisma` — Prisma's standard location. Backend scripts auto-discover it.

### Authentication
- **No User table** — admin credentials stored in `.env`
- Login: `POST /api/v1/auth/login` returns JWT token
- Token stored in localStorage on frontend
- All protected routes verify token via middleware

### Database Models
```prisma
enum CustomerTag { new, regular, vip }

Customer:
  - id, name, phone (unique), email?, address?, tag, createdAt

Product:
  - id, name, category, unit
  - price Decimal, costPrice Decimal
  - stockQty Int, minStock Int
  - expiryDate DateTime?, createdAt
```

### Error Handling
- Global Express error handler captures all errors
- Zod validation errors return 400 with field-level messages
- 401 for auth failures, 404 for not found, 500 for server errors

---

## 📂 Files Created

### Backend (13 files)

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Prisma schema with Customer & Product |
| `backend/src/index.js` | Express app entry point |
| `backend/src/utils/prisma.js` | PrismaClient singleton |
| `backend/src/middleware/auth.js` | JWT verification middleware |
| `backend/src/middleware/validate.js` | Zod validation factory |
| `backend/src/middleware/errorHandler.js` | Global error handler |
| `backend/src/controllers/authController.js` | Login handler |
| `backend/src/controllers/customerController.js` | Customer CRUD |
| `backend/src/controllers/productController.js` | Product CRUD |
| `backend/src/routes/auth.js` | `/auth/login` route |
| `backend/src/routes/customers.js` | `/customers` CRUD routes |
| `backend/src/routes/products.js` | `/products` CRUD routes |
| `backend/src/schemas/customerSchema.js` | Zod validation schema |
| `backend/src/schemas/productSchema.js` | Zod validation schema |

### Frontend (13 files)

| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Router setup, ProtectedRoute |
| `frontend/src/context/AuthContext.jsx` | Token state & login/logout |
| `frontend/src/services/api.js` | Axios instance with interceptors |
| `frontend/src/services/customers.js` | Customer API calls |
| `frontend/src/services/products.js` | Product API calls |
| `frontend/src/utils/validators.js` | Zod schemas for frontend |
| `frontend/src/pages/LoginPage.jsx` | Login form |
| `frontend/src/pages/CustomersPage.jsx` | Customer table + modals |
| `frontend/src/pages/ProductsPage.jsx` | Product table + modals |
| `frontend/src/components/Navbar.jsx` | Navigation + logout |
| `frontend/src/components/ProtectedRoute.jsx` | Route guard |
| `frontend/src/components/Modal.jsx` | Reusable modal |
| `frontend/src/components/ConfirmDialog.jsx` | Delete confirmation |

### Configuration

| File | Change |
|------|--------|
| `backend/.env` | Created with MySQL URL, JWT secret, admin credentials |
| `backend/.env.example` | Updated with PORT=4000, admin fields |
| `frontend/.env` | Created with VITE_API_URL=http://localhost:4000 |
| `frontend/.env.example` | Updated port from 5000 → 4000 |

---

## 🔧 Implementation Steps

### Backend Setup (Stages 1-6)

**Stage 1: Prisma Schema** → `backend/prisma/schema.prisma`
- Customer model: id, name, phone (unique), email?, address?, tag enum, createdAt
- Product model: id, name, category, unit, price, costPrice, stockQty, minStock, expiryDate?, createdAt
- Run: `npx prisma migrate dev --name init`

**Stage 2: Core Utilities**
- `utils/prisma.js` — PrismaClient singleton
- `middleware/errorHandler.js` — 4-arg Express error handler
- `middleware/validate.js` — Zod validation factory
- `middleware/auth.js` — JWT verify middleware

**Stage 3: Authentication**
- `controllers/authController.js` — login with bcrypt.compare
- `routes/auth.js` — POST /login with Zod validation
- Reads `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` from .env

**Stage 4: Customer CRUD**
- `schemas/customerSchema.js` — Zod with required name, phone
- `controllers/customerController.js` — 5 CRUD functions
- `routes/customers.js` — mounted at /api/v1/customers, all protected by auth

**Stage 5: Product CRUD**
- `schemas/productSchema.js` — Zod with coerce for price/stockQty
- `controllers/productController.js` — 5 CRUD functions
- `routes/products.js` — mounted at /api/v1/products, all protected by auth

**Stage 6: Express Entry Point**
- `src/index.js` — CORS config, middleware stack, route mounting, error handler last
- `package.json` scripts — `npm run dev` for nodemon, `npm run db:migrate` for Prisma

### Frontend Setup (Stages 7-10)

**Stage 7: Services & Auth**
- `services/api.js` — Axios with request interceptor (add Bearer token), response interceptor (401 → redirect to login)
- `context/AuthContext.jsx` — token in state, init from localStorage
- `utils/validators.js` — mirror Zod schemas for frontend validation

**Stage 8: Shared Components**
- `components/ProtectedRoute.jsx` — redirect to /login if not authenticated
- `components/Modal.jsx` — generic modal with overlay, close button
- `components/ConfirmDialog.jsx` — delete confirmation with Cancel/Delete buttons
- `components/Navbar.jsx` — ASTRA header + logout button

**Stage 9: Pages**
- `pages/LoginPage.jsx` — username/password form, redirect if already auth
- `pages/CustomersPage.jsx` — table (Name, Phone, Email, Tag badge, Address, Actions), add/edit modals, delete confirm
- `pages/ProductsPage.jsx` — table (Name, Category, Unit, Price, Cost, Stock (red if ≤ minStock), Expiry, Actions), add/edit modals

**Stage 10: Router**
- `src/App.jsx` — BrowserRouter, AuthProvider, Routes with ProtectedRoute pattern, root → /customers redirect

---

## ⚙️ Configuration

### Backend .env
```
DATABASE_URL="mysql://root:@localhost:3306/astra_db"
PORT=4000
NODE_ENV=development
JWT_SECRET=astra_dev_secret_key_change_this_in_production
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$7Kp9YU8q6QZqW9XdZnP9Pe1R9Y3G8H5I2J6K7L8M9N0O1P2Q3R4S5
FRONTEND_URL=http://localhost:5173
```

### Frontend .env
```
VITE_API_URL=http://localhost:4000
```

---

## 🧪 Verification Steps

### 1. Database Setup
```bash
cd backend
npx prisma migrate dev --name init
```
✓ Confirm `customers` and `products` tables created in MySQL

### 2. Backend Startup
```bash
cd backend
npm run dev
```
✓ See: `Server running on port 4000`

### 3. Test Auth Endpoint
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```
✓ Response: `{ "success": true, "token": "eyJ..." }`

### 4. Test Protected Route Without Token
```bash
curl http://localhost:4000/api/v1/customers
```
✓ Response: `{ "success": false, "message": "No token provided" }`

### 5. Test CRUD With Token
```bash
TOKEN="<paste token from step 3>"

# Create
curl -X POST http://localhost:4000/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John","phone":"01700000000","tag":"new"}'
✓ Response: `{ "success": true, "data": { "id": 1, ... } }`

# List
curl http://localhost:4000/api/v1/customers \
  -H "Authorization: Bearer $TOKEN"
✓ Response: `{ "success": true, "data": [ { "id": 1, ... } ] }`

# Get by ID
curl http://localhost:4000/api/v1/customers/1 \
  -H "Authorization: Bearer $TOKEN"
✓ Response: `{ "success": true, "data": { ... } }`

# Update
curl -X PUT http://localhost:4000/api/v1/customers/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane"}'
✓ Response: `{ "success": true, "data": { "id": 1, "name": "Jane", ... } }`

# Delete
curl -X DELETE http://localhost:4000/api/v1/customers/1 \
  -H "Authorization: Bearer $TOKEN"
✓ Response: HTTP 204 No Content
```

### 6. Test Validation Rejection
```bash
curl -X POST http://localhost:4000/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":""}'
```
✓ Response: `{ "success": false, "message": "Validation failed", "errors": { ... } }`

### 7. Frontend Startup
```bash
cd frontend
npm run dev
```
✓ Opens at `http://localhost:5173`, redirects to `/login`

### 8. Login Flow
- Enter username: `admin`, password: `admin`
- ✓ Token saved in localStorage
- ✓ Redirect to `/customers`
- ✓ Navbar shows logout button

### 9. Customer CRUD (UI)
- ✓ Click "Add Customer" → modal opens
- ✓ Fill form, validate inline errors, submit
- ✓ Customer appears in table
- ✓ Click Edit → modal pre-populated
- ✓ Modify and save → table updates
- ✓ Click Delete → confirm dialog → removed from table

### 10. Product CRUD (UI)
- ✓ Click "Add Product" → modal opens
- ✓ Fill form (price, stockQty, minStock), submit
- ✓ Product appears in table
- ✓ If stockQty ≤ minStock → row background red, text red
- ✓ Edit/delete works same as customers

### 11. Auth Persistence
- ✓ Refresh page → stays logged in (token in localStorage)
- ✓ Open DevTools → Application → Local Storage → token present

### 12. Auth Expiration
- ✓ Clear localStorage token manually
- ✓ Refresh page → redirect to `/login`

---

## 🚨 Known Issues & Workarounds

### Decimal Serialization
- **Issue:** Prisma returns `Decimal` objects for price/costPrice
- **Fix:** Controllers wrap response in `JSON.parse(JSON.stringify(data))` before `res.json()`

### Prisma P2025 Errors
- **Issue:** update/delete throw error when record not found
- **Fix:** Catch `err.code === 'P2025'` and return 404

### MySQL Connection
- **Issue:** Migration fails if MySQL not running
- **Fix:** Ensure MySQL running at localhost:3306 before migrate

---

## 📚 File Dependencies

```
database setup
    ↓
backend/prisma/schema.prisma (Stage 1)
    ↓
backend/src/utils/prisma.js (Stage 2)
    ↓
customer/product controllers (Stages 4-5)
    ↓
backend/src/index.js (Stage 6)
    ↓
npm run dev (backend runs)

frontend/src/context/AuthContext.jsx (Stage 7)
frontend/src/services/api.js (Stage 7)
    ↓
components (Stage 8)
    ↓
pages (Stage 9)
    ↓
frontend/src/App.jsx (Stage 10)
    ↓
npm run dev (frontend runs)
```

---

## ✅ Phase 1 Complete Checklist

- [x] Prisma schema created with Customer & Product models
- [x] Database migration initialized
- [x] Express server with CORS, middleware, routes
- [x] JWT authentication (login endpoint)
- [x] Customer CRUD endpoints (5 routes)
- [x] Product CRUD endpoints (5 routes)
- [x] Zod validation on POST/PUT
- [x] Global error handler
- [x] Prisma client setup
- [x] React app with routing
- [x] AuthContext for login state
- [x] Axios API client with auth interceptor
- [x] Login page with form validation
- [x] Customers page with table, add/edit/delete modals
- [x] Products page with table, add/edit/delete modals, low-stock highlighting
- [x] Protected routes
- [x] Navbar with logout
- [x] Frontend validation with Zod

---

## 🎯 Next: Phase 2

**Focus:** Sales (POS) system
- Multi-item cart
- Transaction creation
- Automatic stock deduction
- Invoice/memo generation

See [Phase2.md](./Phase2.md) when ready.
