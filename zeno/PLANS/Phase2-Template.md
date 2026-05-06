# Phase 2: Sales (POS) System

**Status:** ⏳ NOT STARTED  
**Estimated Duration:** 6-8 hours  

---

## 📋 Overview

Implement the point-of-sale system allowing shop owners to create transactions with multiple products, auto-reduce inventory, generate invoices, and view sales history.

### Deliverables (planned)
- [ ] Sales transaction creation (multi-item cart)
- [ ] Automatic stock deduction on sale
- [ ] Invoice generation and storage
- [ ] Sales history with filtering
- [ ] Sales dashboard/analytics
- [ ] Return/refund functionality

---

## 🏗️ Architecture (planned)

### New Database Models
```prisma
Sale:
  - id, customer_id?, total_amount, discount?, tax?
  - status (pending, completed, cancelled)
  - created_at

SaleItem:
  - id, sale_id, product_id, quantity, unit_price, subtotal

StockMovement:
  - id, product_id, change_qty, reason, created_at
```

### New API Routes
- `POST /api/v1/sales` — create sale with items
- `GET /api/v1/sales` — list sales with filters
- `GET /api/v1/sales/:id` — get sale details
- `POST /api/v1/sales/:id/refund` — refund entire sale
- `GET /api/v1/sales/:id/invoice` — generate PDF invoice

### Frontend Pages
- Sales POS page with cart UI
- Sales history page with table

---

## 📂 Files to Create (planned)

### Backend
- `backend/src/controllers/saleController.js`
- `backend/src/routes/sales.js`
- `backend/src/schemas/saleSchema.js`
- `backend/src/services/saleService.js` (business logic)

### Frontend
- `frontend/src/pages/SalesPage.jsx`
- `frontend/src/pages/SalesHistoryPage.jsx`
- `frontend/src/components/Cart.jsx`
- `frontend/src/components/CartItem.jsx`
- `frontend/src/services/sales.js`

---

## 🧪 Verification (planned)
- [ ] Create sale with 3 items
- [ ] Verify stock reduced for each product
- [ ] Verify sale stored with correct total
- [ ] List sales and see created transaction
- [ ] Generate PDF invoice
- [ ] Refund sale and verify stock restored

---

**To be detailed when Phase 1 is confirmed complete.**
