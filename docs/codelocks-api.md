# Codelocks NetCode API Reference

From official Codelocks API documentation + verified through live testing (April 2026).

## Base URL

```
https://api-connect.codelocks.io/n/3
```

## Authentication

- Header: `x-api-key: <YOUR_API_KEY>`

## Generate a NetCode

```
GET /n/3/netcode/{timecode}
```

### Path Parameters

| Parameter  | Required | Description |
|------------|----------|-------------|
| `timecode` | Yes      | The lock's timecode from initialization, without separators (e.g. `202604221226` from `2026/04/22/12:26`) |

### Query Parameters

| Parameter    | Required | Description |
|-------------|----------|-------------|
| `identifier` | Yes      | Six digit lock identifier (e.g. `921239`) |
| `lockmodel`  | Yes      | **`KL1060G3`** for KL1200N locks. (`KL1060` returns 6-digit codes — wrong for KL1200N which needs 7-digit) |
| `start`      | Yes      | Start datetime in **lock's local timezone**: `"YYYY-MM-DD HH:MM"`. Must start on the hour. |
| `duration`   | Yes      | Duration ID integer. **IDs are offset by 1**: duration=0 → 1hr, duration=1 → 2hr, etc. See mapping below. |

### Duration ID Mapping (verified)

| Duration ID | Actual Duration |
|------------|----------------|
| 0          | 1 hour         |
| 1          | 2 hours        |
| 2          | 3 hours        |
| 3          | 4 hours        |
| 4          | 5 hours        |
| 5          | 6 hours        |
| 10         | 11 hours       |
| 11         | 12 hours       |

For our pricing: 1hr → duration=0, 3hr → duration=2, 5hr → duration=4

### Timezone Behavior (CRITICAL — verified through testing)

The API passes the `start` time value straight through to the NetCode algorithm. The lock's internal clock runs on **PST (UTC-8) with NO daylight saving adjustment**, even though the portal timezone was set to America/Los_Angeles.

**Always send times in fixed UTC-8 (PST standard time), regardless of whether DST is active.**

During DST (March-November), the lock's clock is 1 hour behind local PDT time.

Example: Customer pays for 3hr at 2:37 PM PDT (current local time) →
- Lock's clock thinks it's 1:37 PM PST
- Round down to current hour on lock's clock: 13:00
- Add 1 extra hour to duration to guarantee full rental (3hr + 1hr = 4hr, duration ID = 3)
- Send `start=2026-04-22 13:00&duration=3`
- Code valid 13:00-17:00 on lock's clock = 2:00 PM - 6:00 PM PDT
- Customer gets 3hr 23min — always at least the paid duration

In code: convert current time to UTC, subtract 8 hours (fixed), round down to the hour, add 1 to the duration ID.

### Duration ID Formula

`durationId = purchasedHours` (not purchasedHours - 1)

Because we add +1 hour to compensate for the round-down:
- 1hr rental → duration=1 (actually 2hr window)
- 3hr rental → duration=3 (actually 4hr window)
- 5hr rental → duration=5 (actually 6hr window)

### Example Request (our lock)

```
GET /n/3/netcode/202604221226?identifier=921239&lockmodel=KL1060G3&start=2026-04-22 13:00&duration=0
```

### Response (200 OK)

```json
{
    "ActualNetcode": "7830719",
    "DurationDays": 0,
    "DurationHours": 2,
    "Mode": "standard",
    "SubMode": "alltime",
    "Timecode": "2026/04/22/12:26",
    "LockID": "921239",
    "Expires": "2026-04-22 16:00:00"
}
```

Key fields:
- `ActualNetcode` — the 7-digit PIN to enter on the lock
- `Expires` — when the NetCode stops working (in the timezone the API thinks it's using — treat as informational only)
- `DurationHours` — actual duration granted (note: may differ from what you expect due to ID offset)

### HTTP Status Codes

- `200` — Success
- `404` — Resource not found (check identifiers)
- `422` — Unprocessable entity (invalid parameters, or bad lock model)
- `500` — Internal server error

### Error Response

```json
{"message": "Generate netcode failed with ERROR status"}
```
This happens when duration ID is out of range for the lock model (e.g. duration=12 fails for KL1060G3).

## Lock Model Mapping

| Physical Lock | API Lock Model | Code Digits |
|--------------|---------------|-------------|
| KL1200N      | `KL1060G3`    | 7 digits    |
| KL1200N      | `KL1060`      | 6 digits (wrong — don't use) |
| KL1200N      | `KL1060C2`    | 7 digits (same codes as KL1060G3) |

Use `KL1060G3` for KL1200N locks.

## Our Lock Details (Test Lock)

- Lock UUID: `1c670069-6e82-4123-9b9c-e207992d3c04`
- Model: KL1200N → API model: `KL1060G3`
- Identifier: `921239`
- Timecode: `202604221226`
- Timezone: `America/Los_Angeles` (Pacific Time)
- Location: VPC (pickleball centre)

## Important Constraints

- **NetCodes must start on the hour** (e.g. 14:00, not 14:23). Round down to current hour.
- **Day-length NetCodes must start at midnight**
- **Send times in fixed UTC-8 (PST standard)** — lock does NOT adjust for daylight saving
- **Lock has ~15-25 min grace period after code expiry** — code still works briefly after expiry, then gets rejected (verified through testing)
- Same parameters always return the same NetCode (deterministic/idempotent)
- Multiple valid NetCodes can exist on a lock with different start times/durations
- Each API request counts towards Usage total, even if same parameters as a previous request
- API-generated NetCodes do NOT appear in the Codelocks Connect Portal
- When KitLock batteries are replaced, the lock loses its real-time clock — date/time must be reset before NetCode works

## Lock Initialization

1. Register lock on Codelocks Connect Portal (codelocksconnect.net)
2. Set timezone to `America/Los_Angeles`
3. Portal generates an initialization sequence
4. **Enter the sequence on the physical lock's keypad** — this syncs the clock and activates NetCode mode
5. Lock should give visual confirmation (blue/green light)
6. Generate a test code and verify it works on the lock
