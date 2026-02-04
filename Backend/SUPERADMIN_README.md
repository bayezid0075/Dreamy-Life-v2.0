# Superadmin Panel

The superadmin panel is a live control panel restricted to specific emails.

## Setup

1. **Allowlist:** In your `.env` (or environment), set:

   ```
   SUPERADMIN_ALLOWED_EMAILS=admin@example.com,super@yourdomain.com
   ```

   Only these emails (case-insensitive) can access `/superadmin` and the superadmin API.

2. **Access:** Users must be logged in. If their email is not in the list, they see an "ACCESS DENIED" warning.

## API

- `GET /api/superadmin/access/` — Check if current user is allowed (requires JWT).
- `GET /api/superadmin/overview/` — Overview stats (superadmin only).
- `GET /api/superadmin/stream/?token=ACCESS_TOKEN` — SSE stream for live overview updates.
- `GET/POST /api/superadmin/users/` — List/create users (paginated).
- `GET/PATCH/DELETE /api/superadmin/users/<id>/` — Get/update/delete user.

## Frontend

- URL: `/superadmin` (after login).
- Tabs: **Overview** (live metrics + recent users), **User Control** (search, filter, activate/deactivate, delete).
