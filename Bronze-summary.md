# Assignment 4 — Authentication & Authorization Implementation

## ✅ Summary

All requirements from the SDI Assignment 4 have been implemented:

| Requirement | Status | Details |
|---|---|---|
| Secure login/register | ✅ | BCrypt password hashing + JWT tokens |
| Token-based auth | ✅ | JWT access tokens with roles/permissions claims |
| Session management | ✅ | 15-min inactivity auto-logout + refresh token rotation |
| HTTPS encrypted communication | ✅ | Kestrel configured on port 7154 with HTTPS |
| Server on different machine | ✅ | Kestrel binds `0.0.0.0` (all interfaces) |
| Role-based authorization | ✅ | `[Authorize]` / `[Authorize(Roles = "Admin")]` |
| Thorough testing | ✅ | 69 backend + 12 frontend tests, all passing |

---

## Backend Changes

### New Packages
- `BCrypt.Net-Next` — password hashing
- `Microsoft.AspNetCore.Authentication.JwtBearer` — JWT middleware

### New Files
| File | Purpose |
|---|---|
| [IJwtTokenService.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/Services/Interfaces/IJwtTokenService.cs) | JWT service interface |
| [JwtTokenService.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/Services/JwtTokenService.cs) | HMAC-SHA256 token generation + validation |
| [RefreshToken.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/Models/RefreshToken.cs) | Refresh token entity with revocation support |
| [RefreshTokenRequest.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/DTOs/Requests/RefreshTokenRequest.cs) | DTO for token refresh requests |
| [JwtTokenServiceTests.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Tests/Services/JwtTokenServiceTests.cs) | 8 JWT token tests |

### Modified Files
| File | What Changed |
|---|---|
| [Program.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/Program.cs) | JWT Bearer middleware, HTTPS on port 7154, `UseAuthentication()` |
| [appsettings.json](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/appsettings.json) | JWT config (key, issuer, audience, expiration) |
| [AppUser.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/Models/AppUser.cs) | Added `PasswordHash` + `RefreshTokens` |
| [LoginResponse.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/DTOs/Responses/LoginResponse.cs) | Added `AccessToken`, `RefreshToken`, `AccessTokenExpiration` |
| [AuthService.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/Services/AuthService.cs) | BCrypt verify, JWT generation, refresh token rotation |
| [IAuthService.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/Services/Interfaces/IAuthService.cs) | Added `RefreshToken`, `RevokeRefreshToken`, `RevokeAllUserTokens` |
| [AuthController.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/Controllers/AuthController.cs) | Added `/refresh`, `/logout`, `/me` endpoints |
| All Controllers | `[Authorize]` attribute, JWT claims instead of `X-User-Id` headers |
| [CasePilotDbContext.cs](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/Backend/CasePilot.Api/Storage/CasePilotDbContext.cs) | `RefreshTokens` table, BCrypt-hashed seed passwords |

---

## Frontend Changes

| File | What Changed |
|---|---|
| [AuthContext.tsx](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/casepilot-frontend/src/features/auth/AuthContext.tsx) | Stores JWT tokens, 15-min inactivity auto-logout, server-side token revocation on logout |
| [authHeaders.ts](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/casepilot-frontend/src/services/api/authHeaders.ts) | `Authorization: Bearer <token>` instead of `X-User-Id` headers |
| [authApi.ts](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/casepilot-frontend/src/services/api/authApi.ts) | Added `refreshAccessToken`, `logoutUser`; Bearer headers on admin calls; 401 → redirect to login |
| [caseUpdatesConnection.ts](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/casepilot-frontend/src/services/realtime/caseUpdatesConnection.ts) | SignalR `accessTokenFactory` for authenticated hub connections |
| [AdminWatchlistPage.tsx](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/casepilot-frontend/src/features/admin/pages/AdminWatchlistPage.tsx) | Removed `adminUserId` param (now from JWT) |

### New Test Files
| File | Tests |
|---|---|
| [AuthContext.test.tsx](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/casepilot-frontend/src/features/auth/AuthContext.test.tsx) | 7 tests: init, persistence, login/logout, admin detection, permissions, token storage |
| [authApi.test.ts](file:///D:/Facultate/An_II/Sem4/MPP/A4-partial/casepilot-frontend/src/services/api/authApi.test.ts) | 5 tests: login, register, refresh, error handling |

---

## Test Results

```
Backend:  69 passed, 0 failed
Frontend: 12 passed, 0 failed
Total:    81 tests ✅
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
> For the lab demo, update the frontend `.env` to point `VITE_API_BASE_URL` to the server machine's IP address (e.g., `https://192.168.x.x:7154/api`). Also add that IP to the CORS origins in `Program.cs`.
