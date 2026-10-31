# Integration Guide — Brightloop Subscription Management System

## 1. Branching Strategy
- **`main`**: Production-ready demo code. Never commit or push directly to `main`.
- **`develop`**: Central integration branch. All feature branches merge into `develop` via Pull Request after code review by Member 1.
- **Feature Branches**:
  - Member 1: `feature/auth-foundation`
  - Member 2: `feature/subscriptions`
  - Member 3: `feature/billing-engine`
  - Member 4: `feature/frontend-dashboard`

## 2. Environment Variables
Local development requires `.env` in `server/` and `client/`.
Never commit `.env` files. Template files `.env.example` are committed.

### Backend (`server/.env`):
```env
PORT=5000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Frontend (`client/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. How to Connect Backend Modules (Members 2 & 3)
1. Do **not** edit `server/src/app.js` directly in your branch.
2. In your module directory (e.g. `server/src/modules/quotations/routes.js`):
   ```javascript
   import { Router } from 'express';
   const router = Router();
   // define routes...
   export default router;
   ```
3. Member 1 imports and mounts your router in `server/src/app.js` upon PR merge:
   ```javascript
   import quotationRoutes from './modules/quotations/routes.js';
   app.use('/api/quotations', quotationRoutes);
   ```

## 4. Frontend API Consumption (Member 4)
- Use the shared Axios client configured in `client/src/api/axios.js`.
- It automatically injects `Authorization: Bearer <token>` from the Supabase session.
- Strictly adhere to `PROJECT_DOCUMENTATION/API_CONTRACTS.md`.
