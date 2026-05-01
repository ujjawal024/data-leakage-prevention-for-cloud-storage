"""
seed.py — Populate the database with test users and upload test files through the DLP pipeline.
Run with: python seed.py  (from the backend/ directory)
"""

import os
import sys
import pathlib

# Ensure the backend directory is on the path
sys.path.insert(0, str(pathlib.Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from database import engine, SessionLocal, Base
import models
from auth import hash_password

# ──────────────────────────────────────────────
# Create tables
# ──────────────────────────────────────────────
Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ──────────────────────────────────────────────
# Seed users
# ──────────────────────────────────────────────

USERS = [
    {"username": "admin",    "email": "admin@dlp.local",    "password": "Admin@123",   "role": "admin"},
    {"username": "manager",  "email": "manager@dlp.local",  "password": "Manager@123", "role": "manager"},
    {"username": "employee", "email": "employee@dlp.local", "password": "Emp@1234",    "role": "employee"},
]

for u in USERS:
    existing = db.query(models.User).filter(models.User.username == u["username"]).first()
    if not existing:
        user = models.User(
            username        = u["username"],
            email           = u["email"],
            hashed_password = hash_password(u["password"]),
            role            = models.UserRole(u["role"]),
            is_active       = True,
        )
        db.add(user)
        print(f"  [OK]  Created user: {u['username']} ({u['role']})")
    else:
        print(f"  [--]  User already exists: {u['username']}")

db.commit()

# ──────────────────────────────────────────────
# Create test files
# ──────────────────────────────────────────────

TEST_FILES_DIR = pathlib.Path(__file__).parent / "test_files"
TEST_FILES_DIR.mkdir(exist_ok=True)

TEST_FILES = {
    "clean_report.txt": (
        "Q3 Sales Report\n"
        "Revenue grew 12% compared to the previous quarter.\n"
        "No sensitive data contained in this document.\n"
        "All figures are publicly available in the annual report."
    ),
    "financial_data.txt": (
        "Customer Payment Details\n"
        "Card Number: 4111 1111 1111 1111\n"
        "IFSC Code: HDFC0001234\n"
        "Account balance transfer initiated."
    ),
    "internal_memo.txt": (
        "CONFIDENTIAL — Internal Only\n"
        "Employee salary payroll for Q3 has been approved.\n"
        "Do not share this document outside the HR department.\n"
        "Total payroll budget: $2,400,000"
    ),
    "credentials.txt": (
        "Service Credentials\n"
        "api_key=sk-abc123secret-do-not-share\n"
        "password=admin1234\n"
        "database_url=postgres://user:pass@localhost/prod"
    ),
    "aadhaar_doc.txt": (
        "Identity Verification Record\n"
        "Aadhaar Number: 1234 5678 9012\n"
        "PAN Card: ABCDE1234F\n"
        "Date of Birth: 01-01-1990"
    ),
}

for filename, content in TEST_FILES.items():
    path = TEST_FILES_DIR / filename
    path.write_text(content, encoding="utf-8")
    print(f"  [FILE] Created test file: {filename}")

db.close()
print("\n[DONE] Seed complete!")
print("\nDefault credentials:")
print("  admin    / Admin@123")
print("  manager  / Manager@123")
print("  employee / Emp@1234")
