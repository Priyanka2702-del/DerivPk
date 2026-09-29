# DerivPk

## Overview

This project was extended from the original cloned repository with a custom backend architecture for authentication, MongoDB, KYC verification, ImageKit document storage, and Deriv market API integration.

The backend is implemented inside the existing Next.js application using Next.js API Route Handlers.

---

## Backend Changes

### 1. Authentication and Authorization

Custom authentication was added for application users.

Main files:

```text
lib/auth.ts
lib/session.ts
lib/client-auth.ts
models/User.ts
models/Session.ts
```

Implemented:

* User registration
* User login
* Logout
* Session-based authentication
* HTTP-only `pk_session` cookie
* Password hashing
* Current authenticated user
* User roles: `user` and `admin`
* Protected API routes

Authentication flow:

```text
Register/Login
      ↓
Create Session
      ↓
MongoDB
      ↓
pk_session Cookie
      ↓
Protected API
```

---

## 2. MongoDB Integration

Main file:

```text
lib/db.ts
```

MongoDB is connected using Mongoose.

Connection caching was implemented to avoid unnecessary database connections during development and production/serverless execution.

Environment variable:

```env
MONGODB_URI=
```

---

## 3. User Model

File:

```text
models/User.ts
```

User model contains:

```text
name
email
password
role
createdAt
updatedAt
```

The password is excluded from normal queries.

Default role:

```text
user
```

---

## 4. Session Model

File:

```text
models/Session.ts
```

Sessions are stored in MongoDB and connected with the corresponding user.

Session authentication uses:

```text
pk_session
```

The session token is hashed before being stored.

---

## 5. Current User API

File:

```text
app/api/auth/me/route.ts
```

Endpoint:

```text
GET /api/auth/me
```

Used by the dashboard and sidebar to retrieve the currently authenticated user.

---

## 6. KYC System

Main files:

```text
models/KYC.ts

app/api/kyc/route.ts
app/api/kyc/document/route.ts
app/api/kyc/address/route.ts
```

Implemented:

* KYC status management
* Identity document upload
* Address document upload
* File type validation
* 10 MB upload limit
* KYC status checking
* Submission tracking
* Rejection reason support

KYC statuses:

```text
not_started
pending
approved
rejected
```

A race-condition fix was also implemented in:

```text
app/api/kyc/route.ts
```

to prevent MongoDB duplicate-key errors when multiple KYC requests are made simultaneously.

---

## 7. ImageKit Integration

File:

```text
lib/imagekit.ts
```

ImageKit is used for storing KYC documents.

Environment variables:

```env
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

The ImageKit private key is server-side only and must never be committed to GitHub.

---

## 8. Deriv API Integration

Main files:

```text
lib/deriv/
lib/deriv-market.ts
lib/deriv-market-server.ts
```

API routes:

```text
app/api/deriv/
```

The backend provides the foundation for communicating with Deriv services and retrieving market data.

Implemented/integrated areas include:

```text
Market ticks
Market candles
WebSocket communication
Options account API integration
```

General flow:

```text
Trading UI
    ↓
Next.js API
    ↓
Deriv API / WebSocket
    ↓
Market Data
    ↓
Trading UI
```

---

## 9. Trading UI Backend Integration

Important frontend files modified for backend integration:

```text
app/dashboard/trading/page.tsx
components/dashboard/TradingViewChart.tsx
components/dashboard/Sidebar.tsx
components/dashboard/TopBar.tsx
components/dashboard/MobileNav.tsx
```

These changes connect the existing dashboard UI with authentication and backend data.

---

## 10. Profile and Verification

Modified pages:

```text
app/dashboard/profile/page.tsx
app/dashboard/verification/page.tsx
```

The profile page uses authenticated user data.

The verification page communicates with the KYC APIs.

---

## 11. Authentication UI Changes

Modified:

```text
components/LoginForm.tsx
components/RegisterForm.tsx
```

These components were connected to the custom backend authentication system.

---

## 12. Important Modified Files

### Backend files added

```text
lib/auth.ts
lib/client-auth.ts
lib/db.ts
lib/deriv-market.ts
lib/deriv-market-server.ts
lib/imagekit.ts

models/User.ts
models/Session.ts
models/KYC.ts
```

### API routes added

```text
app/api/auth/
app/api/kyc/
app/api/deriv/
```

### Existing UI files modified

```text
app/dashboard/layout.tsx
app/dashboard/profile/page.tsx
app/dashboard/trading/page.tsx
app/dashboard/verification/page.tsx
app/layout.tsx

components/LoginForm.tsx
components/RegisterForm.tsx

components/dashboard/MobileNav.tsx
components/dashboard/Sidebar.tsx
components/dashboard/TopBar.tsx
components/dashboard/TradingViewChart.tsx
```

---

## 13. Packages Added

Important backend dependencies include:

```text
mongoose
@imagekit/next
@imagekit/nodejs
ws
@types/ws
```

---

## 14. Environment Variables

Required environment variables:

```env
MONGODB_URI=

DERIV_CLIENT_ID=
DERIV_REDIRECT_URI=

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

`.env.local` must never be committed.

---

## 15. Build Verification

Production build was successfully verified with:

```bash
npm run build
```

The TypeScript and backend build issues encountered during development were resolved.

---

## 16. Git Deployment

Development changes should be pushed through a feature branch.

Example:

```bash
git switch -c backend-production-fixes
git add .
git commit -m "Implement backend authentication and KYC integration"
git push -u origin backend-production-fixes
```

Then create a Pull Request into the production branch.

---

## Backend Summary

The cloned project was extended with:

```text
Custom Authentication
        ↓
Session Management
        ↓
MongoDB
        ↓
KYC + ImageKit
        ↓
Deriv API Integration
        ↓
Market Data + WebSocket
        ↓
Trading Dashboard
```

This backend provides the foundation for further trading, user-management, KYC-admin, and Deriv account functionality.
