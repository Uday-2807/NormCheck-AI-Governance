# NormCheck AI backend MVP

CommonJS Express + MongoDB/Mongoose backend for the supplied static HTML frontend.

## Setup

1. Copy `.env.example` to `.env`.
2. Put your real Atlas connection string in `MONGODB_URI`. URL-encode special characters in the username/password.
3. From this directory, run `npm install` only if dependencies are not already installed.
4. Run `npm run dev`.

The existing `package.json` should use `"type": "commonjs"` and these scripts:

```json
"scripts": {
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```

Dependencies used: `express`, `mongoose`, `cors`, `dotenv`, and `nodemon` (development). No additional package is required by this code.

## Frontend location

The server expects `../frontend` relative to this backend folder, matching:

```
Norm-Check/
  backend/
  frontend/
```

## Endpoints

- `GET /api/health`
- `POST /api/check` — `{ "content": "...", "brandId": "demo-brand", "contentType": "general", "campaignContext": "" }`
- `GET /api/checks?limit=20`
- `GET /api/checks/:id`
- `PATCH /api/findings/:findingId/status` — `{ "status": "confirmed|potential|uncertain|resolved" }`
- `GET /api/brand-rules`
- `POST /api/brand-rules`
- `PUT /api/brand-rules/:id`
- `DELETE /api/brand-rules/:id`

## Rule engine behavior

The first pass uses deterministic phrase rules. If active prohibited-phrase rules exist in MongoDB, those are used; otherwise a small built-in fallback set is used. This is a rule-based MVP, not AI analysis. Image and PDF selection in the current frontend is preview-only and is not analyzed by these endpoints.

## Important frontend integration note

The supplied `frontend/app.js` currently runs the text check locally and opens a demo modal. The backend endpoints do not automatically replace that browser behavior. Wire the checker button to `POST /api/check` in a separate frontend integration step after verifying the API.
