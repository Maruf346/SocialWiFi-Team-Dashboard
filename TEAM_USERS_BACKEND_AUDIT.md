# Manage Team Users: backend handoff

The frontend is wired to the API base configured by `VITE_API_BASE_URL` and sends the authenticated access token as `Authorization: Bearer <token>`.

## Required endpoint contracts

### List and sort users

`GET /api/v1/team-dashboard/manage/team-users/`

Supported query parameters:

- `page` and `page_size`
- `search` (name or email)
- `enrolled` (`yes` or `no`)
- `ordering=first_name`

The backend must apply alphabetical ordering before pagination. Sorting only the current page in the browser cannot guarantee that the complete list is in first-name order.

Expected response shape:

```json
{
  "results": [
    {
      "id": 123,
      "user_id": 456,
      "name": "First Last",
      "email": "driver@example.com",
      "is_enrolled": false,
      "enrolled_display": "No"
    }
  ],
  "pagination": {
    "total_count": 16,
    "total_pages": 1,
    "has_previous": false,
    "has_next": false
  },
  "plan_stats": {
    "max_members": 100,
    "total_in_list": 16,
    "enrolled_count": 10,
    "slots_remaining": 84
  }
}
```

### Add users

`POST /api/v1/team-dashboard/manage/team-users/`

```json
{
  "users": [
    { "name": "First Last", "email": "driver@example.com" }
  ]
}
```

This endpoint should validate every row, enforce plan capacity, reject or clearly report duplicates, and return a useful `message`. The frontend CSV flow parses the file and previews the rows, then submits them through this same batch endpoint when the owner clicks ADD. Adding users must not implicitly send invitations unless that is explicitly retained as a product rule; SEND INVITE is a separate selected-user action.

### Edit one user

`PATCH /api/v1/team-dashboard/manage/team-users/{member_id}/`

```json
{ "name": "Updated Name", "email": "updated@example.com" }
```

Return the updated member or a success message. Reject an email already assigned to another member.

### Remove selected users

`POST /api/v1/team-dashboard/manage/team-users/remove/`

```json
{ "member_ids": [123, 124] }
```

### Send selected invitations (required to fix email sending)

`POST /api/v1/team-dashboard/manage/team-users/send-invite/`

```json
{ "member_ids": [123, 124] }
```

The endpoint should:

1. Confirm the requesting user owns the team and every supplied member belongs to it.
2. Queue one invitation email per selected member using the configured transactional email provider.
3. Generate a signed, expiring enrollment link and avoid exposing tokens in the response or logs.
4. Support safe retries/idempotency so double-clicks do not create duplicate emails.
5. Record `invite_sent_at`, delivery/queue state, and failure detail for operational support.
6. Return a summary such as:

```json
{
  "message": "2 invitations queued",
  "queued_count": 2,
  "failed_count": 0,
  "failures": []
}
```

If partial failures are possible, return per-member failures while still using a successful HTTP status for the queued subset. Use `400` for invalid input, `403` for ownership/permission failure, `404` when no matching members exist, `409` for an invalid enrollment state, and `503` when the mail provider/queue is unavailable.

### Download all visible-list data

`GET /api/v1/team-dashboard/manage/team-users/download/`

Return `text/csv` with a `Content-Disposition: attachment; filename="team_users_export.csv"` header. Confirm with product whether “all names shown” means the complete team or the active filter/search result. The current frontend calls this endpoint without filter parameters, preserving the existing behavior.

## Integration checklist

- Allow the frontend origin in CORS and allow the `Authorization` header.
- Ensure all endpoints use the same member identifier exposed as `results[].id`.
- Run email delivery through a background queue; configure sender domain, credentials, templates, and bounce handling in each environment.
- Add tests for alphabetical ordering across page boundaries, CSV-sized batch creation, duplicate emails, plan limits, unauthorized member IDs, partial mail-provider failure, and repeated invite requests.
- The older `/team-users/import/` upload endpoint is no longer required by this page because importing now previews rows before ADD, as requested. It may remain for other clients.
