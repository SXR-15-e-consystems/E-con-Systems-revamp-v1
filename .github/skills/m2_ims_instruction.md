# Module 2: Identity Management System (IMS) Instructions

## 🎯 Objective

Implement a secure, scalable, custom JWT-based authentication system from scratch.

## 🔐 Scope of Work

Since M5 (FastAPI) handles the route definitions, your job is to build the core security utility functions and the M3 Auth UI.

### Backend Responsibilities (Python):

1. Write the `security.py` module for FastAPI.
2. Implement `pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")`.
3. Create `create_access_token` and `create_refresh_token` functions using `PyJWT`. Access tokens expire in 15 minutes, Refresh tokens in 7 days.
4. Write the authentication dependency that extracts the Bearer token from headers, decodes it, checks the MongoDB `users` collection, and verifies the `role`.

### Frontend Responsibilities (React/M3):

1. Build the Admin Login Screen component using Tailwind.
2. Build an Axios/Fetch interceptor that automatically attaches the JWT `access_token` to all requests to `api/v1/cms/*`.
3. Handle automatic token refresh when a 401 Unauthorized is returned.
