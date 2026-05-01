# 🛡️ DLP Shield — Data Leakage Prevention System

A production-ready **Data Leakage Prevention (DLP)** middleware system that intercepts every file upload, runs it through a multi-stage analysis pipeline, enforces RBAC security policies, and only then stores it in cloud storage.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  React 18 + Tailwind CSS + Vite (port 3000)                 │
│  Login → Dashboard → MyFiles → AdminPanel                   │
└────────────────────────┬────────────────────────────────────┘
                         │  JWT + Bearer token
                         │  POST /files/upload (multipart)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     DLP MIDDLEWARE                          │
│  FastAPI + Uvicorn (port 8000)                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              DLP PIPELINE                           │    │
│  │  1. Content Inspection   (17 regex patterns)        │    │
│  │  2. Pattern Matching     (PII, secrets, keywords)   │    │
│  │  3. Classification       (PUBLIC/CONFIDENTIAL/RESTRICTED)│
│  │  4. SHA-256 Hashing      (integrity verification)   │    │
│  │  5. Fingerprint Check    (duplicate/modified copy)  │    │
│  │  6. RBAC Policy          (role vs classification)   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  VIOLATION ──► Block + Alert + AuditLog + 403 response     │
│  ALLOWED   ──► Store to Cloud + AuditLog + 200 response    │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUD STORAGE  (Universal Adapter)             │
│  Local (dev) │ AWS S3 │ Google Cloud Storage │ Azure Blob  │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                        │
│  User  •  FileRecord  •  AuditLog  •  Alert  •             │
│  FingerprintStore                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Backend

```bash
cd dlp-system/backend
pip install -r requirements.txt
# Copy and edit environment file:
cp .env .env.example    # (edit .env as needed)
python seed.py          # Creates DB + test users + test files
uvicorn main:app --reload
# API available at: http://localhost:8000
# Swagger docs at:  http://localhost:8000/docs
```

### Frontend

```bash
cd dlp-system/frontend
npm install
npm run dev
# App available at: http://localhost:3000
```

---

## Default Credentials (from seed.py)

| Username | Password     | Role     | Can Upload                    |
|----------|-------------|----------|-------------------------------|
| admin    | Admin@123   | admin    | PUBLIC, CONFIDENTIAL, RESTRICTED |
| manager  | Manager@123 | manager  | PUBLIC, CONFIDENTIAL          |
| employee | Emp@1234    | employee | PUBLIC only                   |

> ⚠️ Change the `SECRET_KEY` in `.env` before deploying to production.

---

## Switching Cloud Provider

Edit `backend/.env`:

```env
# Local filesystem (default, no account needed)
CLOUD_PROVIDER=local

# AWS S3
CLOUD_PROVIDER=aws
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=my-dlp-bucket

# Google Cloud Storage
CLOUD_PROVIDER=gcp
GCP_BUCKET_NAME=my-dlp-bucket
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json

# Azure Blob Storage
CLOUD_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=...
AZURE_CONTAINER_NAME=dlp-storage
```

---

## API Reference

### Auth

| Method | Endpoint         | Description              | Auth |
|--------|-----------------|--------------------------|------|
| POST   | /auth/register  | Create account           | No   |
| POST   | /auth/login     | Get JWT token            | No   |
| GET    | /auth/me        | Get current user profile | JWT  |

### Files

| Method | Endpoint                | Description                    | Auth |
|--------|------------------------|--------------------------------|------|
| POST   | /files/upload           | Upload + full DLP pipeline     | JWT  |
| GET    | /files/                 | List my files                  | JWT  |
| GET    | /files/{id}/download    | Get presigned download URL     | JWT  |
| POST   | /files/{id}/share       | Share file with another user   | JWT  |
| DELETE | /files/{id}             | Delete file                    | JWT  |

### Admin (role=admin only)

| Method | Endpoint                    | Description            |
|--------|-----------------------------|------------------------|
| GET    | /admin/dashboard-stats      | Aggregate stats        |
| GET    | /admin/alerts               | List alerts (filtered) |
| PATCH  | /admin/alerts/{id}/read     | Mark alert as read     |
| GET    | /admin/audit-logs           | Audit log (filtered)   |
| GET    | /admin/files                | All files (filtered)   |
| GET    | /admin/users                | All users              |
| PATCH  | /admin/users/{id}/role      | Change user role       |

---

## Test Files & Expected DLP Outcomes

| File                 | Classification | employee | manager | admin   |
|----------------------|----------------|----------|---------|---------|
| clean_report.txt     | PUBLIC         | ✅ ALLOWED | ✅ ALLOWED | ✅ ALLOWED |
| internal_memo.txt    | CONFIDENTIAL   | 🚫 BLOCKED | ✅ ALLOWED | ✅ ALLOWED |
| financial_data.txt   | RESTRICTED     | 🚫 BLOCKED | 🚫 BLOCKED | ✅ ALLOWED |
| credentials.txt      | RESTRICTED     | 🚫 BLOCKED | 🚫 BLOCKED | ✅ ALLOWED |
| aadhaar_doc.txt      | RESTRICTED     | 🚫 BLOCKED | 🚫 BLOCKED | ✅ ALLOWED |

### What DLP detects in each file:

- **clean_report.txt** — No sensitive patterns → PUBLIC
- **internal_memo.txt** — `confidential_kw`, `financial_kw` → CONFIDENTIAL  
- **financial_data.txt** — `credit_card`, `ifsc_code` → RESTRICTED
- **credentials.txt** — `api_key`, `password` → RESTRICTED
- **aadhaar_doc.txt** — `aadhaar`, `pan_card` → RESTRICTED

---

## Security Features

- 🔐 **JWT Authentication** — HS256, 60-minute expiry
- 🔒 **bcrypt Password Hashing** — never stored or returned in plaintext
- 🎭 **RBAC** — server-side role check on every admin & file route
- 🔑 **UUID Storage Keys** — original filenames never exposed in storage
- 📝 **Complete Audit Trail** — every action logged regardless of outcome
- 🚨 **Automated Alerts** — critical/high severity on policy violations
- 🕵️ **Fingerprint Detection** — catches modified copies of protected docs
- 📏 **Size & Extension Limits** — 50MB max, no executables

---

## Project Structure

```
dlp-system/
├── backend/
│   ├── main.py             # FastAPI app entry point
│   ├── auth.py             # JWT + bcrypt utilities
│   ├── models.py           # SQLAlchemy ORM models
│   ├── database.py         # SQLite engine + session
│   ├── dependencies.py     # RBAC FastAPI dependencies
│   ├── seed.py             # DB + test file seeding
│   ├── requirements.txt
│   ├── .env                # Environment configuration
│   ├── dlp/
│   │   ├── content_inspector.py  # 17 regex patterns
│   │   ├── classifier.py         # PUBLIC/CONFIDENTIAL/RESTRICTED
│   │   ├── hasher.py             # SHA-256 + fingerprint
│   │   ├── fingerprint_store.py  # Duplicate detection
│   │   ├── policy_engine.py      # RBAC + size + extension
│   │   └── monitor.py            # Audit log writer
│   ├── routes/
│   │   ├── auth_routes.py        # register/login/me
│   │   ├── file_routes.py        # upload/list/download/share/delete
│   │   └── admin_routes.py       # Admin dashboard endpoints
│   └── storage/
│       ├── base_adapter.py       # Abstract interface
│       ├── local_adapter.py      # Local filesystem (dev)
│       ├── aws_adapter.py        # AWS S3
│       ├── gcp_adapter.py        # Google Cloud Storage
│       ├── azure_adapter.py      # Azure Blob Storage
│       └── cloud_adapter.py      # Factory function
└── frontend/
    ├── src/
    │   ├── pages/          # LoginPage RegisterPage DashboardPage MyFilesPage AdminPage
    │   ├── components/     # Navbar FileDropzone ClassificationBadge AlertBanner StatsCard AuditLogTable AlertsTable ProtectedRoute
    │   ├── context/        # AuthContext (in-memory JWT)
    │   └── api/            # axios instance with auth interceptors
    └── ...config files
```
