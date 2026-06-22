# Crisis Logistics – Backend API Scheme

> REST API specification for the Drivers App.  
> Base URL: `https://api.crisis-logistics.example.com/api/v1`

---

## Authentication

### `POST /auth/login`

Authenticate a driver and receive a JWT token.

**Request Body:**
```json
{
  "vehicle_id": "TRK-001",
  "password": "secret123"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "vehicle_id": "TRK-001"
}
```

**Response `401 Unauthorized`:**
```json
{
  "success": false,
  "error_message": "Invalid credentials"
}
```

**Headers for subsequent requests:**
```
Authorization: Bearer <token>
```

---

## Vehicles

### `GET /vehicles/{vehicleId}`

Retrieve details for a specific vehicle.

**Response `200 OK`:**
```json
{
  "vehicle_id": "TRK-001",
  "type": "Heavy Truck (Cooler)",
  "weight": 8000,
  "payload": 50000,
  "volume": 7000,
  "operational_range": 10000,
  "features": ["Temperature control", "GPS Tracking"],
  "restrictions": ["Can't park in public places", "Can't enter Chechia"]
}
```

---

## Missions

### `GET /vehicles/{vehicleId}/missions`

Retrieve all missions assigned to a vehicle.

**Response `200 OK`:**
```json
[
  {
    "id": "M-001",
    "cargo_type": "Food",
    "start_time": "2026-06-22T16:00:00Z",
    "end_time": "2026-06-22T22:00:00Z",
    "origin": "Warszawa",
    "destination": "Kijów",
    "weight": 20000,
    "volume": 4000,
    "special_requirements": ["Temperature has to be kept at 2-8 °C"],
    "unloading_wait_minutes": 45,
    "is_current": true
  },
  {
    "id": "M-002",
    "cargo_type": "Medicine",
    "start_time": "2026-06-23T07:00:00Z",
    "end_time": "2026-06-23T13:00:00Z",
    "origin": "Łódź",
    "destination": "Lwów",
    "weight": 2500,
    "volume": 800,
    "special_requirements": ["Dry storage only"],
    "unloading_wait_minutes": 60,
    "is_current": false
  }
]
```

---

## Incidents

### `POST /missions/{missionId}/incidents`

Report an incident during a mission.

**Request Body:**
```json
{
  "mission_id": "M-001",
  "type": "delay",
  "delay_minutes": 30,
  "description": "Road blocked due to fallen tree",
  "reported_at": "2026-06-22T18:30:00Z"
}
```

| Field           | Type     | Required | Notes                                      |
|-----------------|----------|----------|--------------------------------------------|
| `mission_id`    | `string` | ✅       | ID of the affected mission                 |
| `type`          | `string` | ✅       | `"endMission"` or `"delay"`                |
| `delay_minutes` | `int`    | ❌       | Required only when `type` is `"delay"`     |
| `description`   | `string` | ❌       | Free-text description of the incident      |
| `reported_at`   | `string` | ✅       | ISO 8601 timestamp                         |

**Response `201 Created`:**
```json
{
  "id": "INC-001",
  "mission_id": "M-001",
  "type": "delay",
  "delay_minutes": 30,
  "description": "Road blocked due to fallen tree",
  "reported_at": "2026-06-22T18:30:00Z"
}
```

---

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": "Not Found",
  "message": "Mission M-999 does not exist",
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
