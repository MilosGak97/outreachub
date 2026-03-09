# Auth Module

Complete authentication system for the client API. Handles registration, email verification, login, password management, JWT sessions, and team invites.

---

## Directory Structure

```
auth/
├── auth.controller.ts          # All auth endpoints
├── auth.module.ts              # Module config, imports, exports
├── constants/
│   └── auth.constants.ts       # Token expiry, cookie config, code lengths
├── decorators/
│   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   └── index.ts
├── dto/
│   ├── requests/               # Incoming request shapes (no invite/session DTOs)
│   └── responses/              # Outgoing response shapes
├── guards/
│   ├── auth.guard.ts           # Require authenticated user
│   ├── optional-auth.guard.ts  # Auth optional, user may be null
│   ├── email-verified.guard.ts # Require emailVerified === true
│   ├── company-required.guard.ts  # Require user.company exists
│   └── index.ts
├── services/
│   ├── auth.service.ts         # Core auth logic
│   ├── token.service.ts        # JWT generation, validation, storage
│   └── index.ts
└── strategies/
    └── jwt.strategy.ts         # Passport JWT strategy
```

---

## Auth Flow Overview

```
Registration ──► Email Verification ──► Authenticated
                                             │
                                        Login ◄───── Forgot Password
                                             │
                                         Refresh
```

---

## Endpoints

### Registration

#### `POST /client/auth/register`

Creates a new user and company, sends email verification code.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass1!",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Inc"
}
```

**Response:**
```json
{
  "verificationToken": "vt_...",
  "retryAfter": 60
}
```

After registration, user status is `NEW_REGISTER` and `emailVerified` is `false`. A 6-digit passcode is sent to the email.

---

### Email Verification

#### `GET /client/auth/verification/status`

Returns current verification state.

**Header:** `Authorization: VerificationToken <token>`

**Response:**
```json
{
  "retryAfter": 45,
  "expiresIn": 840,
  "email": "user@example.com"
}
```

#### `POST /client/auth/verify`

Submits the 6-digit code. On success sets user to `ACTIVE`, marks `emailVerified = true`, and issues auth cookies.

**Header:** `Authorization: VerificationToken <token>`

**Request:**
```json
{ "code": "123456" }
```

**Response:**
```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

#### `POST /client/auth/verification/resend`

Resends verification code. Enforces 60-second cooldown.

**Header:** `Authorization: VerificationToken <token>`

---

### Login

#### `POST /client/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass1!"
}
```

**Success response** (verified user):
```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

**Email not verified response:**
```json
{
  "error": "EMAIL_NOT_VERIFIED",
  "verificationToken": "vt_...",
  "retryAfter": 60
}
```

- Suspended or deleted users receive `401`.
- Unverified users get a verification token to resume the verification flow.

---

### Token Refresh

#### `POST /client/auth/refresh`

Reads refresh token from cookie, rotates it, and issues a new token pair.

- Old refresh token is invalidated.
- New tokens are saved to the database.
- Auth cookies are updated.

**Response:**
```json
{
  "success": true,
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

### Password Reset

#### `POST /client/auth/forgot-password`

**Request:**
```json
{ "email": "user@example.com" }
```

Returns a `resetPasswordToken` if the user exists and is verified. Always returns a generic message to prevent enumeration.

#### `GET /client/auth/reset-password/status`

**Header:** `Authorization: ResetToken <token>`

#### `POST /client/auth/verify-reset-password`

Validates the 6-digit code without changing anything.

**Header:** `Authorization: ResetToken <token>`

**Request:** `{ "code": "123456" }`

#### `POST /client/auth/reset-password/resend`

Resends reset code. Enforces 60-second cooldown.

**Header:** `Authorization: ResetToken <token>`

#### `POST /client/auth/reset-password`

Finalizes the reset. Invalidates **all** existing sessions for security.

**Header:** `Authorization: ResetToken <token>`

**Request:**
```json
{
  "code": "123456",
  "newPassword": "NewPass1!"
}
```

---

### Authenticated Endpoints

All require `AuthGuard`.

#### `GET /client/auth/who-am-i`

Returns the current user profile including company info.

#### `POST /client/auth/logout`

Invalidates current session tokens and clears auth cookies.

#### `POST /client/auth/logout-all`

Invalidates **all** sessions for the user (all devices).

#### `POST /client/auth/change-password`

**Request:**
```json
{
  "currentPassword": "OldPass1!",
  "newPassword": "NewPass1!"
}
```

#### `PATCH /client/auth/company-profile`

Requires `AuthGuard + EmailVerifiedGuard + CompanyRequiredGuard`.

**Request (all fields optional):**
```json
{
  "name": "Acme Corp",
  "website": "https://acme.com",
  "email": "hello@acme.com",
  "phoneCountryCode": "US",
  "phoneNumber": "5551234567",
  "logoUrl": "https://..."
}
```

---

## Guards

| Guard | Usage | Effect |
|-------|-------|--------|
| `AuthGuard` | `@UseGuards(AuthGuard)` | Validates JWT, attaches user, sets CLS companyId |
| `OptionalAuthGuard` | `@UseGuards(OptionalAuthGuard)` | Same as above but doesn't throw on missing/invalid token |
| `EmailVerifiedGuard` | After `AuthGuard` | Throws `403` if `user.emailVerified !== true` |
| `CompanyRequiredGuard` | After `AuthGuard` | Throws `403` if `user.company` is missing |

---

## Decorators

### `@CurrentUser()`

Extracts the authenticated user from the request.

```typescript
@Get('profile')
@UseGuards(AuthGuard)
getProfile(@CurrentUser() user: User) { ... }

// Access a specific property
@Get('email')
@UseGuards(AuthGuard)
getEmail(@CurrentUser('email') email: string) { ... }
```

---

## Token Strategy

**Access Token:** 1 hour · Extracted from `accessToken` cookie · HS256

**Refresh Token:** 30 days · Extracted from `refreshToken` cookie · Rotated on each refresh

**Cookies:** `httpOnly: true`, `secure: true` in production, `sameSite: lax` by default.

**JWT Payload:**
```typescript
{
  userId: string;
  companyId?: string;
  iat: number;
  exp: number;
}
```

All tokens are persisted in the `Token` table with a `status` field (`ACTIVE | INACTIVE | EXPIRED`) enabling server-side invalidation.

---

## Key Constants

```
ACCESS_TOKEN expiry    1 hour
REFRESH_TOKEN expiry   30 days

Verification code      6 digits, 15 min expiry, 60s resend cooldown
Reset code             6 digits, 30 min expiry, 60s resend cooldown

JWT secret env key     CLIENT_JWT_SECRET_V2
```

---

## Enums

**UserStatus:** `NEW_REGISTER` → `ACTIVE` | `SUSPENDED` | `DELETED`

**UserRole:** `HEAD` (owner/admin) | `SALES` (regular member)

**TokenType:** `ACCESS` | `REFRESH` | `EMAIL_VERIFICATION` | `FORGOT_PASSWORD`

---

## Security Notes

- Passwords hashed with bcrypt (10 rounds).
- Password reset invalidates all existing sessions.
- Verification/reset tokens use opaque prefixed strings (`vt_`, `rpt_`) stored hashed.
- `companyId` stored in JWT and CLS for multi-tenant query isolation.
- Forgot-password endpoint returns a generic message to prevent user enumeration.
- `SUSPENDED` and `DELETED` users are blocked at login.
- Rate limits configured per endpoint (e.g. 5 registrations/min, 3 forgot-password/min).

