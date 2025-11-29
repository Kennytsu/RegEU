# Vapi Quick Setup for Hackathon

## 1. Create Vapi Account
Go to https://dashboard.vapi.ai and sign up

## 2. Get Your Public Key
1. Go to Settings → API Keys
2. Copy your **Public Key** (starts with your account ID)
3. Add to `frontend/.env`:
   ```
   VITE_VAPI_PUBLIC_KEY=your_public_key_here
   ```

## 3. Create Assistant

### Option A: Quick Generic Assistant (Recommended for Demo)

1. Click "Create Assistant"
2. **Name**: EUgene
3. **Model**: gpt-4o (or gpt-4o-mini for cheaper testing)
4. **Voice**: Choose a professional voice like:
   - `en-US-neural2-J` (male, professional)
   - `en-US-neural2-H` (female, professional)
   - Or browse and test voices

5. **System Prompt** (paste this):
```
You are EUgene, a friendly and knowledgeable EU regulatory compliance assistant.

Your role is to help users understand EU regulations like GDPR, AI Act, Cybersecurity, AML, KYC, and ESG.

Be friendly, professional, and clear. Explain complex regulations in simple terms.

When the call starts:
1. Greet the user warmly
2. Ask how you can help with EU compliance
3. Listen and provide helpful, accurate information
4. Offer to answer follow-up questions
5. End professionally when they're satisfied

Keep responses concise and conversational for voice calls.
```

6. **First Message** (paste this):
```
Hello! I'm EUgene, your EU regulatory compliance assistant. How can I help you today?
```

7. **Settings**:
   - **Temperature**: 0.7
   - **Max Tokens**: 150 (keep responses concise for voice)
   - **Enable Transcription**: Yes (helpful for debugging)

8. Click **Save**

9. Copy the **Assistant ID** (shown at the top)

10. Add to `frontend/.env`:
    ```
    VITE_VAPI_ASSISTANT_ID=your_assistant_id_here
    ```

### Option B: Advanced Setup with Variables (for personalized notifications)

If you want to use the token-based personalized mode, use the prompts from `/frontend/src/lib/vapi-config.ts`:
- Use `VAPI_SYSTEM_PROMPT_TEMPLATE` for system prompt
- Use `VAPI_FIRST_MESSAGE_TEMPLATE` for first message
- This enables the {{userName}}, {{regulationType}}, etc. variables

## 4. Test Configuration

1. Restart your frontend dev server (to pick up .env changes):
   ```bash
   # Stop the current server (Ctrl+C) then:
   cd frontend
   yarn dev
   ```

2. Click the EUgene tab in navbar
3. Click "Talk to EUgene"
4. **Allow microphone access** when prompted
5. Wait for EUgene to greet you
6. Try asking: "Can you explain GDPR to me?"

## Troubleshooting

### EUgene connects but doesn't speak:
- Check that First Message is set in assistant config
- Try refreshing the page and reconnecting
- Check browser console for errors
- Make sure you allowed microphone permissions

### Can't connect at all:
- Verify VITE_VAPI_PUBLIC_KEY is correct in .env
- Verify VITE_VAPI_ASSISTANT_ID is correct in .env
- Restart frontend dev server after .env changes
- Check that assistant is "Published" in Vapi dashboard

### No response to questions:
- Check that System Prompt is set
- Try using gpt-4o instead of gpt-4o-mini
- Increase max tokens if responses are cut off
- Check Vapi dashboard logs for errors

### Microphone not working:
- Make sure you clicked "Allow" on the microphone permission prompt
- Check browser settings → Site settings → Microphone
- Try a different browser (Chrome works best)

## Quick Test Script

After setup, test with:
```bash
cd backend
python test_voice_call.py
```

This generates a personalized regulatory update link to test the full flow.

## Cost Notes for Hackathon

- Vapi charges per minute of call time
- gpt-4o-mini is cheaper than gpt-4o
- Most demo calls are 1-3 minutes
- Free tier should cover hackathon testing
- Keep calls short during testing!
