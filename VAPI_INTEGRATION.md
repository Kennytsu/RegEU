# Vapi Voice Call Integration Guide

## Overview

This application now supports voice call notifications for regulatory updates using Vapi AI. Instead of traditional phone calls, users receive a secure link that opens a web page where they can talk to an AI voice agent about urgent regulatory changes.

## How It Works

1. **Backend generates a secure link** with regulatory update information
2. **User clicks the link** (from email, SMS, or dashboard)
3. **Web page loads** and fetches the update details
4. **User starts a voice call** with the Vapi AI assistant
5. **AI agent explains** the regulatory update and answers questions
6. **Call ends** and user can review documentation or return to dashboard

## Setup Instructions

### 1. Get Vapi Credentials

1. Sign up at [Vapi Dashboard](https://dashboard.vapi.ai)
2. Get your **Public Key** from Settings → API Keys
3. Create an assistant and get the **Assistant ID**

### 2. Configure Environment Variables

Create a `.env` file in the frontend directory:

```bash
# Copy the example file
cp frontend/.env.example frontend/.env
```

Add your Vapi credentials:

```env
VITE_VAPI_PUBLIC_KEY=your_public_key_here
VITE_VAPI_ASSISTANT_ID=your_assistant_id_here
```

### 3. Create the Vapi Assistant

In your Vapi Dashboard, create a new assistant with the following configuration:

#### System Prompt

```
You are a regulatory compliance assistant for {{companyName}}.

You are speaking with {{userName}} about an urgent regulatory update.

## Regulatory Update Details:
- Regulation: {{regulationType}} - {{regulationTitle}}
- Effective Date: {{effectiveDate}}
- Action Deadline: {{deadline}}
- Impact Level: {{impactLevel}}

## Summary:
{{summary}}

## Required Action:
{{actionRequired}}

## Your Instructions:
1. Greet the user by name
2. Clearly explain the regulatory change and its impact
3. Explain what action they need to take and by when
4. Ask if they have any questions
5. Confirm they understand the requirements
6. Offer to send them the reference documentation link if available
7. Thank them and end the call professionally

Be clear, professional, and ensure the user understands the urgency based on the impact level.
```

#### First Message

```
Hello {{userName}}, this is your regulatory compliance assistant from {{companyName}}. I'm reaching out about an important {{impactLevel}}-impact regulatory update regarding {{regulationType}} that requires your attention. Do you have a moment to discuss this?
```

#### Voice Settings (Recommended)

- **Model**: GPT-4o or GPT-4o-mini
- **Voice**: Choose a professional-sounding voice (e.g., "en-US-neural2-J")
- **Temperature**: 0.7 (balanced between consistent and natural)

### 4. Test the Integration

#### Generate a Test Link

Use the backend API to generate a test voice call link:

```bash
curl -X POST http://localhost:8000/voice-calls/generate-link \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "user_id": "test-user-123",
      "user_name": "John Doe",
      "company_name": "Acme Corp",
      "regulation_type": "GDPR",
      "regulation_title": "Article 5 Data Retention Amendment",
      "effective_date": "2025-03-15",
      "deadline": "2025-04-01",
      "summary": "New data retention requirements reduce the maximum storage period for personal data from 5 years to 3 years.",
      "action_required": "Review and update your data retention policies and systems to comply with the new 3-year limit.",
      "impact_level": "high",
      "reference_url": "https://gdpr.eu/article-5-data-retention"
    },
    "expires_in_minutes": 60
  }'
```

Response:

```json
{
  "success": true,
  "token": "generated-secure-token",
  "link": "/voice-call?token=generated-secure-token",
  "expires_at": "2025-01-29T23:00:00"
}
```

#### Open the Link

Navigate to: `http://localhost:3000/voice-call?token=generated-secure-token`

You should see:
- Regulatory update information
- Impact level indicator
- "Start Call" button
- When clicked, it initiates a voice call with the Vapi assistant

## API Endpoints

### Generate Voice Call Link

```http
POST /voice-calls/generate-link
Content-Type: application/json

{
  "payload": {
    "user_id": "string",
    "user_name": "string",
    "company_name": "string",
    "regulation_type": "string",
    "regulation_title": "string",
    "effective_date": "YYYY-MM-DD",
    "deadline": "YYYY-MM-DD",
    "summary": "string",
    "action_required": "string",
    "impact_level": "low" | "medium" | "high" | "critical",
    "reference_url": "string" (optional)
  },
  "expires_in_minutes": 60 (optional, default: 60)
}
```

### Get Voice Call Payload

```http
GET /voice-calls/payload/{token}
```

### Invalidate Token

```http
DELETE /voice-calls/token/{token}
```

## Frontend Components

### VoiceCall Page (`/voice-call`)

The main page that handles the voice call experience. It:

1. Extracts the token from URL query params
2. Fetches the regulatory update payload from the backend
3. Initializes Vapi Web SDK
4. Displays update information with impact level indicator
5. Provides call controls (start/end call)
6. Shows call status (connecting, connected, speaking, ended)
7. Offers option to call again or go to dashboard

### Key Features

- **Loading States**: Shows spinner while fetching data
- **Error Handling**: Displays friendly error messages for expired/invalid tokens
- **Visual Feedback**: Pulsing animation when AI is speaking
- **Impact Indicators**: Color-coded badges for impact levels
- **Call Controls**: Clear start/end call buttons
- **Responsive Design**: Works on desktop and mobile

## Security Considerations

### Token Security

- Tokens are randomly generated using `secrets.token_urlsafe(32)`
- Tokens automatically expire (default 1 hour)
- Tokens are stored in-memory (use Redis in production)
- Option to mark tokens as single-use

### Production Recommendations

1. **Use Redis for token storage** instead of in-memory
2. **Implement rate limiting** on link generation
3. **Add user authentication** for link generation
4. **Log all voice call events** for audit trails
5. **Set shorter expiration times** for critical updates
6. **Use HTTPS** for all communications

## Usage Example

### In Your Notification System

```typescript
// When a critical regulatory update is detected
const payload: RegulatoryUpdatePayload = {
  user_id: user.id,
  user_name: user.name,
  company_name: user.company,
  regulation_type: "GDPR",
  regulation_title: "Article 5 Amendment",
  effective_date: "2025-03-15",
  deadline: "2025-04-01",
  summary: "New data retention requirements...",
  action_required: "Update data retention policies...",
  impact_level: "high",
  reference_url: "https://gdpr.eu/article-5"
};

// Generate the link
const response = await apiClient.generateVoiceCallLink({
  payload,
  expires_in_minutes: 120 // 2 hours for high-impact updates
});

// Send link via email or SMS
await sendEmail(user.email, {
  subject: "Urgent: High-Impact Regulatory Update",
  body: `
    Click here to receive a voice call about an important regulatory update:
    ${frontendUrl}${response.link}
  `
});
```

## Troubleshooting

### "Voice call service not configured"

- Check that `VITE_VAPI_PUBLIC_KEY` is set in `.env`
- Verify the public key is correct
- Restart the frontend dev server after changing `.env`

### "Voice assistant not configured"

- Check that `VITE_VAPI_ASSISTANT_ID` is set in `.env`
- Verify the assistant ID is correct
- Make sure the assistant exists in your Vapi Dashboard

### "Invalid or expired token"

- Token may have expired (check `expires_at` from generation)
- Token may have been used (if single-use mode is enabled)
- Token may have been deleted/invalidated

### Call doesn't start

- Check browser console for errors
- Verify microphone permissions are granted
- Test your Vapi credentials in the Vapi Dashboard
- Ensure the assistant has the correct configuration

## Cost Optimization

Vapi charges per minute of call time:

1. **Set appropriate expiration times**: Don't make links valid longer than necessary
2. **Monitor call duration**: Set up analytics to track average call length
3. **Use interruptions wisely**: Configure the assistant to handle interruptions efficiently
4. **Test thoroughly**: Avoid production issues that lead to repeated calls

## Support

For Vapi-specific issues:
- [Vapi Documentation](https://docs.vapi.ai)
- [Vapi Discord](https://discord.gg/vapi)
- [Vapi Status](https://status.vapi.ai)

For integration issues:
- Check the browser console for errors
- Review backend logs for API errors
- Test with the provided curl examples
