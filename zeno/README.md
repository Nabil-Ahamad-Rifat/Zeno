# ZENO - Multi-Tenant Shop Management SaaS

A complete role-based shop management platform with authentication, dashboards, and e-commerce features built with React, Express.js, and MySQL.

## 🎯 Key Features

✅ **Multi-Role Authentication** - Admin, Shopkeeper, Seller, Customer  
✅ **JWT Authentication** - Secure token-based sessions  
✅ **Role-Based Dashboards** - Custom interface for each user role  
✅ **Admin Dashboard** - Platform overview and user management  
✅ **Shop Dashboard** - Sales metrics and customer insights  
✅ **POS Interface** - Fast checkout with shopping cart  
✅ **Customer Portal** - Purchase history and ratings  
✅ **Security** - bcrypt passwords, rate limiting, CORS

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install:all

# Start all services
npm run dev

# Or start individually:
npm run dev:backend    # Backend API (port 4000)
npm run dev:frontend   # Frontend App (port 5173)
npm run dev:marketing  # Marketing Site (port 5178)
```

## 🏗️ Project Structure

```
zeno/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── controllers/    # Auth & business logic
│   │   ├── services/       # Database operations
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── routes/         # API endpoints
│   │   └── server.js       # Express app
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.js         # Seed data
│   ├── .env                # Configuration
│   └── package.json
│
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── components/     # UI components & layouts
│   │   ├── pages/          # Role dashboards
│   │   ├── hooks/          # useAuth hook
│   │   ├── routes/         # Route configuration
│   │   └── App.jsx         # Main app
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── marketing/              # Public landing site
    ├── src/
    │   ├── pages/          # Landing, features, pricing
    │   ├── components/     # UI components
    │   └── layouts/        # Page templates
    └── vite.config.js
│
├── database/              # Prisma schema & migrations
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Database migrations
│   ├── schema.sql         # Reference SQL schema
│   ├── package.json
│   └── .env.example
│
└── README.md              # This file
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MySQL + Prisma ORM |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Charts | Chart.js + react-chartjs-2 |
| Auth | JWT (shop owner only) |
| Email | Nodemailer (Gmail SMTP) |
| PDF | pdfkit |
| Validation | zod |
| Env | dotenv |

## 📊 Database Schema

### Core Tables
- **users** - Shop owner authentication
- **customers** - Customer info with tags (regular/VIP/new)
- **products** - Inventory with stock levels and expiry dates
- **sales** - Transaction records with totals and discounts
- **sale_items** - Line items within sales
- **feedback** - Customer ratings and comments (1-5 stars)
- **stock_movements** - Inventory transaction history

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- Gmail account with app password (for email feature)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd astra
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database and email credentials
   
   # Frontend
   cp frontend/.env.example frontend/.env
   
   # Database
   cp database/.env.example database/.env
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install && cd ..
   
   # Frontend
   cd frontend && npm install && cd ..
   
   # Database
   cd database && npm install && cd ..
   ```

4. **Set up the database**
   ```bash
   cd database
   npm run migrate  # Run Prisma migrations
   cd ..
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Backend (runs on http://localhost:5000)
   cd backend && npm run dev
   
   # Terminal 2: Frontend (runs on http://localhost:5173)
   cd frontend && npm run dev
   ```

## 📦 Development Scripts

### Backend
```bash
npm run dev          # Start dev server with nodemon
npm run start        # Start production server
npm run db:push     # Push schema changes to database
npm run db:generate # Generate Prisma client
npm run db:seed     # Seed database with test data
```

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Database
```bash
npm run migrate       # Create and run migrations
npm run migrate:deploy # Deploy migrations in production
npm run generate      # Generate Prisma client
npm run studio       # Open Prisma Studio GUI
```

## 🔒 Security Notes

- All passwords are hashed with bcrypt
- All inputs are validated with zod
- Uses parameterized queries via Prisma to prevent SQL injection
- JWT tokens for shop owner authentication
- CORS configured for frontend access
- Environment variables required for sensitive data (never commit .env)

## 📝 Development Phases

This project is built in phases:

1. **Phase 1** - Project scaffolding (current)
2. **Phase 2** - Backend setup & API structure
3. **Phase 3** - Database schema & Prisma models
4. **Phase 4** - Frontend setup & layout
5. **Phase 5** - Customer management
6. **Phase 6** - Product/inventory management
7. **Phase 7** - Sales (POS) system
8. **Phase 8** - Email memo & feedback systems
9. **Phase 9** - Dashboard & reporting
10. **Phase 10** - Testing & deployment

## 📄 License

MIT License - Feel free to use this project for commercial purposes.

## 👤 Author

ASTRA Team

---

**Status**: Scaffolding Phase ✅
