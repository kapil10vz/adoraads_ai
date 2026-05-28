# Loops.so Integration Setup

Complete guide to integrate Loops.so with your adoraads waitlist server.

## Why Loops?

- 📧 Beautiful email templates built-in
- 🔄 Automation workflows
- 📊 Better analytics and segmentation
- 💰 Great pricing for startups
- 🎯 Excellent for waitlist campaigns

## Setup Steps

### 1. Get Your Loops API Key

1. Go to https://app.loops.so/
2. Sign in (or create account)
3. Go to **Settings** → **Integrations** → **API**
4. Copy your **API Key**

### 2. Add to .env

Edit your `.env` file and add:

```bash
LOOPS_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the key from step 1.

### 3. Test It

Start your server:
```bash
npm start
```

Send a test signup:
```bash
curl -X POST http://localhost:3010/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "brand_name": "Test Beauty Co",
    "brand_tier": "indie"
  }'
```

Check your Loops dashboard → **Contacts** to see the new contact!

### 4. Deploy to Railway

Once tested, push your changes:

```bash
git add .env
git commit -m "Add Loops integration"
git push origin main
```

Then add `LOOPS_API_KEY` to Railway:
1. Go to railway.app → Project → Settings
2. Click **Variables**
3. Add new variable:
   - Key: `LOOPS_API_KEY`
   - Value: Your API key from step 1

## What Gets Sent to Loops

When someone signs up, this data is sent to Loops:

```json
{
  "email": "user@example.com",
  "firstName": "User Name",
  "customFields": {
    "brand_name": "Beauty Brand",
    "brand_tier": "indie",
    "waitlist_signup": true
  }
}
```

## Create Automations in Loops

After contacts are synced, create automations:

### Option 1: Welcome Email Series
1. In Loops: **Automations** → **New**
2. Trigger: **Contact Added**
3. Add email steps:
   - Step 1: Welcome email (day 0)
   - Step 2: Feature overview (day 3)
   - Step 3: Special offer (day 7)

### Option 2: Segment by Tier
Create different automations for different tiers:

```
If brand_tier = "prestige"
  → Send premium waitlist email
If brand_tier = "indie"
  → Send indie-focused email
```

## Custom Fields

You can add more custom fields in the `syncToLoops` function:

Edit `waitlist-server.js` line ~168:

```javascript
customFields: {
  brand_name: brandName || "",
  brand_tier: brandTier || "indie",
  waitlist_signup: true,
  // Add more here:
  referral_code: refCode || "",
  signup_source: source || "",
  // ... etc
},
```

Then use these in Loops automations to personalize emails.

## Combine with Other Services

You can use **both** Mailchimp and Loops:

```bash
# In .env, set both:
MAILCHIMP_API_KEY=your_key
MAILCHIMP_LIST_ID=your_list
LOOPS_API_KEY=your_key
```

The server will sync to **both** automatically.

Or use **just** Loops:

```bash
# In .env, only set:
LOOPS_API_KEY=your_key
```

## Troubleshooting

### Contacts not appearing in Loops

1. Check API key is correct:
   ```bash
   grep LOOPS_API_KEY .env
   ```

2. Check server logs:
   ```bash
   npm start
   # Look for: "📧 Loops synced: email@example.com"
   ```

3. Verify in Loops:
   - Go to **Contacts**
   - Search for the test email
   - Check **Activity** tab

### Email bouncing?

Verify the email address is correct in the signup:
```bash
curl -X POST http://localhost:3010/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"valid-email@example.com"}'
```

## Loops Resources

- **Docs:** https://loops.so/docs
- **API Docs:** https://loops.so/docs/api-reference/contacts/create
- **Automations:** https://loops.so/docs/email-campaigns/automations
- **Custom Fields:** https://loops.so/docs/contacts/custom-fields

## Next Steps

1. ✅ Create API key
2. ✅ Add to `.env`
3. ✅ Test locally
4. ✅ Deploy to Railway
5. 📧 Create welcome automation in Loops
6. 🎯 Segment contacts by tier
7. 📊 Monitor open rates and clicks

Good luck! 🚀
