# 🔒 DLP Shield — Data Leakage Prevention for Cloud Storage

[![CI Pipeline](https://github.com/ujjawal024/data-leakage-prevention-for-cloud-storage/actions/workflows/ci.yml/badge.svg)](https://github.com/ujjawal024/data-leakage-prevention-for-cloud-storage/actions/workflows/ci.yml)
[![CD Pipeline](https://github.com/ujjawal024/data-leakage-prevention-for-cloud-storage/actions/workflows/cd.yml/badge.svg)](https://github.com/ujjawal024/data-leakage-prevention-for-cloud-storage/actions/workflows/cd.yml)

A production-grade **Data Leakage Prevention (DLP)** system for cloud storage. DLP Shield automatically intercepts every file upload, scans it for sensitive data patterns (PII, credentials, financial data), classifies it, and enforces role-based access control — blocking policy violations before they reach cloud storage.

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [DLP Pipeline](#-dlp-pipeline)
- [Data Classification](#-data-classification)
- [Role-Based Access Control](#-role-based-access-control)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [DevOps Setup](#-devops-setup)
- [Running Locally with Docker](#-running-locally-with-docker)
- [Running Locally without Docker](#-running-locally-without-docker)
- [Environment Variables](#-environment-variables)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Unit Tests](#-unit-tests)
- [Demo Credentials](#-demo-credentials)

---

## 🏗 Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                    React Frontend                      │
│              (Vite + TailwindCSS + Nginx)              │
│  Dashboard │ My Files │ Admin Panel │ Auth             │
└───────────────────┬────────────────────────────────────┘
                    │ HTTP REST (JWT Bearer Token)
┌───────────────────▼────────────────────────────────────┐
│                  FastAPI Backend                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │              DLP Pipeline Engine                │   │
│  │  Content Inspection → Classification →          │   │
│  │  Hashing → Fingerprint Check → Policy Eval     │   │
│  └─────────────────────────────────────────────────┘   │
│  Routes: /auth  /files  /admin  /health                │
└──────────┬────────────────────┬────────────────────────┘
           │                    │
┌──────────▼──────┐    ┌────────▼────────────────────────┐
│   PostgreSQL    │    │        Cloud Storage             │
│   (Alembic      │    │  Local │ AWS S3 │ GCP │ Azure   │
│   Migrations)   │    └─────────────────────────────────┘
└─────────────────┘
```

---

## ✨ Features

### Core DLP Engine
- **Regex-based content inspection** — Scans file content for 17+ sensitive data patterns
- **Automatic classification** — Assigns `PUBLIC`, `CONFIDENTIAL`, or `RESTRICTED` label to every file
- **SHA-256 file hashing** — Ensures file integrity and detects exact duplicates
- **Document fingerprinting** — Detects modified copies of protected documents (even when renamed/edited)
- **Executable file blocking** — Blocks `.exe`, `.bat`, `.sh`, `.ps1`, `.msi`, `.cmd`
- **50 MB file size enforcement** — Hard upload size limit

### Security & Access Control
- **JWT authentication** — Stateless token-based auth (HS256, 60-minute expiry)
- **bcrypt password hashing** — Secure password storage with salted hashing
- **Role-Based Access Control (RBAC)** — Three-tier role system (admin / manager / employee)
- **Self-registration protection** — Admin role cannot be self-registered

### Observability
- **Real-time audit logging** — Every upload, download, share, and delete is logged with timestamp, IP, and outcome
- **Security alerts** — Automatic alert generation on policy violations with severity levels (`low` / `medium` / `high` / `critical`)
- **Admin dashboard stats** — Real-time counts of files, users, blocked uploads, and recent activity

### Multi-Cloud Storage
- **Local filesystem** (default, for development)
- **AWS S3**
- **Google Cloud Storage**
- **Azure Blob Storage**
- Pluggable via `CLOUD_PROVIDER` environment variable

### DevOps
- **Dockerized** — Backend, frontend, and PostgreSQL all containerized
- **Docker Compose** — One-command local stack with health checks
- **GitHub Actions CI** — Automated lint, test, and build on every push
- **GitHub Actions CD** — Automated Docker image build and push to `ghcr.io`
- **Alembic migrations** — Version-controlled database schema management
- **66 automated unit tests**

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, React Router v6, Axios |
| **Backend** | FastAPI (Python 3.10+), Uvicorn |
| **Database** | PostgreSQL 15 (production) / SQLite (local dev) |
| **ORM** | SQLAlchemy 2.x |
| **Migrations** | Alembic |
| **Auth** | JWT (python-jose), bcrypt |
| **Testing** | pytest, pytest-cov |
| **Containerization** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |
| **Container Registry** | GitHub Container Registry (ghcr.io) |
| **Web Server** | Nginx (frontend), Uvicorn (backend) |

---

## 📁 Project Structure

```
data-leakage-prevention-for-cloud-storage/
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI: lint, test, build
│       └── cd.yml              # CD: build & push Docker images
│
└── dlp-system/
    ├── docker-compose.yml      # Orchestrates backend + frontend + PostgreSQL
    │
    ├── backend/
    │   ├── Dockerfile
    │   ├── .dockerignore
    │   ├── .env.example        # Safe environment variable template
    │   ├── requirements.txt
    │   ├── alembic.ini         # Alembic configuration
    │   ├── alembic/
    │   │   ├── env.py          # Migration environment config
    │   │   └── versions/       # Generated migration scripts
    │   │
    │   ├── main.py             # FastAPI app entry point, CORS, routers
    │   ├── database.py         # SQLAlchemy engine, session, Base
    │   ├── models.py           # ORM models (User, FileRecord, AuditLog, Alert, FingerprintStore)
    │   ├── auth.py             # JWT creation/verification, bcrypt hashing
    │   ├── dependencies.py     # get_current_admin dependency
    │   ├── seed.py             # Database seed script (demo users)
    │   │
    │   ├── routes/
    │   │   ├── auth_routes.py  # POST /auth/register, /auth/login, GET /auth/me
    │   │   ├── file_routes.py  # POST /files/upload, GET /files/, GET /files/{id}/download
    │   │   └── admin_routes.py # GET /admin/dashboard-stats, /alerts, /audit-logs, /files, /users
    │   │
    │   ├── dlp/
    │   │   ├── content_inspector.py  # Regex pattern scanning (17+ patterns)
    │   │   ├── classifier.py         # Maps patterns → PUBLIC/CONFIDENTIAL/RESTRICTED
    │   │   ├── hasher.py             # SHA-256 hashing + document fingerprinting
    │   │   ├── fingerprint_store.py  # Duplicate & modified-copy detection
    │   │   ├── policy_engine.py      # RBAC + size + extension enforcement
    │   │   └── monitor.py            # Audit log writer
    │   │
    │   ├── storage/
    │   │   └── cloud_adapter.py      # Pluggable storage backends (local/S3/GCP/Azure)
    │   │
    │   └── tests/
    │       ├── test_policy_engine.py    # 23 tests
    │       ├── test_classifier.py       # 22 tests
    │       └── test_content_inspector.py # 21 tests
    │
    └── frontend/
        ├── Dockerfile
        ├── .dockerignore
        ├── nginx.conf          # SPA routing for React
        ├── package.json
        ├── vite.config.js
        └── src/
            └── ...             # React components (Dashboard, My Files, Admin Panel, Auth)
```

---

## 🔄 DLP Pipeline

Every file upload passes through a strict 9-step pipeline:

```
User Upload Request
       │
  Step 1 & 2 ── Content Inspection
  │              Scans file text for 17+ regex patterns
  │              (credit cards, SSNs, API keys, passwords, etc.)
       │
  Step 3 ──── Classification
  │            PUBLIC | CONFIDENTIAL | RESTRICTED
       │
  Step 4 ──── Hashing
  │            SHA-256 full hash + 64-char document fingerprint
       │
  Step 5 ──── Fingerprint / Duplicate Check
  │            Exact duplicate? Modified copy of protected doc?
  │            (Modified copy → forced RESTRICTED)
       │
  Step 6 ──── Policy Evaluation
  │            Role + Classification + File Size + Extension
       │
       ├── BLOCKED ──→ Alert Created + Audit Log + 403 Response
       │
  Step 9 ──── Cloud Storage Upload
               FileRecord Persisted + Fingerprint Registered
               Audit Log Written + 200 Response
```

---

## 🏷 Data Classification

Files are automatically classified based on detected content patterns:

| Classification | Triggers |
|---|---|
| **RESTRICTED** | Credit card numbers, SSNs, Aadhaar numbers, PAN card numbers, bank account numbers, IFSC codes, API keys, passwords, private keys, AWS access keys, JWT tokens |
| **CONFIDENTIAL** | Email addresses, Indian phone numbers, international phone numbers, IP addresses, confidential/restricted keywords, financial keywords (salary, invoice, payroll, etc.) |
| **PUBLIC** | No sensitive patterns detected |

**Priority Rule:** `RESTRICTED > CONFIDENTIAL > PUBLIC` — the highest applicable classification always wins.

---

## 👥 Role-Based Access Control

| Action | Employee | Manager | Admin |
|---|---|---|---|
| Upload `PUBLIC` files | ✅ | ✅ | ✅ |
| Upload `CONFIDENTIAL` files | ❌ | ✅ | ✅ |
| Upload `RESTRICTED` files | ❌ | ❌ | ✅ |
| Download own files | ✅ | ✅ | ✅ |
| Download any file | ❌ | ❌ | ✅ |
| Share files | ✅ | ✅ | ✅ |
| View all files (admin panel) | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |
| View security alerts | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |

**Alert Severity Rules:**
- `RESTRICTED` file + non-admin user → **Critical**
- `CONFIDENTIAL` file + employee → **High**
- All other violations → **Medium**

---

## 🗄 Database Schema

### Tables

| Table | Purpose |
|---|---|
| `users` | User accounts with role, password hash, active status |
| `file_records` | Every uploaded file (allowed & blocked) with classification, hash, patterns, storage URL |
| `audit_logs` | Immutable record of every upload, download, share, and delete action |
| `alerts` | Security alerts generated on policy violations |
| `fingerprint_store` | Registry of CONFIDENTIAL/RESTRICTED file hashes for duplicate detection |

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `admin`, `manager`, `employee` |
| `Classification` | `PUBLIC`, `CONFIDENTIAL`, `RESTRICTED` |
| `AuditAction` | `upload`, `download`, `share`, `delete`, `block` |
| `AuditResult` | `allowed`, `blocked` |
| `AlertSeverity` | `low`, `medium`, `high`, `critical` |

---

## 📡 API Reference

### Authentication — `/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user (employee/manager only) | Public |
| `POST` | `/auth/login` | Login and receive a JWT token | Public |
| `GET` | `/auth/me` | Get the current user's profile | Required |

### Files — `/files`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/files/upload` | Upload a file through the full DLP pipeline | Required |
| `GET` | `/files/` | List the current user's uploaded files | Required |
| `GET` | `/files/{id}/download` | Get a presigned download URL (RBAC enforced) | Required |
| `POST` | `/files/{id}/share` | Share a file with another user (RBAC enforced) | Required |
| `DELETE` | `/files/{id}` | Soft-delete a file | Required |

### Admin — `/admin` (Admin role required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/dashboard-stats` | Counts of files, users, blocked uploads, alerts, recent activity |
| `GET` | `/admin/alerts` | List security alerts with severity/read filters |
| `PATCH` | `/admin/alerts/{id}/read` | Mark an alert as read |
| `GET` | `/admin/audit-logs` | List audit logs with user/action/result/date filters |
| `GET` | `/admin/files` | List all files with classification/blocked/uploader filters |
| `GET` | `/admin/users` | List all users |
| `PATCH` | `/admin/users/{id}/role` | Update a user's role |
| `PATCH` | `/admin/users/{id}/status` | Activate or deactivate a user |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{"status": "ok"}` |
| `GET` | `/docs` | Interactive Swagger UI (auto-generated) |

---

## ⚙️ DevOps Setup

The project is fully containerized and uses GitHub Actions for CI/CD.

### Infrastructure

```
┌─────────────────────────────────────────────┐
│             GitHub Repository               │
│                                             │
│  Push to main ──→ CI Pipeline              │
│                   (lint + test + build)     │
│                                             │
│  Push to main ──→ CD Pipeline              │
│                   (build + push to ghcr.io)│
└─────────────────────────────────────────────┘
                         │
              Docker images pushed to:
         ghcr.io/<owner>/dlp-backend:latest
         ghcr.io/<owner>/dlp-frontend:latest
```

---

## 🐳 Running Locally with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/ujjawal024/data-leakage-prevention-for-cloud-storage.git
cd data-leakage-prevention-for-cloud-storage/dlp-system
```

**2. Start the full stack**
```bash
docker-compose up -d --build
```

This starts 3 containers:
- `db` — PostgreSQL 15 (port `5432`)
- `backend` — FastAPI (port `8000`)
- `frontend` — React via Nginx (port `80`)

The backend waits for PostgreSQL to pass its health check before starting.

**3. Run database migrations**
```bash
docker-compose exec backend python -m alembic upgrade head
```

**4. (Optional) Seed demo users**
```bash
docker-compose exec backend python seed.py
```

**5. Access the app**

| Service | URL |
|---|---|
| Frontend Dashboard | http://localhost |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

**6. Useful commands**

```bash
# View live logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# Stop all containers (data is preserved in volumes)
docker-compose down

# Stop all containers AND delete all data
docker-compose down -v
```

---

## 💻 Running Locally without Docker

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup

```bash
cd dlp-system/backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env — set DATABASE_URL=sqlite:///./dlp.db for local dev

# Apply database migrations
python -m alembic upgrade head

# Seed demo users
python seed.py

# Start the backend
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd dlp-system/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Access the frontend at http://localhost:5173

---

## 🔐 Environment Variables

Copy `dlp-system/backend/.env.example` to `dlp-system/backend/.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `CLOUD_PROVIDER` | `local` | Storage backend: `local`, `aws`, `gcp`, `azure` |
| `SECRET_KEY` | *(change this!)* | JWT signing secret — use a long random string in production |
| `DATABASE_URL` | `sqlite:///./dlp.db` | Database connection URL |
| `LOCAL_STORAGE_PATH` | `./local_storage` | Path for local file storage |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials (when `CLOUD_PROVIDER=aws`) |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials |
| `AWS_REGION` | `us-east-1` | AWS region |
| `AWS_BUCKET_NAME` | — | S3 bucket name |
| `GCP_BUCKET_NAME` | — | GCP bucket name (when `CLOUD_PROVIDER=gcp`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | — | Path to GCP service account JSON |
| `AZURE_STORAGE_CONNECTION_STRING` | — | Azure connection string (when `CLOUD_PROVIDER=azure`) |
| `AZURE_CONTAINER_NAME` | — | Azure container name |

> ⚠️ **Never commit your `.env` file.** It is excluded by `.gitignore`. Only `.env.example` should be committed.

---

## 🔄 CI/CD Pipeline

### CI Pipeline (`.github/workflows/ci.yml`)

Triggers on: **every push and pull request** to `main` or `dev`

| Job | Steps |
|---|---|
| `backend-tests` | Setup Python 3.10 → Install deps → Flake8 lint → Run 66 pytest tests |
| `frontend-build` | Setup Node 18 → `npm ci` → `npm run build` |

### CD Pipeline (`.github/workflows/cd.yml`)

Triggers on: **push to `main` only**

| Job | Steps |
|---|---|
| `build-and-push-docker` | Login to `ghcr.io` → Build backend image → Push → Build frontend image → Push |

Images are pushed to:
- `ghcr.io/<owner>/dlp-backend:latest`
- `ghcr.io/<owner>/dlp-frontend:latest`

---

## 🧪 Unit Tests

**66 tests** covering the core DLP logic. These are pure-function tests with no database dependency and run in under 0.2 seconds.

```bash
cd dlp-system/backend
python -m pytest tests/ -v
```

### Test Coverage

| File | Tests | What's Tested |
|---|---|---|
| `tests/test_policy_engine.py` | 23 | Allowed uploads, RBAC violations, blocked extensions, file size limits, alert severity |
| `tests/test_classifier.py` | 22 | All RESTRICTED patterns, all CONFIDENTIAL patterns, PUBLIC classification, priority ordering |
| `tests/test_content_inspector.py` | 21 | PII detection (email, phone, SSN, Aadhaar, PAN), financial detection (credit card, bank account, IFSC), security patterns (API key, password, JWT), keyword patterns, clean-text cases |

---

## 👤 Demo Credentials

These accounts are created by the seed script:

| Role | Username | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin` | `Admin@123` | Full access — all files, users, alerts, audit logs |
| **Manager** | `manager` | `Manager@123` | Upload PUBLIC + CONFIDENTIAL, download own files |
| **Employee** | `employee` | `Emp@1234` | Upload PUBLIC only, download own files |

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (salted). Plain-text passwords are never stored.
- JWTs expire after **60 minutes**. There is no refresh token mechanism.
- The `SECRET_KEY` used for JWT signing must be a strong random string in production. Generate one with:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- Admin accounts cannot be created via the public registration endpoint.
- Admins cannot deactivate their own account (prevents lockout).
- File paths are validated to prevent path traversal attacks in local storage mode.
- CORS is configured to allow all origins (`*`) in the current setup — restrict this for production deployments.
