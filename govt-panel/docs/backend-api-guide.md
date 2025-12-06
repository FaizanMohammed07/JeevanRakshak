# Backend Integration Guide

This project already contains an API layer so backend engineers can plug real endpoints in without hunting through UI files. Use this guide as the single source of truth for how data flows and where URLs need to be configured.

## 1. Configure the base URL

Create `.env.local` (ignored by git) in the project root and set the gateway that fronts your backend services:

```bash
VITE_API_BASE_URL=https://your-api.example.com/v1
```

Restart `npm run dev` whenever you change the value. Every API call concatenates this base URL with the path listed below.

## 2. API client essentials

File: `src/api/client.js`

- `apiClient(path, options)` wraps `fetch` with JSON parsing and standardized error messages.
- `buildQuery(params)` converts objects into `?key=value` strings while skipping empty values.
- All service modules import these helpers so you only need to adjust endpoint paths or payload shapes in one place.

If you need custom headers (auth tokens, tenant IDs, etc.), pass them via the `options` argument or extend `apiClient` once.

## 3. Endpoint map

| Service function                            | HTTP  | Path segment (relative to `VITE_API_BASE_URL`) | Notes                                                                                                                                           |
| ------------------------------------------- | ----- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetchDashboardSummary({ district })`       | `GET` | `/dashboard/summary?district=slug`             | Return `{ stats: [...] }` where each stat has `label`, `value`, `iconKey`, `trend`, `color`.                                                    |
| `fetchOutbreakAlerts({ district })`         | `GET` | `/alerts/outbreaks?district=slug`              | Return `{ alerts: [...] }` with `severity` (`high`/`medium`/`low`).                                                                             |
| `fetchRapidRiskSnapshot()`                  | `GET` | `/dashboard/risk-snapshot`                     | Return `{ districts: [...] }` to replace the Rapid Response table.                                                                              |
| `fetchSdgImpact()`                          | `GET` | `/dashboard/sdg-impact`                        | Return `{ metrics: [...] }`; each metric may include `icon` (`heart`/`scale`/`shield`).                                                         |
| `fetchTrendWidgets(params)`                 | `GET` | `/dashboard/trends?weekOffset=0`               | Return `{ diseaseTrends, vaccinationProgress, complianceScores }`. Supports optional `district` plus `weekOffset` (0-3) to shift 7-day windows. |
| `fetchDiseaseDistricts()`                   | `GET` | `/disease/districts`                           | Return `{ districts: [...] }`; each district hosts taluk/village breakdowns rendered in Disease Monitoring and Kerala map.                      |
| `fetchDiseaseSummary({ district })`         | `GET` | `/disease/summary?district=slug`               | Provide `{ districtCases: [...], trendData: [...] }` for bar/line charts.                                                                       |
| `fetchActiveDiseaseCases({ district })`     | `GET` | `/disease/active-cases?district=slug`          | Return `{ cases: [...] }` for the active case table.                                                                                            |
| `fetchTimelineStats({ district, range })`   | `GET` | `/disease/timeline?district=slug&range=1d`     | Return `{ casesDelta, response, coverage }`.                                                                                                    |
| `fetchTalukBreakdown(districtSlug, params)` | `GET` | `/disease/districts/{district}/taluks`         | Returns `{ district }` with taluk/village hierarchy. Supports `rangeDays`/`offsetDays` query params for window controls.                        |
| `fetchHighAlertVillages()`                  | `GET` | `/disease/villages/high-risk`                  | Optional endpoint if you want a dedicated high-alert feed.                                                                                      |
| `fetchKeralaRiskMap()`                      | `GET` | `/disease/risk-map`                            | Return `{ districts: [...] }` where each district has `name`, `coordinates`, `activeCases`, `risk`.                                             |

Feel free to rename the path segments to match your backend router. Only update the service functions; the UI will automatically consume the new responses.

## 4. How fallback data works

Each screen ships with mock objects (see `FALLBACK_*` constants in `src/pages`). When a live request fails or returns an empty array, the UI falls back to these mocks and surfaces a small warning. Once your endpoints return real data consistently you can remove or shrink the fallback blocks, but they are helpful during development and prevent blank screens in demos.

## 5. Adding new endpoints

1. Create a new service file inside `src/api/` (or extend an existing one).
2. Export functions that call `apiClient("/your/path")`.
3. Import those functions in the relevant page/component and hydrate state within `useEffect` just like the existing examples.
4. Document the shape briefly in this guide so future developers understand the contract.

## 6. Domain schemas (doctors & patients)

You mentioned there will be no standalone hospital collection. The easiest compromise is to embed the minimal facility metadata with every doctor record and reference doctors from patients. A practical structure looks like this (adapt field names to your database/ORM):

```json
// doctors
{
  "_id": "doc_9f23",
  "fullName": "Dr. Priya Menon",
  "specialization": "Infectious Diseases",
  "registrationNo": "KL/ID/2020/554",
  "contact": {
    "phone": "+91-98xxxxxx10",
    "email": "priya.menon@example.com"
  },
  "facility": {
    "code": "ern-med-04",
    "name": "Ernakulam District Medical HQ",
    "type": "district-command",
    "address": "MG Road, Ernakulam",
    "district": "ernakulam",
    "taluk": "kochi"
  },
  "availability": {
    "status": "on-duty", // on-duty, off-duty, leave
    "shift": "06:00-14:00",
    "lastSyncedAt": "2025-11-25T09:00:00Z"
  },
  "assignedCamps": [
    { "campId": "camp_kochi_03", "role": "lead", "coverage": "vector" }
  ]
}
```

- Keep `facility` lightweight (code, name, address, district/taluk) so you do not need a separate hospital schema.
- `assignedCamps` makes it easy to surface doctor availability inside the Camp Management page later.

```json
// patients (or migrant medical records)
{
  "_id": "patient_b4c1",
  "migrantId": "mig_45823",
  "fullName": "Rahul Kumar",
  "age": 31,
  "gender": "male",
  "camp": {
    "id": "camp_kochi_03",
    "name": "Kochi Construction Camp 3",
    "district": "ernakulam",
    "taluk": "kochi"
  },
  "diagnosis": {
    "primary": "dengue",
    "icdCode": "A90",
    "severity": "high",
    "reportedOn": "2025-11-24T07:30:00Z"
  },
  "vitals": {
    "temperature": 101.3,
    "bp": "110/70",
    "spo2": 96
  },
  "assignedDoctorId": "doc_9f23",
  "treatmentPlan": [
    { "date": "2025-11-24", "action": "Administered IV fluids" },
    { "date": "2025-11-25", "action": "Platelet monitoring" }
  ],
  "status": "under-observation" // recovered, referred, transferred
}
```

- Patients reference doctors through `assignedDoctorId`; resolve that in your API layer to show doctor names in UI tables.
- Redact or encrypt sensitive attributes before logging or exposing to non-medical staff.

You can extend both schemas with audit fields (`createdBy`, `updatedAt`) or multitenancy markers (`stateId`) without changing the frontend because only summarized fields (doctor name, specialty, patient diagnosis/status) are consumed today.

## 7. Testing checklist before pushing to GitHub

- [ ] Verify `.env.local` points to your staging gateway.
- [ ] Run `npm run dev` and ensure the Network tab shows 2xx responses for the services you wired.
- [ ] Update this document whenever endpoints or payloads change.

Providing these instructions in the repo makes it obvious “where to connect, where to add the endpoint, and what is going on” for anyone cloning the project.
