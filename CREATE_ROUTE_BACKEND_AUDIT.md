# Create Route visibility: backend handoff

## Finding

The dashboard frontend matches the current OpenAPI contract:

1. `GET /api/v1/team-dashboard/manage/team-users/` returns both the team-member `id` and app-user `user_id`.
2. The frontend deliberately passes `user_id` when opening a driver's Route History.
3. Create Route calls `POST /api/v1/team-dashboard/manage/team-users/{user_id}/routes/` with `TeamRouteCreateRequest`.
4. Dashboard Route History calls `GET /api/v1/team-dashboard/manage/route-history/?user_id={user_id}`.
5. The driver app calls `GET /api/v1/route/` using that driver's token.

Therefore, if the create call returns `201` but the route is absent from both histories, the backend is either assigning the route to the owner instead of the selected driver, not committing the route, or excluding the created status in one or both list querysets.

## Required create behavior

Endpoint:

`POST /api/v1/team-dashboard/manage/team-users/{user_id}/routes/`

The backend must resolve the selected driver within the requesting owner's team, then create the normal app `Route` record with the selected driver as its owner. It must not assign the route to `request.user` merely because the owner made the request.

Illustrative Django/DRF logic:

```python
from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

@transaction.atomic
def create(self, request, user_id=None):
    membership = TeamMember.objects.select_related("user", "team").filter(
        team__owner=request.user,
        user_id=user_id,
        is_active=True,
    ).first()
    if not membership:
        raise NotFound("Driver is not an active member of this team.")

    serializer = TeamRouteCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    route = serializer.save(
        user=membership.user,       # critical: selected driver
        team=membership.team,       # if Route has a team relation
        created_by=request.user,    # audit field only; not route ownership
        status="DRAFT",
        is_completed=False,
    )

    return Response(
        {"success": True, "message": "Route created.", "route_id": route.id},
        status=201,
    )
```

Adapt the model and membership field names to the backend project. The essential invariant is:

```text
created_route.user_id == URL user_id
```

If unenrolled team entries have no real app user yet, return a clear `409` rather than creating an ownerless route. Alternatively, create/link the app user during enrollment and only allow route creation once `is_enrolled=true`.

## Nested data transaction

The create payload may contain both route-level waypoints and structured `permits[].waypoints`. The backend should create the route, permits, and waypoints inside one database transaction. A nested validation or save failure must roll back the route and return a non-2xx response; it must not return `201` for a partially saved or unsaved route.

The response must match `TeamRouteMutationResponse`:

```json
{
  "success": true,
  "message": "Route created successfully.",
  "route_id": 321
}
```

## Required list-query behavior

### Driver app

`GET /api/v1/route/`

The authenticated driver's queryset must include dashboard-created routes:

```python
Route.objects.filter(user=request.user)
```

Do not filter solely by `created_by=request.user`, because a dashboard-created route has the owner/admin as its creator but the driver as its owner. Without an explicit `status` query parameter, the endpoint should return every non-deleted route status, including `DRAFT`.

### Team dashboard

`GET /api/v1/team-dashboard/manage/route-history/?user_id={user_id}`

The queryset must first be restricted to the requester's team and then filtered by route ownership:

```python
Route.objects.filter(
    team=requesting_team,
    user_id=request.query_params["user_id"],
)
```

If Route does not have a direct team field, scope through the active membership while still filtering `Route.user_id`. Do not compare the query parameter with `TeamMember.id`; the schema defines it as the app user's ID.

The dashboard schema declares an array response. Keep returning a JSON array unless the OpenAPI schema and frontend are changed together.

## Tests the backend must add

1. Owner creates a route for driver B and receives `201` with a real `route_id`.
2. The stored route's `user_id` equals driver B's app-user ID, not the owner's ID and not `TeamMember.id`.
3. Driver B sees that route in `GET /api/v1/route/`.
4. The owner sees it in `GET /team-dashboard/manage/route-history/?user_id=<driver B user id>`.
5. Driver C and another team owner cannot see the route.
6. Creating for a user outside the owner's team returns `404` or `403` and creates nothing.
7. Creating for an unenrolled/unlinked member returns `409` and creates nothing.
8. A nested permit/waypoint failure rolls back the entire transaction.
9. `DRAFT` routes appear when the app list is requested without a status filter.

## End-to-end acceptance check

After deployment, capture the `route_id` returned by the create request and verify all three refer to the same database record:

```text
POST team-users/{driver_user_id}/routes/ -> route_id
GET route-history/?user_id={driver_user_id} -> contains route_id
GET /api/v1/route/ with driver's token -> contains route_id
```

If the POST does not return `201`, use its response body to correct serializer validation first. If it returns `201` and either GET omits the ID, the corresponding backend queryset/ownership mapping is the defect.

## Permit parsing and multi-permit requirements

The frontend uploads every permit independently to:

`POST /api/v1/team-dashboard/manage/permits/parse/`

Each request is multipart form data with a `file` field. The parser must be stateless: parsing Permit 2 must return Permit 2's extracted data and must not reuse, replace, or depend on Permit 1's prior parser state.

Return the schema's `TeamPermitParseResponse` directly (an optional `{ "data": ... }` wrapper is also tolerated by the frontend):

```json
{
  "status": "success",
  "permit_number": "P-200",
  "issuing_state": "NE",
  "origin": { "name": "Origin", "latitude": 41.1, "longitude": -97.1 },
  "destination": { "name": "Destination", "latitude": 41.8, "longitude": -96.2 },
  "waypoints": [
    {
      "index": 1,
      "name": "US-30 EB",
      "waypoint_type": "CHECKPOINT",
      "latitude": 41.3,
      "longitude": -96.9
    }
  ],
  "unresolved_waypoints": []
}
```

Requirements:

- Always return `waypoints` and `unresolved_waypoints` arrays, including when empty.
- Return numeric, finite latitude and longitude values for resolved points.
- Put OCR-extracted names that could not be geocoded in `unresolved_waypoints`; the frontend will display them using safe interpolation instead of dropping Permit 2 data.
- Return a non-2xx response when parsing genuinely fails. Do not return `200` with an unrelated or stale permit result.
- Add a test that parses two different files sequentially and confirms the second response contains only the second permit's number, state, and waypoints.

The final create request includes all permits in `permits[]`, with each permit's own start/end coordinates, permit metadata, and waypoint array. The route-create transaction must persist every nested permit rather than only `permits[0]`.
