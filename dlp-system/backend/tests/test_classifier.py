"""
test_classifier.py — Unit tests for the DLP data classification engine.

Tests cover:
  - RESTRICTED classification triggered by high-risk patterns
  - CONFIDENTIAL classification triggered by medium-risk patterns
  - PUBLIC classification for benign/empty content
  - Priority ordering (RESTRICTED > CONFIDENTIAL > PUBLIC)
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dlp.classifier import classify


class TestRestrictedClassification:
    def test_credit_card_is_restricted(self):
        assert classify(["credit_card"]) == "RESTRICTED"

    def test_ssn_is_restricted(self):
        assert classify(["ssn"]) == "RESTRICTED"

    def test_aadhaar_is_restricted(self):
        assert classify(["aadhaar"]) == "RESTRICTED"

    def test_pan_card_is_restricted(self):
        assert classify(["pan_card"]) == "RESTRICTED"

    def test_api_key_is_restricted(self):
        assert classify(["api_key"]) == "RESTRICTED"

    def test_password_is_restricted(self):
        assert classify(["password"]) == "RESTRICTED"

    def test_private_key_is_restricted(self):
        assert classify(["private_key"]) == "RESTRICTED"

    def test_aws_key_is_restricted(self):
        assert classify(["aws_key"]) == "RESTRICTED"

    def test_jwt_token_is_restricted(self):
        assert classify(["jwt_token"]) == "RESTRICTED"

    def test_bank_account_is_restricted(self):
        assert classify(["bank_account"]) == "RESTRICTED"


class TestConfidentialClassification:
    def test_email_is_confidential(self):
        assert classify(["email"]) == "CONFIDENTIAL"

    def test_phone_in_is_confidential(self):
        assert classify(["phone_in"]) == "CONFIDENTIAL"

    def test_phone_intl_is_confidential(self):
        assert classify(["phone_intl"]) == "CONFIDENTIAL"

    def test_ip_address_is_confidential(self):
        assert classify(["ip_address"]) == "CONFIDENTIAL"

    def test_confidential_keyword_is_confidential(self):
        assert classify(["confidential_kw"]) == "CONFIDENTIAL"

    def test_financial_keyword_is_confidential(self):
        assert classify(["financial_kw"]) == "CONFIDENTIAL"


class TestPublicClassification:
    def test_empty_matches_is_public(self):
        assert classify([]) == "PUBLIC"

    def test_unknown_pattern_is_public(self):
        assert classify(["some_random_pattern"]) == "PUBLIC"


class TestClassificationPriority:
    def test_restricted_beats_confidential(self):
        """When both RESTRICTED and CONFIDENTIAL patterns match, result is RESTRICTED."""
        assert classify(["email", "credit_card"]) == "RESTRICTED"
        assert classify(["financial_kw", "ssn"]) == "RESTRICTED"

    def test_confidential_beats_public(self):
        """When CONFIDENTIAL pattern is alongside benign patterns, result is CONFIDENTIAL."""
        assert classify(["email"]) == "CONFIDENTIAL"

    def test_multiple_restricted_patterns(self):
        assert classify(["credit_card", "ssn", "api_key"]) == "RESTRICTED"

    def test_multiple_confidential_patterns(self):
        assert classify(["email", "phone_in", "ip_address"]) == "CONFIDENTIAL"
