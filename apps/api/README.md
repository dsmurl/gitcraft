# API Routes

Base URL (default): `http://localhost:3001`

Note: Change the port with `API_PORT`. Configure allowed CORS origins via `API_WEB_ORIGINS` (comma-separated).

## Health

- GET `/health`
  - Returns a simple health payload for the API service.
  - Response example:
    ```json
    { "ok": true, "service": "api", "time": "2024-01-01T00:00:00.000Z" }
    ```

## Root

- GET `/`
  - Plain text message indicating the API is running and suggesting example routes.

## API Root

- GET `/api`
  - Returns a basic JSON payload confirming the API root.
  - Response example:
    ```json
    { "ok": true, "message": "API root" }
    ```

## Test Routes (`/api/test`)

- GET `/api/test/ping`
  - Public connectivity check.
  - Response: `{ "ok": true }`

- GET `/api/test/private`
  - Protected; requires a valid Clerk bearer token (`Authorization: Bearer <token>`).
  - Response example:
    ```json
    {
      "ok": true,
      "userId": "user_123",
      "sessionId": "sess_abc",
      "orgId": "org_456"
    }
    ```

## User Routes (`/api/user`)

All user routes require authentication via Clerk bearer token.

- GET `/api/user/me`
  - Returns the current user's record from the database.
  - Response example:
    ```json
    {
      "ok": true,
      "user": {
        /* user fields */
      }
    }
    ```

- POST `/api/user/ensure`
  - Upserts the current user's record.
  - Request body (JSON; all optional, server will backfill from Clerk when missing):
    ```json
    { "firstName": "Jane", "lastName": "Doe", "companyName": "Acme Inc." }
    ```
  - Response example:
    ```json
    {
      "ok": true,
      "user": {
        /* user fields */
      }
    }
    ```

- PATCH `/api/user/me`
  - Updates editable fields on the current user's record.
  - Request body (JSON; provide at least one):
    ```json
    { "firstName": "Jane", "lastName": "Doe", "companyName": "Acme Inc." }
    ```
  - Response example:
    ```json
    {
      "ok": true,
      "user": {
        /* updated user fields */
      }
    }
    ```

## Authentication

Protected endpoints use Clerk. Send a bearer token:
