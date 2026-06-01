# HMMS ML Enhancement — Setup

## Services

1. **MongoDB** — required for the Node API
2. **Server** (`server/`) — port 5000
3. **ML service** (`ml-service/`) — port 8000
4. **Client** (`client/`) — Vite dev server

## Start ML service

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Set `ML_SERVICE_URL=http://127.0.0.1:8000` in `server/.env` (optional; this is the default).

## Start API & client

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

## Features

- **Generate Menu** (admin → Menu Management): retrains NMF + gradient boosting and writes an optimized weekly menu.
- **Attendance forecast** (admin → Attendance Management): XGBoost on scan logs.
- **Ingredient demand** (Inventory Management): LightGBM / Random Forest on usage history.
- **Waste prediction** (Food Waste): Random Forest with recommendations.
- **Generic QR scanner** (admin → QR Scanner): accepts all HMMS QR types.
- **Student food ratings** replace admin preference forms.

Historical training data is seeded on server startup via `server/utils/enhancedSeeder.js`.
