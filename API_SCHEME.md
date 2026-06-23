# Crisis Logistics – Backend API Scheme

> REST API specification for the Drivers App.
> Base URL: `/api/v1`

A **Task** is the unit of work a driver sees: a (part of a) mission assigned to
one vehicle. Missions are divisible — one mission can be split across several
tasks/vehicles. Task endpoints implicitly update the parent mission's state.

---

## Authentication

### `POST /auth/login`

Authenticate a driver by vehicle id (MVP — no password, no JWT).

**Request Body:**
```json
{
  "vehicle_id": "V0001"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "vehicle_id": "V0001"
}
```

**Response `401 Unauthorized`:**
```json
{
  "success": false,
  "error_message": "Invalid credentials"
}
```

---

## Vehicles

### `GET /vehicles/{vehicleId}`

Retrieve details for a specific vehicle.

**Response `200 OK`:**
```json
{
  "vehicle_id": "V0001",
  "type": "Refrigerated semi",
  "weight": 40,
  "payload": 24,
  "volume": 90,
  "operational_range": 1200,
  "features": ["Temperature control", "Liftgate"],
  "restrictions": ["No city centre"]
}
```

---

## Tasks

### `GET /vehicles/{vehicleId}/tasks`

Retrieve all tasks assigned to a vehicle. Fields not yet stored on the task
(cargo, weight, volume, times, special requirements) are mapped from the parent
mission for now.

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "mission_id": "M0001",
    "vehicle_id": "V0004",
    "vehicle_type": "Refrigerated semi",
    "carrier_id": "C012",
    "carrier_name": "Trans-Pol Logistics",
    "cargo_type": "Food",
    "start_time": "2026-06-22T16:00:00Z",
    "end_time": "2026-06-22T22:00:00Z",
    "origin": "Warszawa",
    "origin_address": "ul. Testowa 1",
    "origin_coordinates": { "lat": 52.2, "lng": 21.0 },
    "destination": "Opole",
    "destination_address": "ul. Docelowa 2",
    "destination_coordinates": { "lat": 50.67, "lng": 17.93 },
    "start_address": "ul. Testowa 1",
    "start_coordinates": { "lat": 52.2, "lng": 21.0 },
    "end_address": "ul. Docelowa 2",
    "end_coordinates": { "lat": 50.67, "lng": 17.93 },
    "weight": 20,
    "volume": 40,
    "special_requirements": ["Temperature 2-8°C required"],
    "unloading_wait_minutes": null,
    "is_current": true
  }
]
```

### `PATCH /tasks/{taskId}`

Mark a task as finished (delivered). Implicitly advances the parent mission's
state (`driver_delivered`). MVP — no body.

**Response `200 OK`:** the updated task (same shape as the list item above).

---

## Incidents

### `POST /tasks/{taskId}/incidents`

Report an incident on a task. Implicitly drives the parent mission's state
(`endMission` → delivered, `delay` → delay reported) through the event log.

**Request Body:**
```json
{
  "type": "delay",
  "delay_minutes": 30,
  "description": "Road blocked due to fallen tree",
  "reported_at": "2026-06-22T18:30:00Z"
}
```

| Field           | Type     | Required | Notes                                      |
|-----------------|----------|----------|--------------------------------------------|
| `type`          | `string` | ✅       | `"endMission"` or `"delay"`                |
| `delay_minutes` | `int`    | ❌       | Required only when `type` is `"delay"`     |
| `description`   | `string` | ❌       | Free-text description of the incident      |
| `reported_at`   | `string` | ✅       | ISO 8601 timestamp                         |

**Response `201 Created`:**
```json
{
  "id": "INC-001",
  "task_id": 1,
  "mission_id": "M0001",
  "type": "delay",
  "delay_minutes": 30,
  "description": "Road blocked due to fallen tree",
  "reported_at": "2026-06-22T18:30:00Z"
}
```

---

## Error Responses

All error responses (except `POST /auth/login`, which returns its own
`success`/`error_message` shape) follow a consistent format:

```json
{
  "error": "Not Found",
  "message": "Task 999 does not exist",
  "status_code": 404
}
```

| Status Code | Meaning              |
|-------------|----------------------|
| `400`       | Bad Request          |
| `401`       | Unauthorized         |
| `403`       | Forbidden            |
| `404`       | Not Found            |
| `500`       | Internal Server Error|
