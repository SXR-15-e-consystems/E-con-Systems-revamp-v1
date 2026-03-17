# Module 2: Identity Management System (IMS) — Complete Instructions

---

## 1. Objective

Implement a **secure, production-grade, custom JWT-based authentication and authorization system** from scratch. You own the security utility layer (backend) and the authentication UI (CMS frontend).

> **YOUR SCOPE:** Files in `backend/app/security/`, the login/auth UI in `cms/src/auth/`, and auth-related TypeScript types.  
> **NOT YOUR SCOPE:** Route definitions (M5 owns routers), database schemas (M1 owns models), page builder UI (M3 owns).

---

## 2. Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOKEN FLOW                                │
│                                                                  │
│  1. User submits email + password on CMS Login Page (M3 UI)     │
│  2. CMS sends POST /api/v1/auth/login to M5                     │
│  3. M5 calls M2's verify_password() + create_access_token()     │
│  4. M5 returns:                                                  │
│     - access_token (JWT, 15 min, in JSON body)                  │
│     - refresh_token (JWT, 7 days, in HttpOnly cookie)           │
│  5. CMS stores access_token in memory (NOT localStorage)        │
│  6. CMS Axios interceptor attaches: Authorization: Bearer <AT>  │
│  7. On 401, interceptor calls POST /api/v1/auth/refresh          │
│     (browser auto-sends HttpOnly cookie)                         │
│  8. M5 returns new access_token; original request retries        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Critical Security Decisions

| Decision                          | Choice                          | Reason                                                     |
| --------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Access token storage              | In-memory JS variable           | XSS cannot steal it (no localStorage/sessionStorage)       |
| Refresh token storage             | `HttpOnly`, `Secure`, `SameSite=Strict` cookie | Immune to XSS, sent only on same-site requests |
| Password hashing                  | bcrypt, cost factor 12          | Industry standard, resistant to GPU brute-force            |
| JWT algorithm                     | HS256                           | Symmetric, simple, adequate for single-issuer system       |
| Token rotation                    | Refresh tokens are single-use   | Stolen refresh token detected via reuse detection          |
| Account lockout                   | 10 failures → 15 min lock       | Mitigates brute-force without permanent denial             |
| Rate limiting                     | 5 login attempts/min/IP         | Prevents credential stuffing at scale                      |

---

## 3. Backend Implementation

### 3.1 File: `backend/app/security/hashing.py`

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain: str) -> str:
    """Hash a plaintext password. Called during user creation."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time comparison. Returns True if match."""
    return pwd_context.verify(plain, hashed)
```

**Rules:**
- NEVER log or print plaintext passwords.
- NEVER store plaintext passwords anywhere.
- `verify_password` uses constant-time comparison internally (passlib handles this).

---

### 3.2 File: `backend/app/security/jwt.py`

```python
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt  # PyJWT

SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def _require_secret() -> str:
    if not SECRET_KEY or len(SECRET_KEY) < 32:
        raise RuntimeError(
            "JWT_SECRET_KEY must be set and at least 32 characters. "
            "Generate one with: openssl rand -hex 32"
        )
    return SECRET_KEY


def create_access_token(subject: str, role: str, extra: dict[str, Any] | None = None) -> str:
    """Create a short-lived access token.
    
    Args:
        subject: User ID (string ObjectId).
        role: UserRole value (e.g., "admin").
        extra: Optional additional claims.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, _require_secret(), algorithm=ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """Create a long-lived refresh token.
    
    Args:
        subject: User ID (string ObjectId).
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, _require_secret(), algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises jwt.InvalidTokenError on failure.
    
    Returns the full payload dict with keys: sub, role (access only), type, iat, exp.
    """
    return jwt.decode(token, _require_secret(), algorithms=[ALGORITHM])
```

**Rules:**
- `JWT_SECRET_KEY` MUST be at least 32 characters (256 bits). Fail loudly at startup if missing.
- Access token payload: `{"sub": "<user_id>", "role": "<role>", "type": "access", "iat": ..., "exp": ...}`
- Refresh token payload: `{"sub": "<user_id>", "type": "refresh", "iat": ..., "exp": ...}`
- NEVER put sensitive data (email, password hash) in JWT payload.
- Always validate `type` claim — an access token must not be accepted where a refresh token is expected, and vice versa.

---

### 3.3 File: `backend/app/security/dependencies.py`

```python
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt as pyjwt

from app.database import get_db
from app.models.user import UserRole
from .jwt import decode_token

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict:
    """FastAPI dependency: extract and validate JWT from Authorization header.
    
    Returns the full user document (dict) from MongoDB.
    Raises 401 if token is missing, expired, invalid, or user is inactive/locked.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Missing authentication token"},
        )

    try:
        payload = decode_token(credentials.credentials)
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Token has expired"},
        )
    except pyjwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid token"},
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid token type"},
        )

    db = get_db()
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "User not found"},
        )
    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Account is deactivated"},
        )

    return user


def require_role(allowed_roles: list[UserRole]):
    """Factory that returns a FastAPI dependency checking user role.
    
    Usage in router:
        @router.post("/pages", dependencies=[Depends(require_role([UserRole.ADMIN, UserRole.MARKETING]))])
    """
    async def _check_role(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in [r.value for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": f"Role '{user_role}' is not authorized for this action",
                },
            )
        return current_user
    return _check_role
```

**Rules:**
- `get_current_user` MUST validate: (a) token present, (b) token not expired, (c) token type is `"access"`, (d) user exists in DB, (e) user is active.
- `require_role` is a **factory** — it returns a dependency. Usage: `Depends(require_role([UserRole.ADMIN]))`.
- Error responses MUST follow the M0 §9 error contract shape.
- NEVER reveal whether the email exists on login failure — always return the same generic message.

---

### 3.4 File: `backend/app/security/rate_limit.py`

```python
import time
from collections import defaultdict
from threading import Lock

# In-memory sliding window. For production, replace with Redis-based limiter.
_store: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def is_rate_limited(key: str, max_requests: int, window_seconds: int) -> bool:
    """Return True if the key has exceeded the limit in the time window.
    
    Args:
        key: Identifier (e.g., IP address or "login:{ip}").
        max_requests: Max allowed requests in window.
        window_seconds: Sliding window size in seconds.
    """
    now = time.monotonic()
    with _lock:
        # Remove expired entries
        _store[key] = [t for t in _store[key] if now - t < window_seconds]
        if len(_store[key]) >= max_requests:
            return True
        _store[key].append(now)
        return False
```

**Usage in M5 auth router:**
```python
if is_rate_limited(f"login:{client_ip}", max_requests=5, window_seconds=60):
    raise HTTPException(status_code=429, detail={"code": "RATE_LIMITED", "message": "Too many login attempts"})
```

---

## 4. Frontend Implementation (CMS Auth UI)

### 4.1 Architecture

```
cms/src/auth/
├── AuthProvider.tsx      # React context providing user state + tokens
├── LoginPage.tsx         # Login form UI
├── ProtectedRoute.tsx    # Route guard wrapper
└── useAuth.ts            # Hook exposing login(), logout(), user, isAuthenticated
```

### 4.2 File: `cms/src/auth/AuthProvider.tsx` — Specification

```tsx
// AuthProvider manages:
// 1. accessToken: stored in a React ref (NOT state, to avoid re-renders)
// 2. user: { id, email, role } stored in state
// 3. On mount: attempt silent refresh (POST /api/v1/auth/refresh)
//    - If refresh succeeds → user is authenticated
//    - If refresh fails → user must log in
// 4. Exposes login(email, password) and logout() functions via context

// CRITICAL: accessToken must NEVER be in localStorage, sessionStorage, or cookies.
// It lives ONLY in a JS variable that dies when the tab closes.
```

### 4.3 File: `cms/src/api/client.ts` — Axios Interceptor Specification

```typescript
// Create an Axios instance with baseURL from VITE_API_BASE_URL
// 
// REQUEST interceptor:
//   - Attach Authorization: Bearer <accessToken> from AuthProvider ref
//   - Set Content-Type: application/json (default)
//
// RESPONSE interceptor (error handler):
//   - If error.response.status === 401 AND the request is NOT /auth/refresh:
//     1. Call POST /api/v1/auth/refresh (cookie sent automatically)
//     2. If refresh succeeds:
//        - Update accessToken ref with new token
//        - Retry the original failed request with new token
//     3. If refresh also fails:
//        - Call logout() — clear user state, redirect to /login
//
// IMPORTANT: Use a request queue to prevent multiple simultaneous refresh calls.
// While a refresh is in-flight, queue all other 401'd requests and replay them
// once the new token arrives.
```

### 4.4 File: `cms/src/auth/LoginPage.tsx` — UI Specification

**Visual requirements:**
- Centered card on a neutral gray background (`bg-gray-50`)
- Company logo at top (placeholder `<img>` tag for now)
- Email input: `type="email"`, `autocomplete="email"`, required, with validation
- Password input: `type="password"`, `autocomplete="current-password"`, required
- "Sign In" button: `bg-blue-600 hover:bg-blue-700 text-white`, full width
- Error message: red text below form, generic message ("Invalid email or password")
- Loading state: button disabled + spinner during API call

**Behavior:**
1. On submit, call `login(email, password)` from `useAuth` hook.
2. `login()` sends `POST /api/v1/auth/login` with `{ email, password }`.
3. On success: store access token in memory, redirect to `/dashboard`.
4. On failure: show generic error (NEVER reveal if email exists).
5. Disable submit button for 2 seconds after a failed attempt (client-side throttle).

**Security:**
- `novalidate` is NOT set — rely on HTML5 validation as first line.
- Trim and lowercase email before sending.
- Do NOT log credentials to console, even in development.

### 4.5 File: `cms/src/auth/ProtectedRoute.tsx` — Specification

```tsx
// Wrapper component that checks useAuth().isAuthenticated
// If not authenticated → redirect to /login (React Router Navigate)
// If authenticated → render children
// Optionally accept `allowedRoles: UserRole[]` prop to enforce RBAC on frontend
// (Backend RBAC is the real gate — this is just UX convenience)
```

### 4.6 File: `cms/src/auth/useAuth.ts` — Hook API

```typescript
interface AuthState {
  user: { id: string; email: string; role: "admin" | "marketing" | "inventory" } | null;
  isAuthenticated: boolean;
  isLoading: boolean;  // true during initial silent refresh
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

---

## 5. Refresh Token Cookie Configuration (M5 Must Set)

When M5's `/auth/login` or `/auth/refresh` returns a refresh token, it MUST be set as a cookie with these exact attributes:

```python
response.set_cookie(
    key="refresh_token",
    value=refresh_token_string,
    httponly=True,         # JavaScript cannot access
    secure=True,           # Only sent over HTTPS (set False for localhost dev)
    samesite="strict",     # Prevents CSRF
    max_age=7 * 24 * 3600, # 7 days in seconds
    path="/api/v1/auth",   # Only sent to auth endpoints
)
```

> **For local development:** Set `secure=False` when `NODE_ENV=development`. Check `os.getenv("NODE_ENV")` to toggle.

---

## 6. Account Lockout Flow

```
Login attempt with wrong password
         │
         ▼
Increment failed_login_attempts in users collection
         │
         ▼
If failed_login_attempts >= 10:
    Set locked_until = now + 15 minutes
    Return 401 "Account temporarily locked"
         │
         ▼
On next login attempt:
    If locked_until is set AND now < locked_until:
        Return 401 "Account temporarily locked. Try again later."
        (Do NOT increment counter during lockout)
    If locked_until is set AND now >= locked_until:
        Reset failed_login_attempts = 0
        Clear locked_until = null
        Proceed with normal login
         │
         ▼
On SUCCESSFUL login:
    Reset failed_login_attempts = 0
    Clear locked_until = null
```

---

## 7. Refresh Token Rotation

When a refresh token is used (at `/api/v1/auth/refresh`):

1. Decode the old refresh token and extract `sub` (user ID).
2. Generate a **new** refresh token.
3. Return new access token in JSON body.
4. Set new refresh token in HttpOnly cookie (replaces old one).
5. The old refresh token is now effectively invalidated by being replaced.

> **Future enhancement (not V1):** Store refresh token hashes in a DB collection for explicit revocation and reuse detection.

---

## 8. Logout Flow

- **Backend:** `POST /api/v1/auth/logout` — clears the refresh token cookie by setting it with `max_age=0`.
- **Frontend:** Clear `accessToken` ref, clear `user` state, redirect to `/login`.

---

## 9. Checklist Before Marking M2 Complete

- [ ] `hashing.py`: `hash_password` and `verify_password` work correctly with bcrypt cost 12.
- [ ] `jwt.py`: Fails loudly if `JWT_SECRET_KEY` is missing or too short.
- [ ] `jwt.py`: Access tokens contain `sub`, `role`, `type: "access"`, `iat`, `exp`.
- [ ] `jwt.py`: Refresh tokens contain `sub`, `type: "refresh"`, `iat`, `exp`.
- [ ] `dependencies.py`: Validates token type, user existence, and active status.
- [ ] `dependencies.py`: `require_role` factory works as a Depends().
- [ ] `rate_limit.py`: Sliding window works correctly for login route.
- [ ] `LoginPage.tsx`: Renders, validates input, calls API, handles errors.
- [ ] `AuthProvider.tsx`: Silent refresh on mount works.
- [ ] `client.ts`: Axios interceptor retries on 401 with refreshed token.
- [ ] `ProtectedRoute.tsx`: Redirects unauthenticated users to `/login`.
- [ ] No credentials logged anywhere (console, network, files).
- [ ] Generic error messages on login failure (no email enumeration).
