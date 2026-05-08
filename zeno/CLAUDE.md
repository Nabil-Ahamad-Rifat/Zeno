# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Commands

### Backend (port 4000)
```bash
cd backend
npm run dev        # nodemon — auto-restarts on change
npm run start      # production
npm run db:seed    # seed admin, demo shopkeeper, products, customers
```

### Frontend (port 5173)
```bash
cd frontend
npm run dev        # Astro dev server
npm run build      # production build
npm run preview    # preview build
```

## Seeded Accounts

| Role        | Email                   | Password | Notes                          |
|-------------|-------------------------|----------|--------------------------------|
| Admin       | admin@zeno.com          | admin    | No shopId, platform-level only |
| Shopkeeper  | shopkeeper@zeno.com     | admin    | "ZENO Demo Shop", Dhaka        |

Run `npm run db:seed` from `backend/` to create or reset these accounts.

## Architecture

**Backend** — Express.js (ESM, `"type": "module"`), MongoDB Atlas via Mongoose. All routes under `/api/v1/`. Auth via httpOnly cookie named `auth_token` (JWT). Express-session used only for Passport OAuth state.

**Frontend** — Astro 4 with `output: 'hybrid'`. React islands for interactive pages (Login, Register, Onboarding, dashboard views). nanostores for auth state (persisted in `localStorage` as `user`). Axios instance in `src/services/api.js` with `withCredentials: true`.

### Key layers

```
backend/src/
  config/passport.js     — Google, Facebook, LinkedIn OAuth strategies
  middleware/auth.js     — requireAuth (reads fresh shopId from DB), requireRole, requireAdmin
  middleware/requireShop.js / requireActiveShop.js — shop-scoped guards
  models/                — Mongoose: User, Shop, Product, Customer, Sale, StockMovement, Invitation
  services/authService.js — findOrCreateSocialUser (upserts social accounts on User)
  routes/ + controllers/ — thin controllers delegate to services
  utils/db.js            — connectDB with Google DNS override for MongoDB SRV

frontend/src/
  stores/auth.js         — currentUser atom + setUser/logout helpers
  services/api.js        — axios, auto-redirect to /login on 401
  islands/               — React components hydrated client-side
  layouts/Layout.astro   — protect={true} guard (checks localStorage.user), includes Footer
  components/Navbar.astro — shows CMS link only if user.role === 'admin'
  keystatic.config.ts    — Keystatic CMS for legal pages
```

### Roles & access flow

`admin → shopkeeper → seller → customer`

- **Admin** — no shopId; can access `/api/v1/admin/*`
- **Shopkeeper** — must create a shop via `/onboarding` before accessing shop features; all shop routes require `req.user.shopId`
- **Seller** — assigned to a shop via invitation
- **Customer** — can view their purchases / leave feedback

After login, `auth.js` middleware fetches `shopId` fresh from the DB on every request (stale-JWT fix — do not revert this).

### OAuth popup flow

1. `window.open(apiUrl/api/v1/oauth/{provider})` — opens popup
2. Passport handles auth → sets `auth_token` cookie → redirects to `/auth/success`
3. `/auth/success` fetches `/api/v1/auth/me`, detects `window.opener`, posts `{ type: 'oauth-success', user, redirect }` back
4. Parent receives message, calls `setUser(data.user)`, navigates to `data.redirect`

### LinkedIn OAuth quirk

`passport-linkedin-oauth2` uses the deprecated `/v2/me` API. We use `passport-oauth2` (generic) with a custom `userProfile()` that calls `/v2/userinfo` (OIDC). The strategy is registered as `'linkedin'`. Required scopes: `['openid', 'profile', 'email']`.

### MongoDB Atlas SRV fix

Local DNS blocks SRV record queries. `backend/src/utils/db.js` overrides DNS to `8.8.8.8` before connecting. This is intentional — do not remove the `dns.setServers` call.

### Keystatic CMS (legal pages)

Path convention in `keystatic.config.ts`: `path: 'src/keystatic/legal/{slug}'` (no trailing slash). This creates:
- `src/keystatic/legal/{slug}.yaml` — scalar fields (title, description)
- `src/keystatic/legal/{slug}/content.mdoc` — markdoc body

Legal pages (`/terms`, `/privacy`, `/refund`, `/about`) are `prerender: true` in Astro hybrid mode. The Keystatic admin at `/keystatic` is `prerender: false`.

### Product expiryDate

`expiryDate` is optional. The Zod schema in `backend/src/schemas/productSchema.js` transforms empty strings to `undefined` to prevent Mongoose cast errors. Always send `undefined` (not `""`) from the frontend when the field is blank.
