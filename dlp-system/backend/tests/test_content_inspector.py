"""
test_content_inspector.py — Unit tests for the DLP content inspection engine.

Tests cover:
  - Detection of PII patterns (email, phone, SSN, Aadhaar, PAN)
  - Detection of financial patterns (credit card, bank account, IFSC)
  - Detection of security patterns (API key, password, private key, AWS key, JWT)
  - Detection of keyword patterns (confidential, financial)
  - Clean text returns empty results
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dlp.content_inspector import inspect


class TestPIIDetection:
    def test_detects_email(self):
        result = inspect("Contact us at john.doe@example.com for support.")
        assert "email" in result["matched_types"]
        assert "john.doe@example.com" in result["matches"]["email"]

    def test_detects_indian_phone(self):
        result = inspect("Call me at +91-9876543210 for details.")
        assert "phone_in" in result["matched_types"]

    def test_detects_ssn(self):
        result = inspect("Employee SSN: 123-45-6789")
        assert "ssn" in result["matched_types"]

    def test_detects_aadhaar(self):
        result = inspect("Aadhaar number: 1234 5678 9012")
        assert "aadhaar" in result["matched_types"]

    def test_detects_pan_card(self):
        result = inspect("PAN: ABCDE1234F")
        assert "pan_card" in result["matched_types"]

    def test_detects_ip_address(self):
        result = inspect("Server is at 192.168.1.100")
        assert "ip_address" in result["matched_types"]


class TestFinancialDetection:
    def test_detects_credit_card(self):
        result = inspect("Card number: 4111 1111 1111 1111")
        assert "credit_card" in result["matched_types"]

    def test_detects_bank_account(self):
        result = inspect("Account number: 123456789012")
        assert "bank_account" in result["matched_types"]

    def test_detects_ifsc_code(self):
        result = inspect("IFSC code is SBIN0001234")
        assert "ifsc_code" in result["matched_types"]


class TestSecurityPatternDetection:
    def test_detects_api_key(self):
        result = inspect("api_key=sk-12345abcdef")
        assert "api_key" in result["matched_types"]

    def test_detects_password(self):
        result = inspect("password=mysupersecret123")
        assert "password" in result["matched_types"]

    def test_detects_private_key(self):
        result = inspect("-----BEGIN RSA PRIVATE KEY-----")
        assert "private_key" in result["matched_types"]

    def test_detects_aws_key(self):
        result = inspect("AWS Key: AKIAIOSFODNN7EXAMPLE")
        assert "aws_key" in result["matched_types"]

    def test_detects_jwt_token(self):
        result = inspect("Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
        assert "jwt_token" in result["matched_types"]


class TestKeywordDetection:
    def test_detects_confidential_keyword(self):
        result = inspect("This document is CONFIDENTIAL and must not be shared.")
        assert "confidential_kw" in result["matched_types"]

    def test_detects_restricted_keyword(self):
        result = inspect("RESTRICTED: Internal use only.")
        assert "confidential_kw" in result["matched_types"]

    def test_detects_financial_keyword(self):
        result = inspect("Q3 salary and payroll report attached.")
        assert "financial_kw" in result["matched_types"]


class TestCleanContent:
    def test_empty_text_returns_no_matches(self):
        result = inspect("")
        assert result["matched_types"] == []
        assert result["matches"] == {}

    def test_generic_text_returns_no_matches(self):
        result = inspect("Hello, this is a simple meeting agenda for Monday.")
        assert result["matched_types"] == []

    def test_result_structure(self):
        result = inspect("test@example.com")
        assert "matches" in result
        assert "matched_types" in result
        assert isinstance(result["matched_types"], list)
        assert isinstance(result["matches"], dict)

    def test_max_samples_capped(self):
        """Inspector should not return more than 10 samples per pattern."""
        # 12 distinct emails
        emails = " ".join([f"user{i}@example.com" for i in range(12)])
        result = inspect(emails)
        assert "email" in result["matched_types"]
        assert len(result["matches"]["email"]) <= 10
