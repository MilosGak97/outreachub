# Auth Module

Complete authentication system for the client API. Handles registration, email verification, login, password management, JWT sessions, and company profile setup.

---

## Overview

| Concern | Implementation |
|---------|---------------|
| Token format | HS256 JWT (access + refresh pair) |
| Token transport | httpOnly cookies (`accessToken`, `refreshToken`) |
| Token persistence | `Token` DB table — enables server-side invalidation |
| Password hashing | bcrypt, 10 rounds |
| Strategy | `passport-jwt` extracting from cookie |
| Session tokens | Opaque prefixed strings passed via `Authorization` header |
| Multi-tenancy | `companyId` in JWT payload + propagated to CLS |

---

## File Structure

```
auth/
├── auth.controller.ts          # All auth endpoints
├── auth.module.ts              # Module config, providers, exports
├── README.md                   # This file
├── constants/
│   └── auth.constants.ts       # Token TTLs, cookie config, code config, rate limits
├── decorators/
│   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   └── index.ts
├── dto/
│   ├── requests/               # Incoming request shapes
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   ├── verify-email.dto.ts
│   │   ├── resend-verification.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   ├── verify-reset-password.dto.ts
│   │   ├── reset-password.dto.ts
│   │   ├── change-password.dto.ts
│   │   ├── update-company-profile.dto.ts
│   │   └── index.ts
│   └── responses/              # Outgoing response shapes
│       ├── auth-response.dto.ts
│       ├── user-response.dto.ts
│       └── index.ts
├── guards/
│   ├── auth.guard.ts           # Require valid JWT; sets CLS companyId
│   ├── optional-auth.guard.ts  # JWT optional — user may be null
│   ├── email-verified.guard.ts # Require emailVerified === true
│   ├── company-required.guard.ts  # Require user.company exists
│   └── index.ts
├── services/
│   ├── auth.service.ts         # Core auth logic (register, login, verify, reset…)
│   ├── token.service.ts        # JWT sign/verify, DB persistence, rotation
│   └── index.ts
└── strategies/
    └── jwt.strategy.ts         # Passport strategy — cookie extraction + DB user load
```

---

## Auth Flows

### 1. Registration + Email Verification

```
Client                         Server                         Email
  │                              │                              │
  │── POST /register ──────────► │                              │
  │   { email, password,         │  create Company + User       │
  │     firstName, lastName,     │  status: NEW_REGISTER        │
  │     companyName }            │  emailVerified: false        │
  │                              │  generate vt_<random> token  │
  │                              │  hash & store 6-digit code   │
  │ ◄── { verificationToken,     │──── send signup email ──────►│
  │        retryAfter: 60 }      │                              │
  │                              │                              │
  │   (store verificationToken)  │                              │
  │                              │                              │
  │── GET /verification/status ► │                              │
  │   Authorization: VerificationToken <vt_...>                 │
  │ ◄── { retryAfter, expiresIn, email }                        │
  │                              │                              │
  │── POST /verify ────────────► │                              │
  │   Authorization: VerificationToken <vt_...>                 │
  │   { code: "123456" }         │  bcrypt.compare(code, hash)  │
  │                              │  user.emailVerified = true   │
  │                              │  status → ACTIVE             │
  │                              │  clear vt_ + passcode fields │
  │                              │  generate + save token pair  │
  │ ◄── { accessToken,           │                              │
  │        refreshToken }        │                              │
  │   Set-Cookie: accessToken    │                              │
  │   Set-Cookie: refreshToken   │                              │
```

If the user needs a new code: `POST /verification/resend` with the same `verificationToken` header.
Cooldown: **60 seconds**. The verificationToken itself expires in **15 minutes**.

---

### 2. Login

```
Client                         Server
  │                              │
  │── POST /login ─────────────► │
  │   { email, password }        │  look up user by email
  │                              │  check hasStoredPassword guard
  │                              │  bcrypt.compare(password, hash)
  │                              │  check SUSPENDED / DELETED
  │                              │
  │                        ┌─────┴────────────────────────────┐
  │                        │ emailVerified?                    │
  │                        │                                  │
  │                     YES│                               NO │
  │                        │                                  │
  │                        │  generate token pair             │  rebuild or start
  │                        │  save to DB                      │  verification session
  │ ◄── { accessToken,     │                                  │
  │        refreshToken }  │           ◄── { error: "EMAIL_NOT_VERIFIED",
  │   Set-Cookie: tokens   │                 verificationToken, retryAfter }
  │                        └──────────────────────────────────┘
```

Unverified users are redirected into the email verification flow with a fresh `verificationToken`.

---

### 3. Password Reset

```
Client                         Server                         Email
  │                              │                              │
  │── POST /forgot-password ───► │  always returns same message │
  │   { email }                  │  (enumeration prevention)    │
  │                              │  if user exists + verified:  │
  │                              │    store rpt_<random> token  │
  │                              │    hash & store 6-digit code │
  │ ◄── { resetPasswordToken,    │──── send reset email ───────►│
  │        message }             │                              │
  │                              │                              │
  │── GET /reset-password/status►│                              │
  │   Authorization: ResetToken <rpt_...>                       │
  │ ◄── { retryAfter, expiresIn, email }                        │
  │                              │                              │
  │── POST /verify-reset-password►│                             │
  │   Authorization: ResetToken <rpt_...>                       │
  │   { code: "123456" }         │  validates code only         │
  │ ◄── { message: "Reset code verified." }                     │
  │                              │                              │
  │── POST /reset-password ────► │                              │
  │   Authorization: ResetToken <rpt_...>                       │
  │   { code, newPassword }      │  re-validate code            │
  │                              │  hash new password           │
  │                              │  clear reset fields          │
  │                              │  invalidate ALL sessions     │
  │ ◄── { message }              │                              │
```

If user needs a new code: `POST /reset-password/resend`. Cooldown: **60 seconds**. Token expires in **30 minutes**.

---

### 4. Token Refresh

```
Client                         Server
  │                              │
  │── POST /refresh ───────────► │  read refreshToken cookie
  │   Cookie: refreshToken=...   │  jwt.verify(token, secret)
  │                              │  check Token table: ACTIVE + not expired
  │                              │  check user: exists + ACTIVE + emailVerified
  │                              │  invalidate old refresh token
  │                              │  generate new token pair
  │                              │  save new tokens to DB
  │ ◄── { success: true,         │
  │        accessToken,          │
  │        refreshToken }        │
  │   Set-Cookie: tokens (new)   │
```

---

## Token Architecture

### JWT Payload

```typescript
interface JwtPayload {
  userId: string;
  companyId?: string; // present when user has a company
  iat: number;        // issued-at (auto-added by jsonwebtoken)
  exp: number;        // expiry (auto-added by jsonwebtoken)
}
```

### Dual Validation Pipeline

Tokens pass **two** independent checks on every request:

```
Request with Cookie
       │
       ▼
  JwtStrategy.validate()
  ├── jwt.verify(token, secret)      ← cryptographic check
  ├── userRepo.findOne(payload.userId) ← DB existence check
  ├── user.status === ACTIVE          ← account status check
  └── payload.companyId === user.company.id  ← tenant check
       │
       ▼
  (for protected DB operations)
  TokenService.validateToken()
  ├── jwt.verify()                   ← cryptographic check (again)
  ├── tokenRepo.findOne({ token, type, status: ACTIVE })  ← DB record check
  └── tokenEntity.expiresAt >= now   ← DB expiry check
```

The second layer (DB record) allows **immediate server-side invalidation** — logging out or resetting a password makes tokens invalid instantly even though the JWT hasn't expired.

### DB Token States

| Status | Meaning |
|--------|---------|
| `ACTIVE` | Valid and usable |
| `INACTIVE` | Explicitly revoked (logout, password reset) |
| `EXPIRED` | Detected expired during validation; updated lazily |

---

## Guards Reference

Import from `./guards` (or the module export for other modules).

| Guard | Class | When to use |
|-------|-------|-------------|
| `AuthGuard` | extends `PassportAuthGuard('jwt')` | Any endpoint requiring a logged-in user. Throws `401` if no valid token. Also sets `cls.companyId`. |
| `OptionalAuthGuard` | extends `PassportAuthGuard('jwt')` | Endpoints that behave differently for authenticated vs anonymous users. Never throws — `request.user` is `null` if unauthenticated. |
| `EmailVerifiedGuard` | `CanActivate` | Use **after** `AuthGuard`. Throws `403` if `user.emailVerified !== true`. |
| `CompanyRequiredGuard` | `CanActivate` | Use **after** `AuthGuard`. Throws `403` if `user.company` is missing. |

### Stacking Example

```typescript
// Requires: valid JWT + verified email + company attached
@UseGuards(AuthGuard, EmailVerifiedGuard, CompanyRequiredGuard)
```

Guards execute in array order. `AuthGuard` must come first since the others read `request.user` that it attaches.

---

## Decorators

### `@CurrentUser()`

Extracts the full user object (or a single property) from `request.user`.

```typescript
// Inject full user
@Get('profile')
@UseGuards(AuthGuard)
getProfile(@CurrentUser() user: User) { ... }

// Inject a single property
@Get('email')
@UseGuards(AuthGuard)
getEmail(@CurrentUser('email') email: string) { ... }
```

`request.user` is populated by `JwtStrategy.validate()` and is a fresh DB entity including the `company` relation.

---

## Cookie & Header Mechanics

### Auth Cookies (access + refresh tokens)

Set automatically on login, email verification, and token refresh. Cleared on logout.

| Cookie | Value | Max-Age |
|--------|-------|---------|
| `accessToken` | JWT | 1 hour |
| `refreshToken` | JWT | 30 days |

Both cookies share the same config:

```
httpOnly: true      — not accessible from JavaScript
secure:   true      — HTTPS only (in production or when sameSite=none)
sameSite: lax       — default; 'none' in production for cross-site requests
path:     /
```

### Authorization Header (session tokens)

Email verification and password reset use **short-lived opaque session tokens** that are passed as a custom Authorization scheme instead of cookies. This keeps them out of the cookie jar so they don't interfere with normal auth state.

```
# Verification session
Authorization: VerificationToken vt_<48 hex chars>

# Password reset session
Authorization: ResetToken rpt_<48 hex chars>
```

The controller extracts and validates the scheme prefix before passing the raw token to the service. An invalid prefix or missing header returns `400`.

---

## Security Design Notes

**Enumeration prevention** — `POST /forgot-password` always returns the same success response and `resetPasswordToken` regardless of whether the email exists or the account is verified. The token is simply not linked to any user when the account isn't found.

**Token rotation** — Each call to `POST /refresh` invalidates the old refresh token and issues a brand-new pair. Stolen refresh tokens cannot be silently reused after a legitimate rotation.

**Password reset wipes all sessions** — `resetPassword()` calls `tokenService.invalidateAllUserTokens()` after the password change, forcing re-authentication on all devices.

**bcrypt** — Passwords and passcodes (OTPs) are hashed with bcrypt at cost factor **10**. The raw passcode is never stored.

**CLS multi-tenancy** — `AuthGuard.canActivate()` writes `user.company.id` into `ClsService` after a successful authentication. Downstream services read `companyId` from CLS to scope DB queries without it needing to be threaded through every function signature.

**Account status enforcement** — `JwtStrategy.validate()` only allows `UserStatus.ACTIVE`. `NEW_REGISTER`, `SUSPENDED`, and `DELETED` accounts are blocked even if they hold a valid JWT.

**No Authorization Bearer for auth tokens** — `JwtStrategy` is configured to extract tokens exclusively from the `accessToken` cookie. `Authorization: Bearer` headers are not accepted, reducing XSS token-theft surface.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLIENT_JWT_SECRET_V2` | **Yes** | — | HMAC-SHA256 secret for signing JWTs. Server refuses to start if missing. |
| `NODE_ENV` | No | — | Set to `production` to auto-enable `secure: true` and `sameSite: none` cookies. |
| `AUTH_COOKIE_SAMESITE` | No | `lax` (dev) / `none` (prod) | Override cookie `sameSite`. Valid values: `lax`, `strict`, `none`. |
| `AUTH_COOKIE_SECURE` | No | Auto from `NODE_ENV` | Set to `"true"` to force `secure` flag regardless of environment. |
| `AUTH_COOKIE_DOMAIN` | No | Not set | Explicit cookie domain (e.g. `.example.com` for subdomain sharing). |

---

## Constants Quick Reference

```
── JWT ──────────────────────────────────────────────
ACCESS_TOKEN expiry          1h  (1 hour)
REFRESH_TOKEN expiry         30d (30 days)
JWT algorithm                HS256
JWT secret env key           CLIENT_JWT_SECRET_V2

── Email Verification ───────────────────────────────
Code length                  6 digits
Code expiry                  15 minutes
Token expiry                 15 minutes
Resend cooldown              60 seconds
Max attempts                 5

── Password Reset ───────────────────────────────────
Code length                  6 digits
Code expiry                  30 minutes
Token expiry                 30 minutes
Resend cooldown              60 seconds
Max attempts                 5

── Session Token Prefixes ───────────────────────────
Verification token           vt_
Reset password token         rpt_

── Rate Limits (per minute) ─────────────────────────
/register                    5
/login                       10
/forgot-password             3
/verify                      10
/verification/resend         3
```

---

## Enums

**`UserStatus`:** `NEW_REGISTER` → `ACTIVE` | `SUSPENDED` | `DELETED`

**`UserRole`:** `HEAD` (company owner, assigned on self-registration) | `SALES` (regular member)

**`UserType`:** `USER` (self-registered) | _(other types may be added for invited members)_

**`TokenType`:** `ACCESS` | `REFRESH` | `EMAIL_VERIFICATION` | `FORGOT_PASSWORD`

**`TokenStatus`:** `ACTIVE` | `INACTIVE` | `EXPIRED`
