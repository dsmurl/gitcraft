# API Routes

Base URL (default): `http://localhost:3001`

Note: You can change the port using `API_PORT` in your environment.

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

These routes exercise a simple in-memory counter that can be configured via API.

- GET `/api/test/ping`
  - Simple connectivity check.
  - Response: `{ "ok": true }`

- GET `/api/test/count`
  - Returns the current counter value and increments it for the next call.
  - Response example:
    ```json
    { "count": 5, "next": 6 }
    ```

- GET `/api/test/settings`
  - Returns the current counter settings.
  - Response example:
    ```json
    { "value": 10, "step": 2 }
    ```

- POST `/api/test/settings`
  - Updates counter settings. Body fields are optional; only provided fields are updated.
  - Request body (JSON):
    ```json
    {
      "value": 100, // optional number
      "step": 5 // optional number (non-zero)
    }
    ```
  - Response example:
    ```json
    { "value": 100, "step": 5 }
    ```

## Environment Variables

- `API_PORT` — Port for the API server (default `3001`).
- `COUNTER_INITIAL` — Initial counter value (default `0`).
- `COUNTER_STEP` — Increment step per call (default `1`, must be non-zero).

You can place these in an env file for your API app (e.g., `.env.local`) or export them in your shell before starting the server.

## Quick Examples

- Health:

  ```bash
  curl http://localhost:3001/health
  ```

- Get and increment count:

  ```bash
  curl http://localhost:3001/api/test/count
  ```

- Read current settings:

  ```bash
  curl http://localhost:3001/api/test/settings
  ```

- Update settings:
  ```bash
  curl -X POST http://localhost:3001/api/test/settings \
       -H "Content-Type: application/json" \
       -d '{"value": 42, "step": 3}'
  ```
