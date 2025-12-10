# Vapi Voice AI Integration - Key Findings

## Problem Summary
Vapi webhook tool calls were failing with "No result returned" error. The AI assistant collected user info but failed when calling `createTicket` function.

---

## Root Causes Found

### 1. Transient Assistant Config Issue
**Problem:** Using transient assistant config (inline config saat `vapi.start()`) menyebabkan error `{}` di Web SDK client.

**Solution:** Buat Assistant di Vapi Dashboard via API, lalu pakai Assistant ID.

```javascript
// TIDAK WORK - Transient config
const call = await vapi.start(assistantConfig) // Error: {}

// WORK - Pakai Assistant ID
const call = await vapi.start('6620d1c3-3732-4418-96be-72766eddad35')
```

### 2. Missing `serverMessages` Config
**Problem:** Vapi TIDAK mengirim `tool-calls` event ke webhook karena `serverMessages` tidak di-set.

**Solution:** Tambahkan `serverMessages` saat create/update assistant:

```json
{
  "serverMessages": ["tool-calls", "status-update", "end-of-call-report"]
}
```

Tanpa ini, tool calls hanya muncul di `end-of-call-report` (post-call), bukan real-time.

### 3. Tool Call Payload Format
**Problem:** Vapi mengirim `toolCallList` dengan format OpenAI (nested `function` object), bukan flat.

**Actual payload structure:**
```json
{
  "message": {
    "type": "tool-calls",
    "toolCallList": [
      {
        "id": "call_xxx",
        "function": {
          "name": "createTicket",
          "arguments": "{\"category\":\"SOSIAL\",...}"
        }
      }
    ]
  }
}
```

**Solution:** Update extractor untuk handle nested `function` property:

```javascript
const tc = msg.toolCallList[0]
const fn = tc.function // <-- Check this first!
if (fn?.name) {
  return {
    toolCallId: tc.id,
    name: fn.name,
    params: parseArgs(fn.arguments)
  }
}
```

### 4. Response Format
**Correct response format untuk Vapi:**
```json
{
  "results": [
    {
      "toolCallId": "call_xxx",
      "name": "createTicket",
      "result": "Laporan berhasil dicatat..."
    }
  ]
}
```

---

## Working Configuration

### Assistant Config (via API)
```bash
curl -X POST "https://api.vapi.ai/assistant" \
  -H "Authorization: Bearer $VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SatuPintu Bandung",
    "firstMessage": "Halo, selamat datang di SatuPintu...",
    "serverUrl": "https://your-ngrok.ngrok-free.app/api/vapi/webhook",
    "serverMessages": ["tool-calls", "status-update", "end-of-call-report"],
    "model": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "messages": [{"role": "system", "content": "..."}],
      "tools": [
        {
          "type": "function",
          "function": {
            "name": "createTicket",
            "description": "...",
            "parameters": {...}
          }
        }
      ]
    },
    "voice": {
      "provider": "11labs",
      "voiceId": "kSzQ9oZF2iytkgNNztpH",
      "model": "eleven_multilingual_v2",
      "stability": 0.55,
      "similarityBoost": 0.75,
      "style": 0.30,
      "speed": 0.92
    },
    "transcriber": {
      "provider": "google",
      "model": "gemini-2.0-flash",
      "language": "id"
    }
  }'
```

### Client-side Call
```javascript
const vapi = new Vapi(PUBLIC_KEY)
await vapi.start(ASSISTANT_ID) // Use ID, not inline config
```

---

## Files Modified

1. **`/app/src/lib/vapi.ts`** - Assistant config (untuk reference, tapi tidak dipakai untuk web call)
2. **`/app/src/app/api/vapi/webhook/route.ts`** - Webhook handler dengan universal tool call extractor
3. **`/app/src/app/test-call/page.tsx`** - Changed to use Assistant ID instead of transient config

---

## Current Assistant ID
```
6620d1c3-3732-4418-96be-72766eddad35
```

## Current Webhook URL (ngrok - temporary)
```
https://ad46f2a06660.ngrok-free.app/api/vapi/webhook
```

⚠️ **Note:** ngrok URL berubah setiap restart. Update di Vapi Dashboard atau via API:
```bash
curl -X PATCH "https://api.vapi.ai/assistant/ASSISTANT_ID" \
  -H "Authorization: Bearer $VAPI_PRIVATE_KEY" \
  -d '{"serverUrl": "https://NEW-URL.ngrok-free.app/api/vapi/webhook"}'
```

---

## Checklist for Future Debugging

- [ ] Is `serverMessages` set and includes `"tool-calls"`?
- [ ] Is `serverUrl` pointing to correct webhook?
- [ ] Is ngrok running and URL updated in Vapi?
- [ ] Is webhook handler checking `toolCallList[0].function.name` (OpenAI format)?
- [ ] Is response format correct (`results` array with `toolCallId`, `name`, `result`)?

---

## Timeline
- **Problem discovered:** Tool calls showing "No result returned" in end-of-call-report
- **Root cause 1:** `serverMessages` not configured - Vapi wasn't sending tool-calls to webhook
- **Root cause 2:** Transient assistant config causing SDK error
- **Root cause 3:** Webhook extractor not handling OpenAI nested function format
- **Fixed:** 2025-12-04
