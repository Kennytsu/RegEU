#!/usr/bin/env python3
"""
Test script to generate a voice call link for EUgene
"""

import requests
import json
from datetime import datetime, timedelta

# Backend API URL
BASE_URL = "http://localhost:8000"

# Test payload
payload = {
    "payload": {
        "user_id": "test-user-123",
        "user_name": "John Doe",
        "company_name": "Acme Corporation",
        "regulation_type": "GDPR",
        "regulation_title": "Article 5 Data Retention Amendment",
        "effective_date": "2025-03-15",
        "deadline": "2025-04-01",
        "summary": "New data retention requirements reduce the maximum storage period for personal data from 5 years to 3 years. This affects all EU-based companies processing personal data.",
        "action_required": "Review and update your data retention policies and systems to comply with the new 3-year limit. Audit existing data stores and implement automated deletion processes.",
        "impact_level": "high",
        "reference_url": "https://gdpr.eu/article-5-data-retention"
    },
    "expires_in_minutes": 120  # 2 hours for testing
}

print("🚀 Generating EUgene voice call link...")
print(f"\nTest Payload:")
print(f"  User: {payload['payload']['user_name']}")
print(f"  Company: {payload['payload']['company_name']}")
print(f"  Regulation: {payload['payload']['regulation_type']} - {payload['payload']['regulation_title']}")
print(f"  Impact Level: {payload['payload']['impact_level'].upper()}")
print(f"  Deadline: {payload['payload']['deadline']}")
print()

try:
    # Make request to generate link
    response = requests.post(
        f"{BASE_URL}/voice-calls/generate-link",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        data = response.json()

        print("✅ Voice call link generated successfully!\n")
        print(f"Token: {data['token']}")
        print(f"Expires at: {data['expires_at']}")
        print()
        print(f"🔗 Full URL (copy and paste into browser):")
        print(f"http://localhost:8081{data['link']}")
        print()
        print("📱 Click the link above to test the EUgene voice call experience!")

    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

except requests.exceptions.ConnectionError:
    print("❌ Error: Could not connect to backend server.")
    print("Make sure the backend is running on http://localhost:8000")
except Exception as e:
    print(f"❌ Error: {e}")
