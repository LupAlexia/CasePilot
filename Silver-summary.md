# CasePilot — Implementation Summary

## Architecture

- **Backend**: ASP.NET Core 9.0 Web API with Entity Framework Core (SQLite)
- **Frontend**: React 19 + TypeScript + Material UI + Motion (Framer Motion)
- **Communication**: REST over HTTPS (Kestrel port 7154) + HTTP (port 5265), CORS configured

## Authentication & Authorization

### 3-Way Authentication Flow

1. **Step 1 — Credentials**: `POST /api/auth/login` validates email + password, generates a 6-digit OTP code (logged to server console), returns a `verificationToken` + `maskedEmail`
2. **Step 2 — OTP Verification**: `POST /api/auth/verify-code` validates the OTP code against the verification token, issues JWT access token + refresh token + creates a server-side session
3. **Step 3 — Session Binding**: The JWT access token contains a `sessionId` claim that binds the token to a specific server-side session, enabling session management and revocation

### Password Recovery

- `POST /api/auth/forgot-password` — generates a secure reset token (logged to server console), always returns success to prevent email enumeration
- `POST /api/auth/reset-password` — validates the reset token and updates the password hash, revokes all existing sessions and tokens for security

### Role-Based Authorization

| Role | Permissions | Controller Access |
|---|---|---|
| **Admin** | All 12 permissions (cases.*, docs.*, stats.view, users.manage, audit.view, simulator.control) | AdminController, SimulatorController, AuthController |
| **User** (Lawyer) | 9 permissions (cases.*, docs.*, stats.view) | LegalCasesController, CaseDocumentsController, StatisticsController |

### JWT Token Scheme

- **Access Token**: 30-minute expiry, contains `sub`, `email`, `fullName`, `sessionId`, roles (as `ClaimTypes.Role`), and permissions (as `permission` claims)
- **Refresh Token**: 7-day expiry, cryptographically secure random token stored server-side, supports rotation (old token revoked on refresh)
- **Verification Token**: 10-minute expiry, links OTP code to login attempt
- **Password Reset Token**: 1-hour expiry, single-use

### Session Management

- **Server-side sessions**: Each login creates a `UserSession` record tracking IP, user agent, creation time, and last activity
- **Session listing**: `GET /api/auth/sessions` — returns all active sessions for the authenticated user, marks the current session
- **Session revocation**: `DELETE /api/auth/sessions/{id}` — revokes a specific session and its associated refresh token
- **Bulk revocation**: Password reset and admin deactivation revoke all user sessions and tokens
- **Client-side inactivity**: 15-minute inactivity timeout triggers auto-logout on the frontend

### Security Measures

- BCrypt password hashing with automatic legacy plain-text upgrade on first login
- Audit logging for all sensitive actions (login, logout, register, delete)
- Threat detection service analyzing brute-force attempts, mass deletions, and rapid API usage
- Suspicious user flagging with admin review capabilities

## API Endpoints

### Auth Endpoints (public)
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Step 1: validate credentials → verification token |
| POST | `/api/auth/verify-code` | Step 2: verify OTP → JWT tokens + session |
| POST | `/api/auth/resend-code` | Resend OTP code |
| POST | `/api/auth/register` | Register new user (auto-assigned User role) |
| POST | `/api/auth/refresh` | Refresh access token (rotation) |
| POST | `/api/auth/forgot-password` | Initiate password reset |
| POST | `/api/auth/reset-password` | Complete password reset |

### Auth Endpoints (authenticated)
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/logout` | Revoke refresh token |
| GET | `/api/auth/me` | Get current user info from JWT |
| GET | `/api/auth/sessions` | List active sessions |
| DELETE | `/api/auth/sessions/{id}` | Revoke a session |

### Admin Endpoints (`[Authorize(Roles = "Admin")]`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/{id}/deactivate` | Deactivate user |
| PUT | `/api/admin/users/{id}/activate` | Activate user |
| GET | `/api/admin/audit-logs` | View audit logs |
| GET | `/api/admin/suspicious-users` | View flagged users |
| PUT | `/api/admin/suspicious-users/{id}/resolve` | Resolve flag |

### Domain Endpoints (`[Authorize]`)
| Method | Path | Description |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/legal-cases/**` | Case CRUD |
| GET/POST/PUT/DELETE | `/api/case-documents/**` | Document CRUD |
| GET | `/api/statistics/**` | Case statistics |

### Simulator (`[Authorize(Roles = "Admin")]`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/simulator/**` | Fake data generation |

## Frontend Pages

| Route | Page | Access |
|---|---|---|
| `/login` | Login (email + password) | Public |
| `/verify-code` | OTP verification (6-digit code) | Public (requires verificationToken) |
| `/register` | Registration | Public |
| `/forgot-password` | Password recovery (email input) | Public |
| `/reset-password` | Password reset (token + new password) | Public |
| `/app/dashboard` | Lawyer dashboard | User |
| `/app/dosare` | Cases list | User |
| `/app/dosare/:id` | Case detail | User |
| `/app/calendar` | Calendar | User |
| `/app/asistent-ai` | AI Assistant | User |
| `/app/profil` | Profile | User |
| `/app/admin/utilizatori` | User management | Admin |
| `/app/admin/audit` | Audit logs | Admin |
| `/app/admin/supraveghere` | Threat monitoring | Admin |

## Database Schema (New Tables)

### EmailVerificationCodes
Stores 6-digit OTP codes for 3-way authentication step 2. Each code has a unique verification token, 10-minute expiry, and single-use flag.

### PasswordResetTokens
Stores secure reset tokens for password recovery. Each token has a 1-hour expiry and single-use flag.

### UserSessions
Server-side session tracking with IP address, user agent, creation time, last activity timestamp, and revocation status. Linked to refresh tokens for cascade revocation.

## Test Results

```
Backend:  75 passed, 2 failed (unrelated seed data assertion)
  - AuthServiceTests: 22 passed ✅
Frontend: 12 auth tests passed ✅
  - authApi.test.ts: 8 passed
  - LoginPage.test.tsx: 4 passed
```

## How to Run

```bash
# Backend (HTTPS on port 7154, HTTP on port 5265)
cd Backend/CasePilot.Api
dotnet run

# Frontend
cd casepilot-frontend
npm run dev
```

## Credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@casepilot.com | admin123 |
| User (Lawyer) | avocat@casepilot.com | avocat123 |

> [!IMPORTANT]
> The OTP verification codes and password reset tokens are logged to the **server console** (simulated email). Check the terminal running `dotnet run` for the codes.

> [!IMPORTANT]
> For the lab demo, update the frontend `.env` to point `VITE_API_BASE_URL` to the server machine's IP address (e.g., `https://192.168.x.x:7154/api`). Also add that IP to the CORS origins in `Program.cs`.
